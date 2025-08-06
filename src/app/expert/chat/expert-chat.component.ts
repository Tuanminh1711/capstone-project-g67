import { Component, OnInit, OnDestroy, ViewChild, ElementRef, ChangeDetectorRef, NgZone } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { AuthService } from '../../auth/auth.service';
import { ExpertLayoutComponent } from '../shared/expert-layout/expert-layout.component';
import { ChatStompService, ChatMessage } from '../../vip/chat/chat-stomp.service';
import { Subscription } from 'rxjs';
import { UrlService } from '../../shared/url.service';

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
  
  // User info
  currentUserId: string | null = null;
  currentUserRole: string | null = null;

  constructor(
    private router: Router,
    private authService: AuthService,
    private cdr: ChangeDetectorRef,
    private zone: NgZone,
    private ws: ChatStompService,
    private http: HttpClient,
    private urlService: UrlService
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
  }

  ngOnDestroy(): void {
    this.wsSub?.unsubscribe();
    this.wsErrSub?.unsubscribe();
    this.ws.disconnect();
  }

  // Kết nối WebSocket - copy từ VIP chat
  connectToChat(): void {
    this.ws.connect();
    
    // Subscribe to messages
    this.wsSub = this.ws.onMessage().subscribe((msg: ChatMessage) => {
      this.zone.run(() => {
        this.messages.push(msg);
        this.cdr.markForCheck();
        this.scrollToBottom();
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

  // Load lịch sử tin nhắn từ database - dùng UrlService giống VIP chat
  fetchHistory(): void {
    this.loading = true;
    this.error = '';
    const chatHistoryUrl = this.urlService.getApiUrl('api/chat/history');
    this.http.get<ChatMessage[]>(chatHistoryUrl).subscribe({
      next: (data: any) => {
        const messages = Array.isArray(data) ? data : (data?.data || []);
        this.messages = messages;
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
      timestamp: new Date().toISOString()
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
    // You can customize avatar based on role or user
    return 'assets/image/default-avatar.png';
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
