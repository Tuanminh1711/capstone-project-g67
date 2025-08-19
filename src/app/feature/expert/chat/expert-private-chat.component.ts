import { Component, OnInit, OnDestroy, ChangeDetectorRef, NgZone } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { Router, ActivatedRoute } from '@angular/router';
import { AuthService } from '../../../auth/auth.service';
import { ExpertLayoutComponent } from '../shared/expert-layout/expert-layout.component';
import { ExpertChatStompService, ChatMessage } from './expert-chat-stomp.service';
import { Subscription, BehaviorSubject } from 'rxjs';
import { UrlService } from '../../../shared/services/url.service';
import { ChatService } from '../../../shared/services/chat.service';
import { ToastService } from '../../../shared/toast/toast.service';

export interface PrivateConversation {
  conversationId: string;
  otherUserId: number;
  otherUsername: string;
  otherUserRole: string;
  lastMessage: string;
  lastMessageTime: string;
  hasUnreadMessages: boolean;
}

@Component({
  selector: 'app-expert-private-chat',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './expert-private-chat.component.html',
  styleUrls: ['./expert-private-chat.component.scss']
})
export class ExpertPrivateChatComponent implements OnInit, OnDestroy {
  // Enhanced chat state management
  private messagesSubject = new BehaviorSubject<ChatMessage[]>([]);
  public messages$ = this.messagesSubject.asObservable();
  
  // Private chat state
  private conversationsSubject = new BehaviorSubject<PrivateConversation[]>([]);
  public conversations$ = this.conversationsSubject.asObservable();
  
  // UI state
  public loading = false;
  public error = '';
  public newMessage = '';
  public showConversationList = true;
  public isTyping = false;
  public typingUsers = new Set<string>();
  
  // WebSocket subscriptions
  private wsSub?: Subscription;
  private wsErrSub?: Subscription;
  private wsPrivateSub?: Subscription;
  private wsTypingSub?: Subscription;
  
  // User info
  public currentUserId: string | null = null;
  public currentUserRole: string | null = null;
  
  // Selected conversation
  public selectedConversation: PrivateConversation | null = null;
  
  // Typing timeout
  private typingTimeout?: any;

  // Getters for template access
  get conversations(): PrivateConversation[] {
    return this.conversationsSubject.value;
  }

  get messages(): ChatMessage[] {
    return this.messagesSubject.value;
  }

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private authService: AuthService,
    private cdr: ChangeDetectorRef,
    private zone: NgZone,
    private ws: ExpertChatStompService,
    private http: HttpClient,
    private urlService: UrlService,
    private chatService: ChatService,
    private toastService: ToastService
  ) {}

  ngOnInit(): void {
    this.initializeChat();
    this.setupWebSocketSubscriptions();
  }

  private initializeChat(): void {
    this.currentUserId = this.authService.getCurrentUserId();
    this.currentUserRole = this.authService.getCurrentUserRole();
    
    if (!this.currentUserId) {
      console.warn('⚠️ No current user ID found! User might not be logged in properly.');
      this.error = 'Không thể xác định người dùng. Vui lòng đăng nhập lại.';
      return;
    }

    // Subscribe to chat API availability
    this.chatService.chatApisAvailable$.subscribe(available => {
      if (!available && this.urlService.isProduction()) {
        this.toastService.warning('Chat APIs are temporarily unavailable. Some features may not work properly.', 8000);
      }
    });

    // Lấy conversationId từ queryParams nếu có
    this.route.queryParams.subscribe(params => {
      const conversationId = params['conversationId'];
      this.loadConversationsWithSelect(conversationId);
    });
    
    // Connect WebSocket
    this.connectToChat();
  }

  private setupWebSocketSubscriptions(): void {
    // Private messages subscription
    this.wsPrivateSub = this.ws.onPrivateMessage().subscribe((msg: ChatMessage) => {
      this.zone.run(() => {
        if (msg.chatType === 'PRIVATE' && 
            this.currentUserId &&
            (msg.senderId === +this.currentUserId || msg.receiverId === +this.currentUserId)) {
          // Expert received private message
          
          // Add message to chat if it's in the current conversation
          if (this.selectedConversation && this.isMessageInCurrentConversation(msg)) {
            this.addMessageToChat(msg);
            this.cdr.markForCheck();
            this.scrollToBottom();
          }
          
          // Update conversation list
          this.updateConversationWithMessage(msg);
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

  // Enhanced message management
  private addMessageToChat(message: ChatMessage): void {
    const currentMessages = this.messagesSubject.value;
    const updatedMessages = [...currentMessages, message];
    this.messagesSubject.next(updatedMessages);
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
    if (!this.currentUserId || !message.senderId || !message.receiverId) return;
    
    const conversationId = this.generateConversationId(message.senderId, message.receiverId);
    const otherUserId = message.senderId === +this.currentUserId ? message.receiverId : message.senderId;
    
    const conversations = this.conversationsSubject.value;
    let conversation = conversations.find(c => c.conversationId === conversationId);
    
    if (!conversation) {
      // Create new conversation
      conversation = {
        conversationId: conversationId,
        otherUserId: otherUserId,
        otherUsername: `User ${otherUserId}`,
        otherUserRole: message.senderRole || 'VIP',
        lastMessage: message.content,
        lastMessageTime: message.timestamp || new Date().toISOString(),
        hasUnreadMessages: true
      };
      const updatedConversations = [conversation, ...conversations];
      this.conversationsSubject.next(updatedConversations);
    } else {
      // Update existing conversation
      const updatedConversations = conversations.map(c => 
        c.conversationId === conversationId 
          ? { ...c, lastMessage: message.content, lastMessageTime: message.timestamp || new Date().toISOString(), hasUnreadMessages: true }
          : c
      );
      
      // Move to top
      const conversationToMove = updatedConversations.find(c => c.conversationId === conversationId);
      if (conversationToMove) {
        const filteredConversations = updatedConversations.filter(c => c.conversationId !== conversationId);
        this.conversationsSubject.next([conversationToMove, ...filteredConversations]);
      }
    }
    
    this.cdr.markForCheck();
  }

  // Load conversations và tự động chọn nếu có conversationId
  public loadConversationsWithSelect(conversationId?: string): void {
    this.loading = true;
    
    this.chatService.getConversations().subscribe({
      next: (data) => {
        // Convert ConversationDTO[] to PrivateConversation[]
        const conversations = data.map(conv => this.convertToPrivateConversation(conv));
        
        // Update conversations
        this.conversationsSubject.next(conversations);
        this.loading = false;
        
        // Force UI update
        this.cdr.detectChanges();
        
        if (conversationId) {
          const found = conversations.find(c => c.conversationId === conversationId);
          if (found) {
            this.selectConversation(found);
          } else {
            console.warn('⚠️ [DEBUG] Conversation not found with ID:', conversationId);
          }
        }
      },
      error: (err) => {
        console.error('❌ [DEBUG] Error loading conversations:', err);
        this.error = 'Không thể tải danh sách trò chuyện';
        this.loading = false;
        this.cdr.detectChanges();
      }
    });
  }

  // Load conversations for expert
  public loadConversations(): void {
    this.loading = true;
    
    this.chatService.getConversations().subscribe({
      next: (data) => {
        // Convert ConversationDTO[] to PrivateConversation[]
        const conversations = data.map(conv => this.convertToPrivateConversation(conv));
        this.conversationsSubject.next(conversations);
        this.loading = false;
        this.cdr.markForCheck();
      },
      error: (err) => {
        console.error('Error loading conversations:', err);
        this.error = 'Không thể tải danh sách trò chuyện';
        this.loading = false;
        this.cdr.markForCheck();
      }
    });
  }

  // Touch event handlers cho mobile
  public onTouchStart(event: TouchEvent, conversation: PrivateConversation): void {
    // Touch start event handled
    // Prevent default để tránh double-tap zoom trên mobile
    event.preventDefault();
  }

  public onTouchEnd(event: TouchEvent, conversation: PrivateConversation): void {
    // Touch end event handled
    event.preventDefault();
    // Trigger conversation selection
    this.selectConversation(conversation);
  }

  // Select conversation and load messages
  public selectConversation(conversation: PrivateConversation): void {
    // Update UI state FIRST
    this.selectedConversation = conversation;
    this.showConversationList = false;
    
    // Force change detection
    this.cdr.detectChanges();
    
    // Then load messages
    this.loadPrivateMessages(conversation.otherUserId);
    
    // Bỏ tính năng mark messages as read để tránh lỗi
    // this.markMessagesAsRead();
  }

  // Load private messages for specific conversation
  public loadPrivateMessages(otherUserId: number): void {
    this.loading = true;
    
    this.chatService.getPrivateMessages(otherUserId).subscribe({
      next: (data) => {
        // Chỉ hiển thị tin nhắn PRIVATE
        const privateMessages = (data || []).filter((m: any) => m.chatType === 'PRIVATE');
        
        // Update messages
        this.messagesSubject.next(privateMessages);
        this.loading = false;
        
        // Force UI update
        this.cdr.detectChanges();
        
        // Scroll to bottom
        setTimeout(() => {
          this.scrollToBottom();
        }, 100);
      },
      error: (err) => {
        console.error('❌ [DEBUG] Error loading private messages:', err);
        this.error = 'Không thể tải tin nhắn';
        this.loading = false;
        this.cdr.detectChanges();
      }
    });
  }

  // Go back to conversation list
  public backToConversations(): void {
    this.selectedConversation = null;
    this.showConversationList = true;
    this.messagesSubject.next([]);
  }

  // Generate conversation ID
  private generateConversationId(user1Id: number, user2Id: number): string {
    const minId = Math.min(user1Id, user2Id);
    const maxId = Math.max(user1Id, user2Id);
    return `conv_${minId}_${maxId}`;
  }

  // Enhanced message sending
  public sendMessage(): void {
    if (!this.newMessage.trim() || !this.selectedConversation) return;
    
    const userId = this.authService.getCurrentUserId();
    const userRole = this.authService.getCurrentUserRole();
    
    if (!userId) {
      this.error = 'Không thể xác định người dùng. Vui lòng đăng nhập lại.';
      this.cdr.markForCheck();
      return;
    }
    
    const message: ChatMessage = {
      senderId: +userId,
      receiverId: this.selectedConversation.otherUserId,
      content: this.newMessage.trim(),
      senderRole: userRole || undefined,
      timestamp: new Date().toISOString(),
      chatType: 'PRIVATE',
      conversationId: this.selectedConversation.conversationId
    };
    
    // Add message locally for immediate feedback
    this.addMessageToChat(message);

    this.ws.sendPrivateMessage(message).catch(err => {
      this.error = 'Không thể gửi tin nhắn: ' + err;
      this.toastService.error(this.error, 5000);
      this.cdr.markForCheck();
    });
    
    this.newMessage = '';
    this.error = '';
    this.cdr.markForCheck();

    setTimeout(() => {
      this.scrollToBottom();
    }, 100);
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
        isTyping: true,
        userId: +this.currentUserId!
      });
    }
    
    // Clear typing indicator after delay
    this.typingTimeout = setTimeout(() => {
      this.isTyping = false;
      if (this.selectedConversation) {
        this.ws.sendTypingIndicator({
          conversationId: this.selectedConversation.conversationId,
          isTyping: false,
          userId: +this.currentUserId!
        });
      }
      this.cdr.markForCheck();
    }, 3000);
  }

  // Bỏ tính năng mark messages as read để tránh lỗi
  // private markMessagesAsRead(): void {
  //   if (this.selectedConversation) {
  //     this.chatService.markMessagesAsRead().subscribe({
  //       next: (result) => {
  //         console.log('Messages marked as read successfully:', result);
  //         // Update conversation unread status
  //         const conversations = this.conversationsSubject.value;
  //         const conversationIndex = conversations.findIndex(c => c.conversationId === this.selectedConversation!.conversationId);
  //         
  //         if (this.selectedConversation!.conversationId);
  //           
  //         if (conversationIndex !== -1) {
  //           const updatedConversations = [...conversations];
  //           updatedConversations[conversationIndex] = {
  //             ...updatedConversations[conversationIndex],
  //             hasUnreadMessages: false
  //           };
  //           this.conversationsSubject.next(updatedConversations);
  //         }
  //       },
  //       error: (err) => {
  //         console.error('Error marking messages as read:', err);
  //         // Không cần throw error vì đây không phải lỗi nghiêm trọng
  //       }
  //     });
  //   }
  // }

  // Message ownership detection
  public isOwnMessage(message: ChatMessage): boolean {
    if (!this.currentUserId || !message?.senderId) {
      return false;
    }
    
    const currentId = this.currentUserId.toString().trim();
    const senderId = message.senderId.toString().trim();
    return currentId === senderId;
  }

  // UI Helper methods
  public onEnterPress(event: Event): void {
    const keyboardEvent = event as KeyboardEvent;
    if (keyboardEvent.key === 'Enter' && !keyboardEvent.shiftKey) {
      event.preventDefault();
      this.sendMessage();
    }
  }

  public scrollToBottom(): void {
    setTimeout(() => {
      const container = document.querySelector('.chat-messages');
      if (container) {
        container.scrollTop = container.scrollHeight;
      }
    }, 100);
  }

  // Utility methods for template
  public trackMessage(index: number, message: ChatMessage): any {
    return message.timestamp || index;
  }

  public getAvatarUrl(message: ChatMessage): string {
    return 'assets/image/default-avatar.png';
  }

  public getAvatarInitial(message: ChatMessage): string {
    const senderName = this.getSenderName(message);
    if (senderName && senderName.length > 0) {
      return senderName.charAt(0).toUpperCase();
    }
    return '?';
  }

  public getSenderName(message: ChatMessage): string {
    // For own messages, use a simple label
    if (this.isOwnMessage(message)) {
      return 'Bạn';
    }
    // For other messages in private chat, use the other user's username
    if (this.selectedConversation) {
      return this.selectedConversation.otherUsername;
    }
    // Fallback
    return 'Thành viên';
  }

  public getRoleBadgeClass(role?: string): string {
    switch (role) {
      case 'VIP': return 'vip-badge';
      case 'EXPERT': return 'expert-badge';
      case 'STAFF': return 'expert-badge';
      case 'ADMIN': return 'expert-badge';
      default: return 'user-badge';
    }
  }

  public getRoleDisplayName(role?: string): string {
    switch (role) {
      case 'VIP': return 'VIP';
      case 'EXPERT': return 'Chuyên gia';
      case 'STAFF': return 'Nhân viên';
      case 'ADMIN': return 'Quản trị';
      default: return 'Thành viên';
    }
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
      hour12: false
    });
    
    if (isToday) {
      return timeString;
    } else if (isYesterday) {
      return `Hôm qua ${timeString}`;
    } else {
      const dateString = date.toLocaleDateString('vi-VN', {
        day: '2-digit',
        month: '2-digit'
      });
      return `${dateString} ${timeString}`;
    }
  }

  public formatConversationTime(timestamp?: string): string {
    if (!timestamp) return '';
    
    const date = new Date(timestamp);
    const now = new Date();
    
    const isToday = date.toDateString() === now.toDateString();
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    const isYesterday = date.toDateString() === yesterday.toDateString();
    
    if (isToday) {
      return date.toLocaleTimeString('vi-VN', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
      });
    } else if (isYesterday) {
      return 'Hôm qua';
    } else {
      return date.toLocaleDateString('vi-VN', {
        day: '2-digit',
        month: '2-digit'
      });
    }
  }

  /**
   * Convert ConversationDTO to PrivateConversation
   */
  private convertToPrivateConversation(conv: any): PrivateConversation {
    return {
      conversationId: conv.conversationId || '',
      otherUserId: conv.otherUserId || 0,
      otherUsername: conv.otherUsername || '',
      otherUserRole: conv.otherUserRole || '',
      lastMessage: conv.lastMessage || '',
      lastMessageTime: conv.lastMessageTime || '',
      hasUnreadMessages: conv.hasUnreadMessages || false
    };
  }

  ngOnDestroy(): void {
    if (this.typingTimeout) {
      clearTimeout(this.typingTimeout);
    }
    
    this.wsSub?.unsubscribe();
    this.wsErrSub?.unsubscribe();
    this.wsPrivateSub?.unsubscribe();
    this.wsTypingSub?.unsubscribe();
    this.ws.disconnect();
  }

  connectToChat(): void {
    this.ws.connect();
  }
}
