import { Component, OnInit, OnDestroy, ChangeDetectorRef, NgZone, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { AuthService } from '../../auth/auth.service';
import { ExpertLayoutComponent } from '../shared/expert-layout/expert-layout.component';
import { ExpertChatStompService, ChatMessage } from './expert-chat-stomp.service';
import { Subscription } from 'rxjs';
import { UrlService } from '../../shared/url.service';
import { ChatService } from '../../shared/services/chat.service';
import { ToastService } from '../../shared/toast/toast.service';

@Component({
  selector: 'app-expert-chat',
  standalone: true,
  imports: [CommonModule, FormsModule, ExpertLayoutComponent],
  templateUrl: './expert-chat.component.html',
  styleUrls: ['./expert-chat.component.scss']
})
export class ExpertChatComponent implements OnInit, OnDestroy {
  @ViewChild('messagesContainer') private messagesContainer!: ElementRef;
  
  // Chat state
  messages: ChatMessage[] = [];
  newMessage = '';
  loading = false;
  error = '';
  
  // WebSocket subscriptions - sử dụng đúng pattern như VIP chat
  private wsSub?: Subscription;
  private wsErrSub?: Subscription;
  private wsPrivateSub?: Subscription;
  
  // User info
  currentUserId: string | null = null;
  currentUserRole: string | null = null;

  constructor(
    private router: Router,
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
    this.currentUserId = this.authService.getCurrentUserId();
    this.currentUserRole = this.authService.getCurrentUserRole();
    
    if (!this.currentUserId) {
      console.warn('⚠️ No current user ID found! User might not be logged in properly.');
      this.error = 'Không thể xác định người dùng. Vui lòng đăng nhập lại.';
      return;
    }

    // Load lịch sử tin nhắn từ database trước
    this.fetchHistory();
    
    // Sau đó kết nối WebSocket để nhận tin nhắn mới
    this.connectToChat();

    // Subscribe to chat API availability
    this.chatService.chatApisAvailable$.subscribe(available => {
      if (!available && this.urlService.isProduction()) {
        this.toastService.warning('Chat APIs are temporarily unavailable. Some features may not work properly.', 8000);
      }
    });
  }

  ngOnDestroy(): void {
    this.wsSub?.unsubscribe();
    this.wsErrSub?.unsubscribe();
    this.wsPrivateSub?.unsubscribe();
    this.ws.disconnect();
  }

  // Kết nối WebSocket - copy từ VIP chat
  connectToChat(): void {
    this.ws.connect();
    
    // Subscribe to community messages
    this.wsSub = this.ws.onCommunityMessage().subscribe((msg: ChatMessage) => {
      this.zone.run(() => {
        // Chỉ thêm tin nhắn cộng đồng
        if (msg.chatType === 'COMMUNITY') {
          console.log('📨 Expert received community message:', msg);
          this.messages.push(msg);
          this.cdr.markForCheck();
          this.scrollToBottom();
        }
      });
    });

    // Subscribe to private messages
    this.wsPrivateSub = this.ws.onPrivateMessage().subscribe((msg: ChatMessage) => {
      this.zone.run(() => {
        // Chỉ thêm tin nhắn riêng tư nếu liên quan đến expert này
        if (msg.chatType === 'PRIVATE' && 
            this.currentUserId &&
            (msg.senderId === +this.currentUserId || msg.receiverId === +this.currentUserId)) {
          console.log('📨 Expert received private message:', msg);
          // Không thêm private messages vào community chat
          // Private messages sẽ được xử lý trong expert-private-chat component
        }
      });
    });
    
    // Subscribe to errors  
    this.wsErrSub = this.ws.onError().subscribe((err: string) => {
      this.zone.run(() => {
        this.error = err;
        this.cdr.markForCheck();
      });
    });
  }

  // Message ownership detection
  isOwnMessage(message: ChatMessage): boolean {
    if (!this.currentUserId || !message?.senderId) {
      return false;
    }
    
    // Normalize both IDs to strings for comparison
    const currentId = this.currentUserId.toString().trim();
    const senderId = message.senderId.toString().trim();

    return currentId === senderId;
  }

  // Load lịch sử tin nhắn từ database - chỉ lấy tin nhắn cộng đồng
  fetchHistory(): void {
    this.loading = true;
    this.error = '';
    
    this.chatService.getChatHistory().subscribe({
      next: (data: any) => {
        const messages = Array.isArray(data) ? data : (data?.data || []);
        // Chỉ hiển thị tin nhắn cộng đồng trong community chat
        this.messages = messages.filter((m: any) => m.chatType === 'COMMUNITY');
        this.loading = false;
        this.cdr.markForCheck();
        this.scrollToBottom();
      },
      error: err => {
        console.error('Error fetching chat history:', err);
        this.error = 'Không thể tải lịch sử chat';
        this.loading = false;
        this.cdr.markForCheck();
      }
    });
  }
  sendMessage(): void {
    if (!this.newMessage.trim()) return;
    
    // Lấy userId và role từ AuthService
    const userId = this.authService.getCurrentUserId();
    const userRole = this.authService.getCurrentUserRole();
    
    if (!userId) {
      this.error = 'Không thể xác định người dùng. Vui lòng đăng nhập lại.';
      this.cdr.markForCheck();
      return;
    }
    
    if (!userRole || (userRole !== 'STAFF' && userRole !== 'EXPERT' && userRole !== 'ADMIN')) {
      this.error = 'Chỉ tài khoản Chuyên gia hoặc Nhân viên mới được chat.';
      this.cdr.markForCheck();
      return;
    }
    
    const msg: ChatMessage = {
      senderId: +userId, // Convert string to number
      content: this.newMessage.trim(),
      senderRole: userRole,
      timestamp: new Date().toISOString(),
      chatType: 'COMMUNITY' // Đảm bảo tin nhắn được phân loại đúng
    };
    
    this.ws.sendMessage(msg);
    this.newMessage = '';
    this.error = ''; // Clear any previous errors
    this.cdr.markForCheck();
  }

  // UI Helper methods
  onEnterPress(event: Event): void {
    const keyboardEvent = event as KeyboardEvent;
    if (keyboardEvent.key === 'Enter' && !keyboardEvent.shiftKey) {
      event.preventDefault();
      this.sendMessage();
    }
  }

  scrollToBottom(): void {
    setTimeout(() => {
      if (this.messagesContainer) {
        const element = this.messagesContainer.nativeElement;
        element.scrollTop = element.scrollHeight;
      }
    }, 100);
  }

  // Utility methods for template - copy từ VIP chat
  trackMessage(index: number, message: ChatMessage): any {
    return message.timestamp || index;
  }

  getAvatarUrl(message: ChatMessage): string {
    // Fallback avatar cho expert chat
    return 'assets/image/default-avatar.png';
  }

  getAvatarInitial(message: ChatMessage): string {
    const senderName = this.getSenderName(message);
    if (senderName && senderName.length > 0) {
      return senderName.charAt(0).toUpperCase();
    }
    return '?';
  }

  getSenderName(message: ChatMessage): string {
    // Trả về tên người gửi dựa trên role
    switch (message.senderRole) {
      case 'EXPERT': return 'Chuyên gia';
      case 'STAFF': return 'Nhân viên';
      case 'ADMIN': return 'Quản trị viên';
      case 'VIP': return 'Thành viên VIP';
      default: return 'Thành viên';
    }
  }

  getOnlineCount(): number {
    // Tạm thời trả về số tin nhắn để demo
    // Có thể thay bằng API call để lấy số người online thực tế
    return Math.min(this.messages.length + 5, 25);
  }

  getRoleBadgeClass(role?: string): string {
    switch (role) {
      case 'VIP': return 'vip-badge';
      case 'EXPERT': return 'expert-badge';
      case 'STAFF': return 'expert-badge'; // Staff cũng dùng expert badge
      case 'ADMIN': return 'expert-badge'; // Admin cũng dùng expert badge
      default: return 'user-badge';
    }
  }

  getRoleDisplayName(role?: string): string {
    switch (role) {
      case 'VIP': return 'VIP';
      case 'EXPERT': return 'Chuyên gia';
      case 'STAFF': return 'Nhân viên';
      case 'ADMIN': return 'Quản trị';
      default: return 'Thành viên';
    }
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
      hour12: false
    });
    
    if (isToday) {
      return timeString; // Chỉ hiện giờ:phút nếu là hôm nay
    } else if (isYesterday) {
      return `Hôm qua ${timeString}`;
    } else {
      // Hiện ngày/tháng và giờ:phút
      const dateString = date.toLocaleDateString('vi-VN', {
        day: '2-digit',
        month: '2-digit'
      });
      return `${dateString} ${timeString}`;
    }
  }
}
