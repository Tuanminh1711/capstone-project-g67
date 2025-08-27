import { Component, OnInit, OnDestroy, ElementRef, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

// Angular Material imports
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatListModule } from '@angular/material/list';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatBadgeModule } from '@angular/material/badge';
import { MatDividerModule } from '@angular/material/divider';

import { NotificationService } from '../notification.service';
import { Notification, NotificationType } from '../notification.model';
import { NotificationBadgeComponent } from '../badge/notification-badge.component';

@Component({
  selector: 'app-notification-dropdown',
  standalone: true,
  imports: [
    CommonModule, 
    RouterModule, 
    NotificationBadgeComponent,
    // Angular Material modules
    MatButtonModule,
    MatIconModule,
    MatCardModule,
    MatListModule,
    MatProgressSpinnerModule,
    MatBadgeModule,
    MatDividerModule
  ],
  templateUrl: './notification-dropdown.component.html',
  styleUrls: ['./notification-dropdown.component.scss']
})
export class NotificationDropdownComponent implements OnInit, OnDestroy {
  isOpen = false;
  isLoading = false;
  notifications: Notification[] = [];
  unreadCount = 0;
  hasNewChatMessage = false;

  private destroy$ = new Subject<void>();

  constructor(
    private notificationService: NotificationService,
    private elementRef: ElementRef,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.subscribeToUnreadCount();
    this.loadNotifications();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private subscribeToUnreadCount(): void {
    this.notificationService.unreadCount$
      .pipe(takeUntil(this.destroy$))
      .subscribe(count => {
        this.unreadCount = count;
        this.checkForChatMessages();
      });
  }

  private checkForChatMessages(): void {
    this.hasNewChatMessage = this.notifications.some(n => 
      n.title.includes('Tin nhắn mới') && n.status === 'UNREAD'
    );
  }

  private loadNotifications(): void {
    if (this.isLoading) {
      return;
    }

    this.isLoading = true;

    this.notificationService.getUserNotifications(0, 10)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (notificationPage) => {
          const allNotifications = notificationPage.content || [];
          this.notifications = allNotifications;
          this.checkForChatMessages();
          this.isLoading = false;
        },
        error: (err) => {
          this.notifications = [];
          this.isLoading = false;
          if (err.message?.includes('not authenticated')) {
            this.isOpen = false;
          }
          console.error('Error loading notifications:', err);
        }
      });
  }

  toggleDropdown(): void {
    this.isOpen = !this.isOpen;
    
    if (this.isOpen && this.notifications.length === 0) {
      this.loadNotifications();
    }
  }

 onNotificationClick(notification: Notification): void {
    // Chỉ đánh dấu đã đọc nếu chưa đọc (dựa vào status)
    if (notification.status !== 'READ') {
      this.notificationService.markAsRead(notification.id)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: () => {
            notification.status = 'READ';
            // this.cdr.detectChanges(); // Không cần detectChanges ở dropdown
            
            // CẢI THIỆN: Force refresh unread count để cập nhật badge
            this.notificationService.forceRefreshUnreadCount();
            
            // CẢI THIỆN: Dispatch custom event để notification badge cập nhật
            window.dispatchEvent(new CustomEvent('notificationRead', {
              detail: { notificationId: notification.id }
            }));
          },
          error: (error) => {
            console.error('Error marking as read:', error);
          }
        });
    }

    // Ưu tiên điều hướng dựa vào link nếu có
    if (notification.link) {
      // Nếu là link ngoài (http/https), chuyển trang ngoài
      if (/^https?:\/\//.test(notification.link)) {
        window.location.href = notification.link;
      } else {
        // Nếu là route nội bộ, đảm bảo bắt đầu bằng '/'
        const route = notification.link.startsWith('/') ? notification.link : '/' + notification.link;
        this.router.navigate([route]);
      }
      return;
    }

    // Nếu không có link, fallback cho các loại chat/community
    if (notification.title && notification.title.includes('Tin nhắn mới')) {
      if (notification.title.includes('Community')) {
        this.router.navigate(['/vip/chat/chat-community']);
      } else if (notification.title.includes('từ')) {
        this.router.navigate(['/vip/chat/chat-private']);
      }
    }
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: Event): void {
    if (!this.elementRef.nativeElement.contains(event.target)) {
      this.isOpen = false;
    }
  }

  markAllAsRead(): void {
    this.notificationService.markAllAsRead()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          // CẢI THIỆN: Cập nhật trạng thái tất cả notifications
          this.notifications.forEach(notification => {
            notification.status = 'READ';
          });
          
          // CẢI THIỆN: Force refresh unread count để cập nhật badge
          this.notificationService.forceRefreshUnreadCount();
          
          // CẢI THIỆN: Dispatch custom event để notification badge cập nhật
          window.dispatchEvent(new CustomEvent('allNotificationsRead'));
          
          // CẢI THIỆN: Reload notifications để cập nhật UI
          this.loadNotifications();
          
          // this.cdr.detectChanges(); // Không cần detectChanges ở dropdown
        },
        error: (error) => {
          console.error('Error marking all as read:', error);
        }
      });
  }

  getNotificationIcon(type: NotificationType): string {
    switch (type) {
      case NotificationType.SYSTEM: return 'settings';
      case NotificationType.PLANT_CARE: return 'eco';
      case NotificationType.EXPERT_RESPONSE: return 'support_agent';
      case NotificationType.TICKET_UPDATE: return 'confirmation_number';
      case NotificationType.PROMOTION: return 'local_offer';
      case NotificationType.REMINDER: return 'notifications_active';
      default: return 'info';
    }
  }

  getNotificationClass(type: NotificationType): string {
    switch (type) {
      case NotificationType.SYSTEM: return 'system';
      case NotificationType.PLANT_CARE: return 'plant-care';
      case NotificationType.EXPERT_RESPONSE: return 'expert';
      case NotificationType.TICKET_UPDATE: return 'ticket';
      case NotificationType.PROMOTION: return 'promotion';
      case NotificationType.REMINDER: return 'reminder';
      default: return 'default';
    }
  }

  formatTime(dateInput: string | number): string {
    let date: Date;
    if (typeof dateInput === 'number') {
      date = new Date(dateInput);
    } else if (!isNaN(Number(dateInput))) {
      date = new Date(Number(dateInput));
    } else {
      date = new Date(dateInput);
    }
    if (isNaN(date.getTime())) return '';

    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMinutes = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMinutes < 1) return 'Vừa xong';
    if (diffMinutes < 60) return `${diffMinutes}p`;
    if (diffHours < 24) return `${diffHours}h`;
    if (diffDays < 7) return `${diffDays}d`;
    return date.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' });
  }

  truncateText(text: string, maxLength: number = 60): string {
    return text.length <= maxLength ? text : text.substring(0, maxLength) + '...';
  }

  trackByNotificationId(index: number, notification: Notification): number {
    return notification.id;
  }

  private mapBackendLink(link: string): string {
    if (/^\/user-plants\/(\d+)$/.test(link)) {
      return link.replace(/^\/user-plants\/(\d+)$/, '/user/user-plant-detail/$1');
    }
    if (/^\/ticket\/(\d+)$/.test(link)) {
      return link.replace(/^\/ticket\/(\d+)$/, '/user/my-tickets/$1');
    }
    if (link === '/vip/benefits') {
      return '/vip/welcome';
    }
    return link;
  }

  private navigateToRelatedEntity(notification: Notification): void {
    const entityType = notification.relatedEntityType?.toLowerCase();
    const entityId = notification.relatedEntityId;

    switch (entityType) {
      case 'plant':
        this.router.navigate(['/plant-detail', entityId]);
        break;
      case 'ticket':
        this.router.navigate(['/user/ticket', entityId]);
        break;
      case 'expert':
        this.router.navigate(['/user/expert', entityId]);
        break;
      default:
        break;
    }
  }

  public toNotificationType(type: string): NotificationType { 
    return Object.values(NotificationType).includes(type as NotificationType)
      ? (type as NotificationType)
      : NotificationType.SYSTEM;
  }

  /**
   * Format nội dung thông báo để hiển thị đẹp hơn
   */
  formatNotificationContent(notification: Notification): string {
    if (notification.title.includes('Tin nhắn mới')) {
      // Lấy tên người gửi từ message
      const message = notification.message || '';
      
      // Nếu message có dạng "username: nội dung"
      if (message.includes(':')) {
        const parts = message.split(':');
        if (parts.length >= 2) {
          const sender = parts[0].trim();
          const content = parts.slice(1).join(':').trim();
          
          // Map role names
          let roleName = sender;
          if (sender.toLowerCase() === 'expert') {
            roleName = 'Chuyên gia';
          } else if (sender.toLowerCase() === 'vip') {
            roleName = 'VIP';
          }
          
          return `${roleName}: "${content}"`;
        }
      }
      
      // Fallback: trả về message gốc
      return message;
    }
    
    // Các notification khác giữ nguyên
    return notification.message;
  }

  /**
   * Format title thông báo
   */
  formatNotificationTitle(notification: Notification): string {
    if (notification.title.includes('Tin nhắn mới')) {
      return 'Bạn có tin nhắn mới';
    }
    return notification.title;
  }
}