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
import { TopNavigatorComponent } from '../../../shared/top-navigator/top-navigator.component';
import { FooterComponent } from '../../../shared/footer/footer.component';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { Subscription, Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { ChatStompService, ChatMessage } from './chat-stomp.service';
import { AuthService } from '../../../auth/auth.service';
import { trackByMessageId } from '../../../shared/services/performance';
import { environment } from '../../../../environments/environment';
import { UrlService } from '../../../shared/services/url.service';
import { ChatService, ExpertDTO } from '../../../shared/services/chat.service';
import { ConversationDTO } from './conversation.interface';
import { ToastService } from '../../../shared/toast/toast.service';

@Component({
  selector: 'app-vip-chat',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, TopNavigatorComponent, FooterComponent],
  templateUrl: './chat.component.html',
  styleUrls: ['./chat.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ChatComponent implements OnInit, OnDestroy, AfterViewChecked {
  // Mobile responsive properties
  isMobile = window.innerWidth <= 768;
  sidebarVisible = window.innerWidth > 768;
  showChatView = false; // New property for mobile chat view
  
  /**
   * Định dạng thời gian đẹp cho chat: "Vừa xong", "5 phút trước", "Hôm qua 14:30", "dd/MM 14:30"...
   */
  formatTimePretty(timestamp?: string): string {
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
    // Hôm qua
    const yesterday = new Date(now);
    yesterday.setDate(now.getDate() - 1);
    if (date.toDateString() === yesterday.toDateString()) {
      return `Hôm qua ${date.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', hour12: false })}`;
    }
    // Còn lại: dd/MM HH:mm
    return `${date.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' })} ${date.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', hour12: false })}`;
  }
  // ...existing code...
  // Lọc tin nhắn theo loại chat để hiển thị đúng
  get filteredMessages(): ChatMessage[] {
    if (this.showPrivateChat && this.selectedConversation && this.selectedConversation.conversationId) {
      // Hiển thị tin nhắn PRIVATE của conversation hiện tại (so sánh conversationId)
      return (this.messages || []).filter(
        (m: any) => m.chatType === 'PRIVATE' && m.conversationId === this.selectedConversation!.conversationId
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
    private chatService: ChatService,
    private toastService: ToastService
  ) {
    this.checkScreenSize();
    window.addEventListener('resize', () => this.checkScreenSize());
  }

  ngOnInit(): void {
    // Initialize mobile state immediately
    this.checkScreenSize();
    this.cdr.detectChanges();
    
    // Environment check for debugging only
    const isProductionDomain = window.location.hostname.includes('plantcare.id.vn');
    console.log('Chat component environment check:', {
      configProduction: environment.production,
      hostname: window.location.hostname,
      isProductionDomain,
      buildMode: environment.production ? 'production' : 'development',
      deploymentMode: isProductionDomain ? 'production-domain' : 'development-domain',
    });

    // Ensure mobile detection works
    console.log('Mobile detection:', {
      windowWidth: window.innerWidth,
      isMobile: this.isMobile,
      sidebarVisible: this.sidebarVisible
    });

    // Force initial state for mobile
    if (this.isMobile) {
      this.sidebarVisible = false;
      this.showPrivateChat = false; // Start with community chat on mobile
      this.cdr.detectChanges();
    }

    // Kiểm tra quyền truy cập VIP
    const userRole = this.authService.getCurrentUserRole();
    if (userRole !== 'VIP' && userRole !== 'EXPERT') {
      console.error('❌ Unauthorized access to VIP chat. User role:', userRole);
      this.error = 'Bạn cần có tài khoản VIP để truy cập phòng chat này.';
      this.cdr.detectChanges();
      return;
    }

    this.currentUserId = this.authService.getCurrentUserId();
    if (!this.currentUserId) {
      console.warn('⚠️ No current user ID found! User might not be logged in properly.');
    }

    // Subscribe to chat API availability
    this.chatService.chatApisAvailable$.subscribe(available => {
      if (!available && this.urlService.isProduction()) {
        this.toastService.warning('Chat APIs are temporarily unavailable. Some features may not work properly.', 8000);
      }
    });

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
        // Push trực tiếp vào messages nếu là COMMUNITY
        if (!this.showChatView && msg.chatType === 'COMMUNITY') {
          this.messages.push(msg);
          this.cdr.markForCheck();
          this.scrollToBottom();
        }
      });
    });

    // Subscription cho tin nhắn riêng tư
    this.wsPrivateSub = this.ws.onPrivateMessage().subscribe((msg: ChatMessage) => {
      this.zone.run(() => {
        // Nếu đang ở đúng conversation và chế độ chat riêng thì push trực tiếp vào messages để realtime
        // Log mọi message nhận được
        console.log('📨 [Socket] Received private message:', msg, 'Current conversation:', this.selectedConversation, 'Current user:', this.currentUserId);
        if (msg.chatType === 'PRIVATE' && this.currentUserId) {
          const currentUserId = +this.currentUserId;
          if (msg.senderId === currentUserId || msg.receiverId === currentUserId) {
            this.messages.push(msg);
            this.cdr.markForCheck();
          }
        }

        if (this.showPrivateChat) {
          this.loadConversations();
        }
      });
    });

    // Luôn reload lại danh sách conversation để cập nhật preview/thông báo, kể cả khi đang ở community chat
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
    if (this.isOwnMessage(msg)) {
      // Không hiển thị tên cho tin nhắn của mình
      return '';
    } else {
      // For other messages in private chat, use the other user's username
      if (this.selectedConversation && this.showPrivateChat) {
        return this.selectedConversation.otherUsername;
      }
      // For community chat, try to get username from message or fallback
      return `User ${msg.senderId}`;
    }
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
    this.showChatView = true; // Show chat view on mobile
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

  // New methods for mobile chat list
  openCommunityChat() {
    this.showPrivateChat = false;
    this.selectedConversation = null;
    this.chatType = 'COMMUNITY';
    this.showChatView = true;
    this.fetchHistory();
    this.cdr.detectChanges();
  }

  goBackToList() {
    this.showChatView = false;
    this.selectedConversation = null;
    this.showPrivateChat = false;
    this.cdr.detectChanges();
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
      this.messages.push(msg); // Add to local messages for immediate feedback

      this.ws.sendPrivateMessage(msg).catch(err => {
        this.error = 'Không thể gửi tin nhắn: ' + err;
        this.cdr.markForCheck();
      });
    } else {

      this.messages.push
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

  // Mobile responsive methods
  private checkScreenSize(): void {
    const isMobileNow = window.innerWidth <= 768;
    if (isMobileNow !== this.isMobile) {
      this.isMobile = isMobileNow;
      if (this.isMobile) {
        this.sidebarVisible = false; // Hide sidebar by default on mobile
      } else {
        this.sidebarVisible = true; // Always show sidebar on desktop
      }
      this.cdr.detectChanges();
    }
  }

  toggleSidebar(): void {
    if (this.isMobile) {
      this.sidebarVisible = !this.sidebarVisible;
      this.cdr.detectChanges();
    }
  }

  closeSidebarOnMobile(): void {
    if (this.isMobile) {
      this.sidebarVisible = false;
      this.cdr.detectChanges();
    }
  }

  ngOnDestroy(): void {
    window.removeEventListener('resize', () => this.checkScreenSize());
    this.wsSub?.unsubscribe();
    this.wsErrSub?.unsubscribe();
    this.wsPrivateSub?.unsubscribe();
    this.ws.disconnect();

    this.destroy$.next();
    this.destroy$.complete();
  }
}
