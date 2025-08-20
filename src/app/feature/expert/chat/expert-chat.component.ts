
import { ViewChild, ElementRef, AfterViewInit } from '@angular/core';
import { Component, OnInit, OnDestroy, ChangeDetectorRef, NgZone } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { Router, ActivatedRoute } from '@angular/router';
import { AuthService } from '../../../auth/auth.service';
import { ExpertLayoutComponent } from '../shared/expert-layout/expert-layout.component';
import { ExpertChatStompService, ChatMessage } from './expert-chat-stomp.service';
import { Subscription } from 'rxjs';
import { UrlService } from '../../../shared/services/url.service';
import { ChatService } from '../../../shared/services/chat.service';
import { ToastService } from '../../../shared/toast/toast.service';


@Component({
  selector: 'app-expert-chat',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './expert-chat.component.html',
  styleUrls: ['./expert-chat.component.scss']
})



// ...existing code...
export class ExpertChatComponent implements OnInit, OnDestroy, AfterViewInit {
  @ViewChild('messagesContainer', { static: false }) messagesContainer!: ElementRef;
  private shouldScrollToBottom = false;
  // Chat cộng đồng state
  messages: ChatMessage[] = [];
  // Always filter only community messages for display
  get filteredMessages(): ChatMessage[] {
    return this.messages.filter(m => m.chatType === 'COMMUNITY');
  }
  newMessage = '';
  loading = false;
  error = '';
  // WebSocket subscriptions
  private wsCommunitySub?: Subscription;
  private wsErrSub?: Subscription;
  // User info
  currentUserId: string | null = null;
  currentUserRole: string | null = null;

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
    this.currentUserId = this.authService.getCurrentUserId();
    this.currentUserRole = this.authService.getCurrentUserRole();
    if (!this.currentUserId) {
      this.error = 'Không thể xác định người dùng. Vui lòng đăng nhập lại.';
      return;
    }

    // Subscribe to chat API availability
    this.chatService.chatApisAvailable$.subscribe(available => {
      if (!available && this.urlService.isProduction()) {
        this.toastService.warning('Chat APIs are temporarily unavailable. Some features may not work properly.', 8000);
      }
    });

    // Lấy lịch sử tin nhắn cộng đồng trước khi connect websocket
    this.loading = true;
    this.chatService.getChatHistory().subscribe({
      next: (data) => {
        this.messages = (Array.isArray(data) ? data : []).filter(
          (m: any) => m.chatType === 'COMMUNITY'
        );
        this.loading = false;
        this.cdr.markForCheck();
        this.connectToChat();
        this.shouldScrollToBottom = true;
      },
      error: (err) => {
        this.error = 'Không thể tải lịch sử chat cộng đồng';
        this.loading = false;
        this.cdr.markForCheck();
        this.connectToChat();
      }
    });
  }
  ngAfterViewInit(): void {
    // Đảm bảo scroll đúng sau khi view khởi tạo
    setTimeout(() => this.scrollToBottom(), 200);
  }
  ngAfterViewChecked(): void {
    if (this.shouldScrollToBottom) {
      this.scrollToBottom();
      this.shouldScrollToBottom = false;
    }
  }



  ngOnDestroy(): void {
  this.wsCommunitySub?.unsubscribe();
  this.wsErrSub?.unsubscribe();
  this.ws.disconnect();
  }

  connectToChat(): void {
    this.ws.connect();
    // Subscribe to community messages
    this.wsCommunitySub = this.ws.onCommunityMessage().subscribe((msg: ChatMessage) => {
      this.zone.run(() => {
        if (msg.chatType === 'COMMUNITY') {
          this.messages.push(msg);
          this.cdr.markForCheck();
          this.scrollToBottom();
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
    const currentId = this.currentUserId.toString().trim();
    const senderId = message.senderId.toString().trim();
    return currentId === senderId;
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
    if (this.messagesContainer && this.messages.length > 0) {
      const element = this.messagesContainer.nativeElement;
      element.scrollTop = element.scrollHeight;
    }
  }


  // Utility methods for template
  trackMessage(index: number, message: ChatMessage): any {
    return message.timestamp || index;
  }

  getAvatarUrl(message: ChatMessage): string {
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
    // For own messages, use a simple label
    if (this.isOwnMessage(message)) {
      return 'Bạn';
    }
    // Fallback
    return 'Thành viên';
  }


  getRoleBadgeClass(role?: string): string {
    switch (role) {
      case 'VIP': return 'vip-badge';
      case 'EXPERT': return 'expert-badge';
      case 'STAFF': return 'expert-badge';
      case 'ADMIN': return 'expert-badge';
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


  // Gửi tin nhắn cộng đồng
  sendMessage() {
    if (!this.newMessage.trim()) return;
    const userId = this.authService.getCurrentUserId();
    const userRole = this.authService.getCurrentUserRole();
    if (!userId) {
      this.error = 'Không thể xác định người dùng. Vui lòng đăng nhập lại.';
      this.cdr.markForCheck();
      return;
    }
    const msg: ChatMessage = {
      senderId: +userId,
      content: this.newMessage.trim(),
      senderRole: userRole || undefined,
      timestamp: new Date().toISOString(),
      chatType: 'COMMUNITY'
    };
    this.ws.sendMessage(msg).catch(err => {
      this.error = 'Không thể gửi tin nhắn: ' + err;
      this.cdr.markForCheck();
    });
    this.newMessage = '';
    this.error = '';
    this.cdr.markForCheck();
  }
}