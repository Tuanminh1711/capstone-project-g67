import { Component, OnInit, OnDestroy, ChangeDetectorRef, NgZone, ChangeDetectionStrategy, TrackByFunction } from '@angular/core';
import { TopNavigatorComponent } from '../../shared/top-navigator/top-navigator.component';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { Subscription, Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { ChatStompService, ChatMessage } from './chat-stomp.service';
import { AuthService } from '../../auth/auth.service';
import { trackByMessageId } from '../../shared/performance';
import { environment } from '../../../environments/environment';
import { UrlService } from '../../shared/url.service';

@Component({
  selector: 'app-vip-chat',
  standalone: true,
  imports: [CommonModule, FormsModule, TopNavigatorComponent],
  templateUrl: './chat.component.html',
  styleUrls: ['./chat.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ChatComponent implements OnInit, OnDestroy {
  messages: ChatMessage[] = [];
  newMessage: string = '';
  loading = false;
  error = '';
  currentUserId: string | null = null;

  private wsSub?: Subscription;
  private wsErrSub?: Subscription;
  private destroy$ = new Subject<void>();

  constructor(
    private http: HttpClient,
    private cdr: ChangeDetectorRef,
    private ws: ChatStompService,
    private zone: NgZone,
    private authService: AuthService,
    private urlService: UrlService
  ) {}

  ngOnInit(): void {
    // Environment check for debugging only
    const isProductionDomain = window.location.hostname.includes('plantcare.id.vn');
    
    console.log('Chat component environment check:', { 
      configProduction: environment.production, 
      hostname: window.location.hostname,
      isProductionDomain,
      buildMode: environment.production ? 'production' : 'development',
      deploymentMode: isProductionDomain ? 'production-domain' : 'development-domain'
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
    
    // Nếu không có currentUserId, log warning
    if (!this.currentUserId) {
      console.warn('⚠️ No current user ID found! User might not be logged in properly.');
    }
    
    // Initialize chat on both environments
    console.log('✅ Initializing chat service');
    this.fetchHistory();
    
    // Connect with authentication check
    this.ws.connect().catch(err => {
      console.error('WebSocket connection failed:', err);
      this.error = 'Không thể kết nối chat: ' + (err.message || err);
      this.cdr.markForCheck();
    });
    
    this.wsSub = this.ws.onMessage().subscribe((msg: ChatMessage) => {
      this.zone.run(() => {
        this.messages.push(msg);
        this.cdr.markForCheck();
        this.scrollToBottom();
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
      case 'VIP': return 'vip-badge';
      case 'EXPERT': return 'expert-badge';
      default: return 'user-badge';
    }
  }

  getRoleDisplayName(role?: string): string {
    switch (role) {
      case 'VIP': return 'VIP';
      case 'EXPERT': return 'Chuyên gia';
      default: return 'Thành viên';
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
        content: 'Chào mọi người! Tôi có thể hỏi về cách chăm sóc cây lan không?',
        timestamp: new Date(Date.now() - 300000).toISOString(),
        senderRole: 'VIP'
      },
      {
        senderId: +testUserId, // Current user ID - sẽ hiện bên phải
        content: 'Xin chào! Tôi cũng đang tìm hiểu về cây lan đây.',
        timestamp: new Date(Date.now() - 240000).toISOString(),
        senderRole: 'VIP'
      },
      {
        senderId: 888, // ID khác - sẽ hiện bên trái
        content: 'Tôi có thể chia sẻ kinh nghiệm về cây lan. Các bạn có câu hỏi gì cụ thể không?',
        timestamp: new Date(Date.now() - 180000).toISOString(),
        senderRole: 'EXPERT'
      },
      {
        senderId: +testUserId, // Current user ID - sẽ hiện bên phải
        content: 'Cảm ơn anh/chị! Tôi muốn hỏi về tần suất tưới nước cho cây lan.',
        timestamp: new Date(Date.now() - 120000).toISOString(),
        senderRole: 'VIP'
      }
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

  private scrollToBottom(): void {
    setTimeout(() => {
      const container = document.querySelector('.chat-messages');
      if (container) {
        container.scrollTop = container.scrollHeight;
      }
    }, 100);
  }

  fetchHistory() {
    this.loading = true;
    this.error = '';
    
    // Use UrlService to get correct endpoint
    const chatHistoryUrl = this.urlService.getApiUrl('chat/history');
    
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
      timestamp: new Date().toISOString()
    };
    
    this.ws.sendMessage(msg).catch(err => {
      this.error = 'Không thể gửi tin nhắn: ' + err;
      this.cdr.markForCheck();
    });
    
    this.newMessage = '';
    this.error = ''; // Clear any previous errors
    this.cdr.markForCheck();
  }

  onEnterPress(event: KeyboardEvent): void {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      this.sendMessage();
    }
    // Allow Shift+Enter for new line (default behavior)
  }

  ngOnDestroy(): void {
    this.wsSub?.unsubscribe();
    this.wsErrSub?.unsubscribe();
    this.ws.disconnect();
    
    this.destroy$.next();
    this.destroy$.complete();
  }
}