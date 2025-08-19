import {
  Component,
  OnInit,
  OnDestroy,
  ChangeDetectorRef,
  NgZone,
  ChangeDetectionStrategy,
  TrackByFunction,
  ViewChild,
  ElementRef,
  AfterViewChecked,
} from '@angular/core';
import { TopNavigatorComponent } from '../../../shared/top-navigator/top-navigator.component';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { Subscription, Subject, BehaviorSubject } from 'rxjs';
import { takeUntil, debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { ChatStompService, ChatMessage } from './chat-stomp.service';
import { AuthService } from '../../../auth/auth.service';
import { trackByMessageId } from '../../../shared/services/performance';
import { environment } from '../../../../environments/environment';
import { UrlService } from '../../../shared/services/url.service';
import { ChatService, ExpertDTO } from '../../../shared/services/chat.service';
import { ConversationDTO } from './conversation.interface';
import { ToastService } from '../../../shared/toast/toast.service';
import { FooterComponent } from '../../../shared/footer/footer.component';

@Component({
  selector: 'app-vip-chat',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, TopNavigatorComponent, FooterComponent],
  templateUrl: './chat.component.html',
  styleUrls: ['./chat.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ChatComponent implements OnInit, OnDestroy, AfterViewChecked {
  // Mobile responsive properties for template
  public isMobile = window.innerWidth <= 768;
  public sidebarVisible = window.innerWidth > 768;
  public showChatView = false;

  // Enhanced chat state management
  private messagesSubject = new BehaviorSubject<ChatMessage[]>([]);
  public messages$ = this.messagesSubject.asObservable();
  
  // Private chat state
  private conversationsSubject = new BehaviorSubject<ConversationDTO[]>([]);
  public conversations$ = this.conversationsSubject.asObservable();
  
  // UI state
  public loading = false;
  public error = '';
  public currentUserId: string | null = null;
  public selectedConversation: ConversationDTO | null = null;
  public showPrivateChat = false;
  public chatType: 'COMMUNITY' | 'PRIVATE' = 'COMMUNITY';
  public newMessage = '';
  public isTyping = false;
  public typingUsers = new Set<string>();
  
  // Expert list
  public experts: ExpertDTO[] = [];
  public searchQuery = '';
  
  // View references
  @ViewChild('messagesContainer', { static: false }) messagesContainer!: ElementRef;
  
  // Private properties
  private shouldScrollToBottom = false;
  private lastMessageCount = 0;
  private destroy$ = new Subject<void>();
  private typingTimeout?: any;
  private wsSub?: Subscription;
  private wsErrSub?: Subscription;
  private wsPrivateSub?: Subscription;
  private wsTypingSub?: Subscription;

  // Getters for template access
  get conversations(): ConversationDTO[] {
    return this.conversationsSubject.value;
  }

  get messages(): ChatMessage[] {
    return this.messagesSubject.value;
  }

  constructor(
    private http: HttpClient,
    private cdr: ChangeDetectorRef,
    private ws: ChatStompService,
    private zone: NgZone,
    private authService: AuthService,
    private urlService: UrlService,
    private chatService: ChatService,
    private toastService: ToastService
  ) {}

  ngOnInit(): void {
    this.initializeChat();
    this.setupWebSocketSubscriptions();
    this.setupSearchFilter();
  }

  private initializeChat(): void {
    // Kiểm tra quyền truy cập VIP
    const userRole = this.authService.getCurrentUserRole();
    if (userRole !== 'VIP' && userRole !== 'EXPERT') {
      this.error = 'Bạn cần có tài khoản VIP để truy cập phòng chat này.';
      this.cdr.markForCheck();
      return;
    }

    this.currentUserId = this.authService.getCurrentUserId();
    if (!this.currentUserId) {
      // No current user ID found
    }

    // Subscribe to chat API availability
    this.chatService.chatApisAvailable$.subscribe(available => {
      if (!available && this.urlService.isProduction()) {
        this.toastService.warning('Chat APIs are temporarily unavailable. Some features may not work properly.', 8000);
      }
    });

    // Load initial data
    this.loadExperts();
    this.loadConversations();
    this.fetchHistory();

    // Connect WebSocket
    this.ws.connect().catch((err) => {
      this.error = 'Không thể kết nối chat: ' + (err.message || err);
      this.cdr.markForCheck();
    });
  }

  private setupWebSocketSubscriptions(): void {
    // Community messages subscription
    this.wsSub = this.ws.onCommunityMessage().subscribe((msg: ChatMessage) => {
      this.zone.run(() => {
        if (!this.showPrivateChat && msg.chatType === 'COMMUNITY') {
          this.addMessageToChat(msg);
          this.cdr.markForCheck();
          this.scrollToBottom();
        }
      });
    });

    // Private messages subscription
    this.wsPrivateSub = this.ws.onPrivateMessage().subscribe((msg: ChatMessage) => {
      this.zone.run(() => {
        if (this.showPrivateChat && 
            this.selectedConversation && 
            this.currentUserId &&
            msg.chatType === 'PRIVATE' &&
            this.isMessageInCurrentConversation(msg)) {
          this.addMessageToChat(msg);
          this.updateConversationWithMessage(msg);
          this.cdr.markForCheck();
          this.scrollToBottom();
        }
      });
    });

    // Error subscription
    this.wsErrSub = this.ws.onError().subscribe((err: string) => {
      this.zone.run(() => {
        this.error = err;
        this.toastService.error(err, 5000);
        this.cdr.markForCheck();
      });
    });
  }

  private setupSearchFilter(): void {
    // Filter experts based on search query with debounce
    // This will be handled by the getter
  }

  // Enhanced message management
  private addMessageToChat(message: ChatMessage): void {
    const currentMessages = this.messagesSubject.value;
    const updatedMessages = [...currentMessages, message];
    this.messagesSubject.next(updatedMessages);
    this.checkIfShouldScroll();
  }

  private isMessageInCurrentConversation(message: ChatMessage): boolean {
    if (!this.selectedConversation || !message.senderId || !message.receiverId) {
      return false;
    }
    
    const currentUserId = +this.currentUserId!;
    const otherUserId = this.selectedConversation.otherUserId;
    
    return (message.senderId === otherUserId && message.receiverId === currentUserId) ||
           (message.receiverId === otherUserId && message.senderId === currentUserId);
  }

  private updateConversationWithMessage(message: ChatMessage): void {
    const conversations = this.conversationsSubject.value;
    const conversationId = this.generateConversationId(
      message.senderId || 0, 
      message.receiverId || 0
    );
    
    const conversationIndex = conversations.findIndex(c => c.conversationId === conversationId);
    
    if (conversationIndex !== -1) {
      const updatedConversations = [...conversations];
      updatedConversations[conversationIndex] = {
        ...updatedConversations[conversationIndex],
        lastMessage: message.content,
        lastMessageTime: message.timestamp || new Date().toISOString(),
        hasUnreadMessages: true
      };
      
      // Move to top
      const conversation = updatedConversations.splice(conversationIndex, 1)[0];
      updatedConversations.unshift(conversation);
      
      this.conversationsSubject.next(updatedConversations);
    }
  }

  // Enhanced conversation management
  public loadConversations(): void {
    this.loading = true;
    
    this.chatService.getConversations().subscribe({
      next: (data) => {
        this.conversationsSubject.next(data);
        this.loading = false;
        this.cdr.markForCheck();
      },
              error: (err) => {
          this.error = 'Không thể tải danh sách trò chuyện';
          this.loading = false;
          this.cdr.markForCheck();
        }
    });
  }

  public selectConversation(conversation: ConversationDTO): void {
    this.selectedConversation = conversation;
    this.showPrivateChat = true;
    this.chatType = 'PRIVATE';
    this.loadPrivateMessages(conversation.otherUserId);
    
    // Bỏ tính năng mark messages as read để tránh lỗi
    // this.markMessagesAsRead();
  }

  public loadPrivateMessages(otherUserId: number): void {
    this.loading = true;
    
    this.chatService.getPrivateMessages(otherUserId).subscribe({
      next: (data) => {
        const privateMessages = (data || []).filter(
          (m: any) => m.chatType === 'PRIVATE'
        );
        this.messagesSubject.next(privateMessages);
        this.loading = false;
        this.checkIfShouldScroll();
        this.cdr.markForCheck();
      },
      error: (err) => {
        this.error = 'Không thể tải tin nhắn';
        this.loading = false;
        this.cdr.markForCheck();
      }
    });
  }

  public startConversationWithExpert(expert: ExpertDTO): void {
    if (!this.currentUserId) {
      this.error = 'Không thể xác định người dùng';
      this.cdr.markForCheck();
      return;
    }

    const conversationId = this.generateConversationId(this.currentUserId, expert.id);
    
    // Check if conversation already exists
    const existingConversation = this.conversationsSubject.value.find(c => c.conversationId === conversationId);
    
    if (existingConversation) {
      this.selectConversation(existingConversation);
    } else {
      // Create new conversation
      const newConversation: ConversationDTO = {
        conversationId: conversationId,
        otherUserId: expert.id,
        otherUsername: expert.username,
        otherUserRole: expert.role,
        lastMessage: '',
        lastMessageTime: '',
        hasUnreadMessages: false
      };
      
      const currentConversations = this.conversationsSubject.value;
      this.conversationsSubject.next([newConversation, ...currentConversations]);
      this.selectConversation(newConversation);
    }
  }

  // Touch event handlers cho mobile
  public onTouchStart(event: TouchEvent, expert: ExpertDTO): void {
    event.preventDefault();
  }

  public onTouchEnd(event: TouchEvent, expert: ExpertDTO): void {
    event.preventDefault();
    this.startConversationWithExpert(expert);
  }

  public onTouchStartConversation(event: TouchEvent, conversation: ConversationDTO): void {
    event.preventDefault();
  }

  public onTouchEndConversation(event: TouchEvent, conversation: ConversationDTO): void {
    event.preventDefault();
    this.selectConversation(conversation);
  }

  // Enhanced message sending
  public sendMessage(): void {
    if (!this.newMessage.trim()) return;

    const userId = this.authService.getCurrentUserId();
    const userRole = this.authService.getCurrentUserRole();

    if (!userId) {
      this.error = 'Không thể xác định người dùng. Vui lòng đăng nhập lại.';
      this.cdr.markForCheck();
      return;
    }

    if (!userRole || (userRole !== 'VIP' && userRole !== 'EXPERT')) {
      this.error = 'Chỉ tài khoản VIP hoặc Chuyên gia mới được chat.';
      this.cdr.markForCheck();
      return;
    }

    const message: ChatMessage = {
      senderId: +userId,
      content: this.newMessage.trim(),
      senderRole: userRole,
      timestamp: new Date().toISOString(),
      chatType: this.selectedConversation ? 'PRIVATE' : 'COMMUNITY'
    };

    if (this.selectedConversation) {
      // Private chat
      message.conversationId = this.selectedConversation.conversationId;
      message.receiverId = this.selectedConversation.otherUserId;
      
      // Add message locally for immediate feedback
      this.addMessageToChat(message);
      
      this.ws.sendPrivateMessage(message).catch(err => {
        this.error = 'Không thể gửi tin nhắn: ' + err;
        this.toastService.error(this.error, 5000);
        this.cdr.markForCheck();
      });
    } else {
      // Community chat
      this.addMessageToChat(message);
      
      this.ws.sendMessage(message).catch(err => {
        this.error = 'Không thể gửi tin nhắn: ' + err;
        this.toastService.error(this.error, 5000);
        this.cdr.markForCheck();
      });
    }

    this.newMessage = '';
    this.error = '';
    
    // Scroll to bottom after sending message
    setTimeout(() => {
      this.scrollToBottomSmooth();
    }, 100);
    
    this.cdr.markForCheck();
  }

  // Typing indicators
  public onTyping(): void {
    if (this.typingTimeout) {
      clearTimeout(this.typingTimeout);
    }
    
    this.isTyping = true;
    this.cdr.markForCheck();
    
    // Send typing indicator
    if (this.selectedConversation) {
      this.ws.sendTypingIndicator({
        conversationId: this.selectedConversation.conversationId,
        isTyping: true
      });
    }
    
    // Clear typing indicator after delay
    this.typingTimeout = setTimeout(() => {
      this.isTyping = false;
      if (this.selectedConversation) {
        this.ws.sendTypingIndicator({
          conversationId: this.selectedConversation.conversationId,
          isTyping: false
        });
      }
      this.cdr.markForCheck();
    }, 3000);
  }

  // Enhanced filtering
  public get filteredMessages(): ChatMessage[] {
    if (this.showPrivateChat && this.selectedConversation && this.currentUserId) {
      const otherUserId = this.selectedConversation.otherUserId;
      const currentUserId = +this.currentUserId;
      return this.messagesSubject.value.filter(
        (m: any) =>
          m.chatType === 'PRIVATE' &&
          ((m.senderId === otherUserId && m.receiverId === currentUserId) ||
           (m.receiverId === otherUserId && m.senderId === currentUserId))
      );
    } else {
      return this.messagesSubject.value.filter(
        (m: any) => m.chatType === 'COMMUNITY'
      );
    }
  }

  public get filteredExperts(): ExpertDTO[] {
    if (!this.searchQuery.trim()) {
      return this.experts;
    }
    
    const query = this.searchQuery.toLowerCase();
    return this.experts.filter(expert => 
      expert.username.toLowerCase().includes(query) ||
      expert.role.toLowerCase().includes(query)
    );
  }

  // Utility methods
  public trackMessage(index: number, message: ChatMessage): any {
    return message.timestamp || index;
  }

  public isOwnMessage(message: ChatMessage): boolean {
    if (!this.currentUserId || !message.senderId) {
      return false;
    }
    return this.currentUserId.toString().trim() === message.senderId.toString().trim();
  }

  public getAvatarUrl(message: ChatMessage): string {
    return 'assets/image/default-avatar.png';
  }

  public getRoleBadgeClass(role?: string): string {
    switch (role) {
      case 'VIP': return 'vip-badge';
      case 'EXPERT': return 'expert-badge';
      default: return 'user-badge';
    }
  }

  public getRoleDisplayName(role?: string): string {
    switch (role) {
      case 'VIP': return 'VIP';
      case 'EXPERT': return 'Chuyên gia';
      default: return 'Thành viên';
    }
  }

  public getSenderName(msg: ChatMessage): string {
    if (this.isOwnMessage(msg)) {
      return '';
    } else {
      if (this.selectedConversation && this.showPrivateChat) {
        return this.selectedConversation.otherUsername;
      }
      return `User ${msg.senderId}`;
    }
  }

  // Navigation methods
  public openCommunityChat(): void {
    this.showPrivateChat = false;
    this.selectedConversation = null;
    this.chatType = 'COMMUNITY';
    this.showChatView = true;
    this.fetchHistory();
    this.cdr.markForCheck();
  }

  public goBackToList(): void {
    this.showChatView = false;
    this.selectedConversation = null;
    this.showPrivateChat = false;
    this.cdr.markForCheck();
  }

  public switchToPrivateChat(): void {
    this.showPrivateChat = true;
    this.chatType = 'PRIVATE';
    this.selectedConversation = null;
    this.messagesSubject.next([]);
    this.loadConversations();
    this.loadExperts();
  }

  public switchToCommunityChat(): void {
    this.showPrivateChat = false;
    this.chatType = 'COMMUNITY';
    this.selectedConversation = null;
    this.messagesSubject.next([]);
    this.loadExperts();
    this.loadConversations();
    this.fetchHistory();
  }

  // Data loading methods
  public fetchHistory(): void {
    this.loading = true;
    this.error = '';

    this.chatService.getChatHistory().subscribe({
      next: (data: any) => {
        const messages = Array.isArray(data) ? data : data?.data || [];
        this.messagesSubject.next(messages);
        this.loading = false;
        this.checkIfShouldScroll();
        this.cdr.markForCheck();
      },
              error: (err) => {
          this.error = 'Không thể tải lịch sử chat';
          this.loading = false;
          this.cdr.markForCheck();
        },
    });
  }

  public loadExperts(): void {
    this.loading = true;
    
    this.chatService.getExperts().subscribe({
      next: (data) => {
        this.experts = data;
        this.loading = false;
        this.cdr.markForCheck();
      },
              error: (err) => {
          this.error = 'Không thể tải danh sách chuyên gia';
          this.loading = false;
          this.cdr.markForCheck();
        }
    });
  }

  // Helper methods
  private generateConversationId(user1Id: string | number, user2Id: number): string {
    const minId = Math.min(+user1Id, user2Id);
    const maxId = Math.max(+user1Id, user2Id);
    return `conv_${minId}_${maxId}`;
  }

  public onEnterPress(event: KeyboardEvent): void {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      this.sendMessage();
    }
  }

  public getInputPlaceholder(): string {
    if (this.selectedConversation) {
      return `Nhập tin nhắn cho ${this.selectedConversation.otherUsername}...`;
    }
    return 'Nhập tin nhắn VIP của bạn...';
  }

  // Mobile responsive methods
  public closeSidebarOnMobile(): void {
    if (this.isMobile) {
      this.sidebarVisible = false;
      this.cdr.detectChanges();
    }
  }

  // Time formatting methods
  public formatTimePretty(timestamp?: string): string {
    if (!timestamp) return '';
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffSec = Math.floor(diffMs / 1000);
    const diffMin = Math.floor(diffSec / 60);
    const diffHour = Math.floor(diffMin / 60);
    const diffDay = Math.floor(diffHour / 24);

    if (diffSec < 10) return 'Vừa xong';
    if (diffSec < 60) return `${diffSec} giây trước`;
    if (diffMin < 60) return `${diffMin} phút trước`;
    if (diffHour < 24 && date.toDateString() === now.toDateString()) {
      return `${diffHour} giờ trước`;
    }
    
    const yesterday = new Date(now);
    yesterday.setDate(now.getDate() - 1);
    if (date.toDateString() === yesterday.toDateString()) {
      return `Hôm qua ${date.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', hour12: false })}`;
    }
    
    return `${date.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' })} ${date.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', hour12: false })}`;
  }

  public formatTime(timestamp?: string): string {
    if (!timestamp) return '';

    const date = new Date(timestamp);
    const now = new Date();
    const isToday = date.toDateString() === now.toDateString();
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    const isYesterday = date.toDateString() === yesterday.toDateString();

    const timeString = date.toLocaleTimeString('vi-VN', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    });

    if (isToday) {
      return timeString;
    } else if (isYesterday) {
      return `Hôm qua ${timeString}`;
    } else {
      const dateString = date.toLocaleDateString('vi-VN', {
        day: '2-digit',
        month: '2-digit',
      });
      return `${dateString} ${timeString}`;
    }
  }

  // Scroll management
  ngAfterViewChecked(): void {
    if (this.shouldScrollToBottom) {
      this.scrollToBottom();
      this.shouldScrollToBottom = false;
    }
  }

  private scrollToBottom(): void {
    try {
      if (this.messagesContainer) {
        const element = this.messagesContainer.nativeElement;
        element.scrollTop = element.scrollHeight;
      }
    } catch (err) {
      // Error scrolling to bottom
    }
  }

  private scrollToBottomSmooth(): void {
    try {
      if (this.messagesContainer) {
        const element = this.messagesContainer.nativeElement;
        element.scrollTo({
          top: element.scrollHeight,
          behavior: 'smooth'
        });
      }
    } catch (err) {
      // Error smooth scrolling to bottom
    }
  }

  private checkIfShouldScroll(): void {
    if (this.messagesSubject.value.length !== this.lastMessageCount) {
      this.shouldScrollToBottom = true;
      this.lastMessageCount = this.messagesSubject.value.length;
    }
  }

  // Cleanup
  ngOnDestroy(): void {
    if (this.typingTimeout) {
      clearTimeout(this.typingTimeout);
    }
    
    this.wsSub?.unsubscribe();
    this.wsErrSub?.unsubscribe();
    this.wsPrivateSub?.unsubscribe();
    this.wsTypingSub?.unsubscribe();
    this.ws.disconnect();

    this.destroy$.next();
    this.destroy$.complete();
  }
}
