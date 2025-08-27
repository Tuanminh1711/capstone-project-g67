import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { NotificationService } from '../../user/notification/notification.service';
import { Notification, NotificationPage } from '../../user/notification/notification.model';

@Component({
  selector: 'app-expert-notifications',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="expert-notifications-container">
      <div class="notifications-header">
        <h2>Thông báo chuyên gia</h2>
        <div class="header-actions">
          <button class="mark-all-read-btn" (click)="markAllAsRead()" [disabled]="!hasUnreadNotifications()">
            Đánh dấu tất cả đã đọc
          </button>
          <button class="refresh-btn" (click)="refresh()" [disabled]="isLoading">
            🔄 Làm mới
          </button>
        </div>
      </div>

      <div class="notifications-content">
        <!-- Loading state -->
        @if (isLoading) {
          <div class="loading-state">
            <div class="spinner"></div>
            <p>Đang tải thông báo...</p>
          </div>
        }

        <!-- Error state -->
        @if (error) {
          <div class="error-state">
            <p class="error-message">{{ error }}</p>
            <button class="retry-btn" (click)="refresh()">Thử lại</button>
          </div>
        }

        <!-- Empty state -->
        @if (!isLoading && !error && notifications.length === 0) {
          <div class="empty-state">
            <div class="empty-icon">🔔</div>
            <h3>Không có thông báo</h3>
            <p>Bạn chưa có thông báo nào</p>
          </div>
        }

        <!-- Notifications list -->
        @if (!isLoading && !error && notifications.length > 0) {
          <div class="notifications-list">
            @for (notification of notifications; track notification.id) {
              <div class="notification-item" 
                   [class.unread]="isUnread(notification)"
                   (click)="onNotificationClick(notification)">
                <div class="notification-icon">
                  @switch (notification.type) {
                    @case ('EXPERT_RESPONSE') { 💬 }
                    @case ('TICKET_UPDATE') { 📋 }
                    @case ('PLANT_CARE') { 🌿 }
                    @case ('SYSTEM') { ⚙️ }
                    @case ('PROMOTION') { 🎉 }
                    @default { 🔔 }
                  }
                </div>
                <div class="notification-content">
                  <div class="notification-header">
                    <h4 class="notification-title">{{ notification.title }}</h4>
                    <span class="notification-time">{{ formatTime(notification.createdAt) }}</span>
                  </div>
                  <p class="notification-message">{{ notification.message }}</p>
                  @if (notification.link) {
                    <div class="notification-link">
                      <span class="link-text">Xem chi tiết →</span>
                    </div>
                  }
                </div>
                @if (isUnread(notification)) {
                  <div class="unread-indicator"></div>
                }
              </div>
            }
          </div>

          <!-- Pagination -->
          @if (totalPages > 1) {
            <div class="pagination">
              <button class="page-btn" 
                      [disabled]="currentPage === 0"
                      (click)="loadNotifications(currentPage - 1)">
                ← Trước
              </button>
              <span class="page-info">
                Trang {{ currentPage + 1 }} / {{ totalPages }}
              </span>
              <button class="page-btn" 
                      [disabled]="currentPage >= totalPages - 1"
                      (click)="loadNotifications(currentPage + 1)">
                Sau →
              </button>
            </div>
          }
        }
      </div>
    </div>
  `,
  styleUrls: ['./expert-notifications.component.scss']
})
export class ExpertNotificationsComponent implements OnInit, OnDestroy {
  notifications: Notification[] = [];
  isLoading = false;
  error: string | null = null;
  currentPage = 0;
  totalPages = 0;
  totalElements = 0;
  pageSize = 10;
  
  private destroy$ = new Subject<void>();

  constructor(
    private notificationService: NotificationService,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.loadNotifications();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadNotifications(page: number = 0): void {
    this.isLoading = true;
    this.error = null;
    
    this.notificationService.getUserNotifications(page, this.pageSize)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response: NotificationPage) => {
          this.notifications = response.content || [];
          this.currentPage = response.number || 0;
          this.totalElements = response.totalElements || 0;
          this.totalPages = response.totalPages || 0;
          this.isLoading = false;
          this.cdr.detectChanges();
        },
        error: (error) => {
          this.notifications = [];
          this.currentPage = 0;
          this.totalElements = 0;
          this.totalPages = 0;
          
          if (error.message?.includes('not authenticated')) {
            this.error = 'Bạn cần đăng nhập để xem thông báo.';
          } else if (error.status === 401) {
            this.error = 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.';
          } else {
            this.error = 'Không thể tải danh sách thông báo. Vui lòng thử lại.';
          }
          this.isLoading = false;
          this.cdr.detectChanges();
        }
      });
  }

  isUnread(notification: Notification): boolean {
    return notification.status !== 'READ';
  }

  hasUnreadNotifications(): boolean {
    return this.notifications.some(n => this.isUnread(n));
  }

  markAllAsRead(): void {
    this.notificationService.markAllAsRead()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.notifications.forEach(n => n.status = 'READ');
          this.cdr.detectChanges();
        },
        error: (error) => {
          console.error('Error marking all as read:', error);
        }
      });
  }

  onNotificationClick(notification: Notification): void {
    // Chỉ đánh dấu đã đọc nếu chưa đọc
    if (notification.status !== 'READ') {
      this.notificationService.markAsRead(notification.id)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: () => {
            notification.status = 'READ';
            this.cdr.detectChanges();
          },
          error: (error) => {
            console.error('Error marking as read:', error);
          }
        });
    }

    // Ưu tiên điều hướng dựa vào link nếu có
    if (notification.link) {
      if (/^https?:\/\//.test(notification.link)) {
        window.location.href = notification.link;
      } else {
        const route = notification.link.startsWith('/') ? notification.link : '/' + notification.link;
        this.router.navigate([route]);
      }
      return;
    }

    // Fallback cho các loại thông báo cụ thể
    if (notification.title && notification.title.includes('Tin nhắn mới')) {
      if (notification.title.includes('Community')) {
        this.router.navigate(['/expert/chat']);
      } else if (notification.title.includes('từ')) {
        this.router.navigate(['/expert/private-chat']);
      }
    }
  }

  formatTime(timestamp: string | number): string {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);
    
    if (diffInHours < 1) {
      return 'Vừa xong';
    } else if (diffInHours < 24) {
      return `${Math.floor(diffInHours)} giờ trước`;
    } else {
      return date.toLocaleDateString('vi-VN');
    }
  }

  refresh(): void {
    this.loadNotifications(this.currentPage);
  }
}
