  // ...existing code...
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
import { TopNavigatorComponent } from '../../shared/top-navigator/top-navigator.component';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { Subscription, Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { ChatStompService, ChatMessage } from './chat-stomp.service';
import { AuthService } from '../../auth/auth.service';
import { trackByMessageId } from '../../shared/performance';
import { environment } from '../../../environments/environment';
import { UrlService } from '../../shared/url.service';
import { ChatService, ExpertDTO } from '../../shared/services/chat.service';
import { ConversationDTO } from './conversation.interface';

@Component({
  selector: 'app-vip-chat',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, TopNavigatorComponent],
  templateUrl: './chat.component.html',
  styleUrls: ['./chat.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ChatComponent implements OnInit, OnDestroy, AfterViewChecked {
  // ...existing code...
  // Lọc tin nhắn theo loại chat để hiển thị đúng
  get filteredMessages(): ChatMessage[] {
    if (this.showPrivateChat && this.selectedConversation && this.currentUserId) {
      // Hiển thị tin nhắn PRIVATE của conversation hiện tại
      const otherUserId = this.selectedConversation.otherUserId;
      const currentUserId = +this.currentUserId;
      return (this.messages || []).filter(
        (m: any) =>
          m.chatType === 'PRIVATE' &&
          ((m.senderId === otherUserId && m.receiverId === currentUserId) ||
           (m.receiverId === otherUserId && m.senderId === currentUserId))
      );
    } else {
      // Hiển thị tin nhắn COMMUNITY
      return (this.messages || []).filter(
        (m: any) => m.chatType === 'COMMUNITY'
      );
    }
  }
  @ViewChild('messagesContainer', { static: false }) messagesContainer!: ElementRef;
  
  messages: ChatMessage[] = [];
  newMessage: string = '';
  loading = false;
  error = '';
  currentUserId: string | null = null;
  
  private shouldScrollToBottom = false;
  private lastMessageCount = 0;
  
  // Private chat properties
  conversations: ConversationDTO[] = [];
  selectedConversation: ConversationDTO | null = null;
  showPrivateChat = false;
  experts: ExpertDTO[] = [];
  privateMessages: any[] = [];
  searchQuery: string = '';

  private wsSub?: Subscription;
  private wsErrSub?: Subscription;
  private wsPrivateSub?: Subscription;
  private destroy$ = new Subject<void>();

  constructor(
    private http: HttpClient,
    private cdr: ChangeDetectorRef,
    private ws: ChatStompService,
    private zone: NgZone,
    private authService: AuthService,
    private urlService: UrlService,
    private chatService: ChatService
  ) {}

  ngOnInit(): void {
    // Environment check for debugging only
    const isProductionDomain = window.location.hostname.includes('plantcare.id.vn');
    console.log('Chat component environment check:', {
      configProduction: environment.production,
      hostname: window.location.hostname,
      isProductionDomain,
      buildMode: environment.production ? 'production' : 'development',
      deploymentMode: isProductionDomain ? 'production-domain' : 'development-domain',
    });

    // Kiểm tra quyền truy cập VIP
    const userRole = this.authService.getCurrentUserRole();
    if (userRole !== 'VIP' && userRole !== 'EXPERT') {
      console.error('❌ Unauthorized access to VIP chat. User role:', userRole);
      this.error = 'Bạn cần có tài khoản VIP để truy cập phòng chat này.';
      this.cdr.markForCheck();
      return;
    }

    this.currentUserId = this.authService.getCurrentUserId();
    if (!this.currentUserId) {
      console.warn('⚠️ No current user ID found! User might not be logged in properly.');
    }

    // Luôn load danh sách chuyên gia và trò chuyện gần đây khi vào trang
    this.loadExperts();
    this.loadConversations();

    // Initialize chat on both environments
    console.log('✅ Initializing chat service');
    this.fetchHistory();

    // Connect with authentication check
    this.ws.connect().catch((err) => {
      console.error('WebSocket connection failed:', err);
      this.error = 'Không thể kết nối chat: ' + (err.message || err);
      this.cdr.markForCheck();
    });

    // Subscription cho tin nhắn cộng đồng
    this.wsSub = this.ws.onCommunityMessage().subscribe((msg: ChatMessage) => {
      this.zone.run(() => {
        // Chỉ thêm tin nhắn cộng đồng khi đang ở chế độ cộng đồng
        if (!this.showPrivateChat && msg.chatType === 'COMMUNITY') {
          console.log('📨 Received community message:', msg);
          // Reload lại lịch sử chat để đồng bộ
          this.fetchHistory();
          this.cdr.markForCheck();
          this.scrollToBottom();
        }
      });
    });

    // Subscription cho tin nhắn riêng tư
    this.wsPrivateSub = this.ws.onPrivateMessage().subscribe((msg: ChatMessage) => {
      this.zone.run(() => {
        // Chỉ thêm tin nhắn riêng tư khi đang ở chế độ riêng tư và đúng conversation
        if (this.showPrivateChat && 
            this.selectedConversation && 
            this.currentUserId &&
            msg.chatType === 'PRIVATE' &&
            ((msg.senderId === this.selectedConversation.otherUserId && msg.receiverId === +this.currentUserId) ||
             (msg.receiverId === this.selectedConversation.otherUserId && msg.senderId === +this.currentUserId))) {
          console.log('📨 Received private message:', msg);
          // Reload lại lịch sử chat 1-1 để đồng bộ
          this.loadPrivateMessages(this.selectedConversation.otherUserId);
          this.cdr.markForCheck();
          this.scrollToBottom();
        }
      });
    });

    this.wsErrSub = this.ws.onError().subscribe((err: string) => {
      this.zone.run(() => {
        this.error = err;
        this.cdr.markForCheck();
      });
    });
  }

  // Utility methods for template
  trackMessage(index: number, message: ChatMessage): any {
    return message.timestamp || index;
  }

  isOwnMessage(message: ChatMessage): boolean {
    if (!this.currentUserId) {
      console.log('❌ No current user ID - cannot determine message ownership');
      return false;
    }

    if (!message.senderId) {
      console.log('❌ Message has no senderId:', message);
      return false;
    }

    // Normalize both IDs to strings for comparison
    const currentId = this.currentUserId.toString().trim();
    const senderId = message.senderId.toString().trim();

    return currentId === senderId;
  }

  getAvatarUrl(message: ChatMessage): string {
    // You can customize avatar based on role or user
    return 'assets/image/default-avatar.png';
  }

  getRoleBadgeClass(role?: string): string {
    switch (role) {
      case 'VIP':
        return 'vip-badge';
      case 'EXPERT':
        return 'expert-badge';
      default:
        return 'user-badge';
    }
  }

  getRoleDisplayName(role?: string): string {
    switch (role) {
      case 'VIP':
        return 'VIP';
      case 'EXPERT':
        return 'Chuyên gia';
      default:
        return 'Thành viên';
    }
  }

  getSenderName(msg: ChatMessage): string {
    // Tạm thời dùng senderId, sau này có thể map với tên thật
    return `User ${msg.senderId}`;
  }

  // Thêm dummy messages để test layout
  addDummyMessages(): void {
    // Sử dụng ID rõ ràng để test
    const testUserId = this.currentUserId || '123'; // Fallback nếu không có currentUserId

    const dummyMessages: ChatMessage[] = [
      {
        senderId: 999, // ID khác với current user - sẽ hiện bên trái
        content:
          'Chào mọi người! Tôi có thể hỏi về cách chăm sóc cây lan không?',
        timestamp: new Date(Date.now() - 300000).toISOString(),
        senderRole: 'VIP',
      },
      {
        senderId: +testUserId, // Current user ID - sẽ hiện bên phải
        content: 'Xin chào! Tôi cũng đang tìm hiểu về cây lan đây.',
        timestamp: new Date(Date.now() - 240000).toISOString(),
        senderRole: 'VIP',
      },
      {
        senderId: 888, // ID khác - sẽ hiện bên trái
        content:
          'Tôi có thể chia sẻ kinh nghiệm về cây lan. Các bạn có câu hỏi gì cụ thể không?',
        timestamp: new Date(Date.now() - 180000).toISOString(),
        senderRole: 'EXPERT',
      },
      {
        senderId: +testUserId, // Current user ID - sẽ hiện bên phải
        content:
          'Cảm ơn anh/chị! Tôi muốn hỏi về tần suất tưới nước cho cây lan.',
        timestamp: new Date(Date.now() - 120000).toISOString(),
        senderRole: 'VIP',
      },
    ];

    this.messages = dummyMessages;
    this.cdr.detectChanges();
  }

  formatTime(timestamp?: string): string {
    if (!timestamp) return '';

    const date = new Date(timestamp);
    const now = new Date();

    // Kiểm tra xem có phải hôm nay không
    const isToday = date.toDateString() === now.toDateString();

    // Kiểm tra xem có phải hôm qua không
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    const isYesterday = date.toDateString() === yesterday.toDateString();

    // Format giờ:phút
    const timeString = date.toLocaleTimeString('vi-VN', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    });

    if (isToday) {
      return timeString; // Chỉ hiện giờ:phút nếu là hôm nay
    } else if (isYesterday) {
      return `Hôm qua ${timeString}`;
    } else {
      // Hiện ngày/tháng và giờ:phút
      const dateString = date.toLocaleDateString('vi-VN', {
        day: '2-digit',
        month: '2-digit',
      });
      return `${dateString} ${timeString}`;
    }
  }



  fetchHistory() {
    this.loading = true;
    this.error = '';

    this.chatService.getChatHistory().subscribe({
      next: (data: any) => {
        const messages = Array.isArray(data) ? data : data?.data || [];
        // Lấy tất cả tin nhắn (cả COMMUNITY và PRIVATE)
        this.messages = messages;
        this.loading = false;
        this.checkIfShouldScroll();
        this.cdr.markForCheck();
      },
      error: (err) => {
        console.error('Error fetching chat history:', err);
        this.error = 'Không thể tải lịch sử chat';
        this.loading = false;
        this.cdr.markForCheck();
      },
    });
  }

  chatType: 'COMMUNITY' | 'PRIVATE' = 'COMMUNITY';

  // Private chat methods
  loadConversations() {
    this.loading = true;
    
    this.chatService.getConversations().subscribe({
      next: (data) => {
        this.conversations = data;
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

  selectConversation(conversation: ConversationDTO) {
    this.selectedConversation = conversation;
    this.showPrivateChat = true;
    this.chatType = 'PRIVATE';
    this.loadPrivateMessages(conversation.otherUserId);
  }

  loadPrivateMessages(otherUserId: number) {
    this.loading = true;
    this.chatService.getPrivateMessages(otherUserId).subscribe({
      next: (data) => {
        // Lấy tất cả tin nhắn PRIVATE giữa 2 user, không cần filter theo conversationId
        this.messages = (data || []).filter(
          (m: any) => m.chatType === 'PRIVATE'
        );
        this.loading = false;
        this.checkIfShouldScroll();
        this.cdr.markForCheck();
      },
      error: (err) => {
        console.error('Error loading private messages:', err);
        this.error = 'Không thể tải tin nhắn';
        this.loading = false;
        this.cdr.markForCheck();
      }
    });
  }

  switchToPrivateChat() {
    this.showPrivateChat = true;
    this.chatType = 'PRIVATE';
    this.selectedConversation = null;
    this.messages = [];
    this.loadConversations();
    this.loadExperts();
  }

  switchToCommunityChat() {
    this.showPrivateChat = false;
    this.chatType = 'COMMUNITY';
    this.selectedConversation = null;
    this.messages = [];
    this.loadExperts();
    this.loadConversations();
    this.fetchHistory();
  }

  loadExperts() {
    this.loading = true;
    
    this.chatService.getExperts().subscribe({
      next: (data) => {
        this.experts = data;
        this.loading = false;
        this.cdr.markForCheck();
      },
      error: (err) => {
        console.error('Error loading experts:', err);
        this.error = 'Không thể tải danh sách chuyên gia';
        this.loading = false;
        this.cdr.markForCheck();
      }
    });
  }

  startConversationWithExpert(expert: ExpertDTO) {
    if (!this.currentUserId) {
      this.error = 'Không thể xác định người dùng';
      this.cdr.markForCheck();
      return;
    }

    // Tạo conversation ID
    const conversationId = this.generateConversationId(this.currentUserId, expert.id);
    
    // Kiểm tra xem conversation đã tồn tại chưa
    const existingConversation = this.conversations.find(c => c.conversationId === conversationId);
    
    if (existingConversation) {
      this.selectConversation(existingConversation);
    } else {
      // Tạo conversation mới
      const newConversation: ConversationDTO = {
        conversationId: conversationId,
        otherUserId: expert.id,
        otherUsername: expert.username,
        otherUserRole: expert.role,
        lastMessage: '',
        lastMessageTime: '',
        hasUnreadMessages: false
      };
      
      this.conversations.unshift(newConversation);
      this.selectConversation(newConversation);
    }
  }

  private generateConversationId(user1Id: string, user2Id: number): string {
    const minId = Math.min(+user1Id, user2Id);
    const maxId = Math.max(+user1Id, user2Id);
    return `conv_${minId}_${maxId}`;
  }

  sendMessage() {
    if (!this.newMessage.trim()) return;

    // Lấy userId và role từ AuthService
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

    const msg: ChatMessage = {
      senderId: +userId, // Convert string to number
      content: this.newMessage.trim(),
      senderRole: userRole,
      timestamp: new Date().toISOString(),
      chatType: this.selectedConversation ? 'PRIVATE' : 'COMMUNITY'
    };

    if (this.selectedConversation) {
      // Private chat
      msg.conversationId = this.selectedConversation.conversationId;
      msg.receiverId = this.selectedConversation.otherUserId;
      this.ws.sendPrivateMessage(msg).catch(err => {
        this.error = 'Không thể gửi tin nhắn: ' + err;
        this.cdr.markForCheck();
      });
    } else {
      // Community chat
      this.ws.sendMessage(msg).catch(err => {
        this.error = 'Không thể gửi tin nhắn: ' + err;
        this.cdr.markForCheck();
      });
    }

    this.newMessage = '';
    this.error = ''; // Clear any previous errors
    
    // Scroll to bottom after sending message
    setTimeout(() => {
      this.scrollToBottomSmooth();
    }, 100);
    
    this.cdr.markForCheck();
  }

  onEnterPress(event: KeyboardEvent): void {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      this.sendMessage();
    }
    // Allow Shift+Enter for new line (default behavior)
  }

  getInputPlaceholder(): string {
    if (this.selectedConversation) {
      return `Nhập tin nhắn cho ${this.selectedConversation.otherUsername}...`;
    }
    return 'Nhập tin nhắn VIP của bạn...';
  }

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
      console.error('Error scrolling to bottom:', err);
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
      console.error('Error smooth scrolling to bottom:', err);
    }
  }

  private checkIfShouldScroll(): void {
    // Scroll to bottom if:
    // 1. New messages arrived
    // 2. User just switched conversations
    // 3. User just sent a message
    if (this.messages.length !== this.lastMessageCount) {
      this.shouldScrollToBottom = true;
      this.lastMessageCount = this.messages.length;
    }
  }

  ngOnDestroy(): void {
    this.wsSub?.unsubscribe();
    this.wsErrSub?.unsubscribe();
    this.wsPrivateSub?.unsubscribe();
    this.ws.disconnect();

    this.destroy$.next();
    this.destroy$.complete();
  }
}
