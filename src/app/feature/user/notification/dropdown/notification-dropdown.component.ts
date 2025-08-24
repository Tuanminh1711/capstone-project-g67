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

  private destroy$ = new Subject<void>();

  constructor(
    private notificationService: NotificationService,
    private elementRef: ElementRef,
    private router: Router
  ) {}

  ngOnInit(): void {
    // Subscribe để cập nhật unread count
    this.subscribeToUnreadCount();
    
    // Load danh sách thông báo
    this.loadNotifications();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
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
   * Load danh sách thông báo
   */
  private loadNotifications(): void {
    // Ngăn infinite loop - chỉ load nếu chưa loading
    if (this.isLoading) {
      console.log('⏳ Already loading, skipping...');
      return;
    }

    console.log('🔄 Loading notifications...');
    this.isLoading = true;

    // Timeout fallback để đảm bảo loading state luôn được reset
    const loadingTimeout = setTimeout(() => {
      if (this.isLoading) {
        console.log('⏰ Loading timeout, resetting loading state');
        this.isLoading = false;
      }
    }, 10000); // 10 giây timeout

    // Load cả unread count và danh sách thông báo
    this.notificationService.getUserNotifications(0, 10)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (notificationPage) => {
          clearTimeout(loadingTimeout);
          console.log('📥 Raw response:', notificationPage);
          
          const allNotifications = notificationPage.content || [];
          console.log('📥 All notifications:', allNotifications);
          
          // Hiển thị tất cả notifications (không filter theo status)
          this.notifications = allNotifications;
          
          this.isLoading = false;
          
          console.log('📋 Loaded notifications:', this.notifications.length, 'total');
          console.log('📋 Final notifications data:', this.notifications);
        },
        error: (err) => {
          clearTimeout(loadingTimeout);
          this.notifications = [];
          this.isLoading = false;
          if (err.message?.includes('not authenticated')) {
            this.isOpen = false;
          }
          console.error('Error loading notifications:', err);
        }
      });
  }

  /* ========== Event Handlers ========== */

  toggleDropdown(): void {
    this.isOpen = !this.isOpen;
    
    // Khi mở dropdown, chỉ load dữ liệu nếu chưa có
    if (this.isOpen && this.notifications.length === 0) {
      console.log('📋 Dropdown opened, loading notifications...');
      this.loadNotifications();
    } else if (this.isOpen) {
      console.log('📋 Dropdown opened, notifications already loaded');
    }
  }

  onNotificationClick(notification: Notification, event: Event): void {
    event.stopPropagation();
    this.markAsRead(notification, event);

    if (notification.link) {
      let link = this.mapBackendLink(notification.link);
      this.router.navigate([link]);
      this.isOpen = false;
      return;
    }

    if (notification.relatedEntityId && notification.relatedEntityType) {
      this.navigateToRelatedEntity(notification);
      this.isOpen = false;
    }
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: Event): void {
    if (!this.elementRef.nativeElement.contains(event.target)) {
      this.isOpen = false;
    }
  }

  /* ========== Public Methods ========== */

  markAsRead(notification: Notification, event: Event): void {
    event.stopPropagation();
    if (notification.status === 'READ') return;

    this.notificationService.markAsRead(notification.id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          notification.status = 'READ';
          // Refresh lại danh sách
          this.loadNotifications();
        },
        error: (err) => {
          console.error('Error marking notification as read:', err);
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

  /* ========== Private Methods ========== */

  private refreshNotifications(): void {
    console.log('🔄 Refreshing notifications...');
    this.loadNotifications();
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
}
