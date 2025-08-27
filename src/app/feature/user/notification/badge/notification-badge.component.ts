import { Component, OnInit, OnDestroy, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { NotificationService } from '../notification.service';

@Component({
  selector: 'app-notification-badge',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="notification-badge" [class.has-notifications]="unreadCount > 0">
      <i class="fas fa-bell"></i>
      <span *ngIf="unreadCount > 0" class="badge-count">
        {{ unreadCount > 99 ? '99+' : unreadCount }}
      </span>
    </div>
  `,
  styleUrls: ['./notification-badge.component.scss']
})
export class NotificationBadgeComponent implements OnInit, OnDestroy {
  @Input() autoRefresh: boolean = true;
  @Input() refreshInterval: number = 30000; // 30 giây
  
  unreadCount = 0;
  private destroy$ = new Subject<void>();
  private refreshTimer: any;
  private handleChatMessage!: EventListener;

  constructor(
    private notificationService: NotificationService
  ) {}

  ngOnInit(): void {
    // Load unread count ngay khi component khởi tạo
    this.loadUnreadCount();
    
    // Subscribe để cập nhật khi có thay đổi
    this.subscribeToUnreadCount();
    
    // Lắng nghe custom event từ chat service khi có tin nhắn mới
    this.listenToChatMessages();
    
    // Tự động refresh nếu được bật
    if (this.autoRefresh) {
      this.startAutoRefresh();
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    
    if (this.refreshTimer) {
      clearInterval(this.refreshTimer);
    }
    
    // Remove event listener
    window.removeEventListener('chatMessageReceived', this.handleChatMessage);
  }

  /**
   * Load unread count từ server
   */
  private loadUnreadCount(): void {
    this.notificationService.loadUnreadCountIfLoggedIn();
  }

  /**
   * Subscribe để cập nhật unread count
   */
  private subscribeToUnreadCount(): void {
    this.notificationService.unreadCount$
      .pipe(takeUntil(this.destroy$))
      .subscribe(count => {
        this.unreadCount = count;
      });
  }

  /**
   * Bắt đầu tự động refresh
   */
  private startAutoRefresh(): void {
    this.refreshTimer = setInterval(() => {
      this.refreshUnreadCount();
    }, this.refreshInterval);
  }

  /**
   * Refresh số thông báo chưa đọc
   */
  private refreshUnreadCount(): void {
    this.notificationService.forceRefreshUnreadCount();
  }

  /**
   * Force refresh từ bên ngoài
   */
  public forceRefresh(): void {
    this.refreshUnreadCount();
  }

  /**
   * Lấy số thông báo hiện tại
   */
  public getCurrentCount(): number {
    return this.unreadCount;
  }

  /**
   * Lắng nghe custom event từ chat service
   */
  private listenToChatMessages(): void {
    this.handleChatMessage = (event: Event) => {
      // Force refresh unread count khi có tin nhắn mới
      this.notificationService.forceRefreshUnreadCount();
    };
    
    window.addEventListener('chatMessageReceived', this.handleChatMessage);
  }
}
