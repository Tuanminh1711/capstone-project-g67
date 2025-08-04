import { Component, OnInit, OnDestroy, ElementRef, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { Subject, Observable } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { NotificationService } from '../notification.service';
import { Notification, NotificationType } from '../notification.model';
import { NotificationBadgeComponent } from '../badge/notification-badge.component';

@Component({
  selector: 'app-notification-dropdown',
  standalone: true,
  imports: [CommonModule, RouterModule, NotificationBadgeComponent],
  templateUrl: './notification-dropdown.component.html',
  styleUrls: ['./notification-dropdown.component.scss']
})
export class NotificationDropdownComponent implements OnInit, OnDestroy {
  isOpen = false;
  notifications: Notification[] = [];
  isLoading = false;
  unreadCount$!: Observable<number>;
  
  private destroy$ = new Subject<void>();

  constructor(
    private notificationService: NotificationService,
    private elementRef: ElementRef
  ) {}

  ngOnInit(): void {
    // Subscribe to unread count changes
    this.unreadCount$ = this.notificationService.unreadCount$;
    
    // Load dữ liệu ngay khi component khởi tạo
    this.loadUnreadNotifications();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Toggle dropdown
   */
  toggleDropdown(): void {
    this.isOpen = !this.isOpen;
  }

  /**
   * Load unread notifications
   */
  private loadUnreadNotifications(): void {
    this.isLoading = true;
    
    this.notificationService.getUnreadNotifications()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (notifications) => {
          // Hiển thị tối đa 5 thông báo gần nhất
          this.notifications = notifications.slice(0, 5);
          this.isLoading = false;
        },
        error: (error) => {
          this.notifications = [];
          this.isLoading = false;
          // Đóng dropdown nếu có lỗi authentication
          if (error.message?.includes('not authenticated')) {
            this.isOpen = false;
          }
        }
      });
  }

  /**
   * Đánh dấu notification đã đọc
   */
  markAsRead(notification: Notification, event: Event): void {
    event.stopPropagation();
    
    if (notification.isRead) return;

    this.notificationService.markAsRead(notification.id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          // Cập nhật local state
          notification.isRead = true;
          // Reload unread notifications
          this.loadUnreadNotifications();
        },
        error: (error) => {
          console.error('Error marking notification as read:', error);
        }
      });
  }

  /**
   * Đánh dấu tất cả đã đọc
   */
  markAllAsRead(): void {
    this.notificationService.markAllAsRead()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          // Clear unread notifications
          this.notifications = [];
        },
        error: (error) => {
          console.error('Error marking all notifications as read:', error);
        }
      });
  }

  /**
   * Close dropdown khi click outside
   */
  @HostListener('document:click', ['$event'])
  onDocumentClick(event: Event): void {
    if (!this.elementRef.nativeElement.contains(event.target)) {
      this.isOpen = false;
    }
  }

  /**
   * Get icon class dựa trên notification type
   */
  getNotificationIcon(type: NotificationType): string {
    switch (type) {
      case NotificationType.SYSTEM:
        return 'fas fa-cog';
      case NotificationType.PLANT_CARE:
        return 'fas fa-leaf';
      case NotificationType.EXPERT_RESPONSE:
        return 'fas fa-user-md';
      case NotificationType.TICKET_UPDATE:
        return 'fas fa-ticket-alt';
      case NotificationType.PROMOTION:
        return 'fas fa-tag';
      case NotificationType.REMINDER:
        return 'fas fa-bell';
      default:
        return 'fas fa-info-circle';
    }
  }

  /**
   * Get CSS class dựa trên notification type
   */
  getNotificationClass(type: NotificationType): string {
    switch (type) {
      case NotificationType.SYSTEM:
        return 'system';
      case NotificationType.PLANT_CARE:
        return 'plant-care';
      case NotificationType.EXPERT_RESPONSE:
        return 'expert';
      case NotificationType.TICKET_UPDATE:
        return 'ticket';
      case NotificationType.PROMOTION:
        return 'promotion';
      case NotificationType.REMINDER:
        return 'reminder';
      default:
        return 'default';
    }
  }

  /**
   * Format thời gian
   */
  formatTime(dateString: string): string {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMinutes = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMinutes < 1) {
      return 'Vừa xong';
    } else if (diffMinutes < 60) {
      return `${diffMinutes}p`;
    } else if (diffHours < 24) {
      return `${diffHours}h`;
    } else if (diffDays < 7) {
      return `${diffDays}d`;
    } else {
      return date.toLocaleDateString('vi-VN', { 
        day: '2-digit', 
        month: '2-digit' 
      });
    }
  }

  /**
   * Truncate text
   */
  truncateText(text: string, maxLength: number = 60): string {
    if (text.length <= maxLength) {
      return text;
    }
    return text.substring(0, maxLength) + '...';
  }

  /**
   * Track by function cho ngFor
   */
  trackByNotificationId(index: number, notification: Notification): number {
    return notification.id;
  }
}
