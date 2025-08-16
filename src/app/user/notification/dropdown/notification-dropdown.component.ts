import { Component, OnInit, OnDestroy, ElementRef, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
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
  isLoading = false;
  notifications: Notification[] = [];
  unreadCount$!: Observable<number>;

  private destroy$ = new Subject<void>();

  constructor(
    private notificationService: NotificationService,
    private elementRef: ElementRef,
    private router: Router
  ) {}

  /* ========== Lifecycle Hooks ========== */

  ngOnInit(): void {
    this.unreadCount$ = this.notificationService.unreadCount$;
    this.loadUnreadNotifications();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /* ========== Event Handlers ========== */

  toggleDropdown(): void {
    this.isOpen = !this.isOpen;
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
    if (notification.isRead) return;

    this.notificationService.markAsRead(notification.id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          notification.isRead = true;
          this.loadUnreadNotifications();
        },
        error: (err) => console.error('Error marking notification as read:', err)
      });
  }

  markAllAsRead(): void {
    this.notificationService.markAllAsRead()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => { this.notifications = []; },
        error: (err) => console.error('Error marking all notifications as read:', err)
      });
  }

  getNotificationIcon(type: NotificationType): string {
    switch (type) {
      case NotificationType.SYSTEM: return 'fas fa-cog';
      case NotificationType.PLANT_CARE: return 'fas fa-leaf';
      case NotificationType.EXPERT_RESPONSE: return 'fas fa-user-md';
      case NotificationType.TICKET_UPDATE: return 'fas fa-ticket-alt';
      case NotificationType.PROMOTION: return 'fas fa-tag';
      case NotificationType.REMINDER: return 'fas fa-bell';
      default: return 'fas fa-info-circle';
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

  private loadUnreadNotifications(): void {
    this.isLoading = true;

    this.notificationService.getUnreadNotifications()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (notifications) => {
          this.notifications = notifications.slice(0, 5);
          this.isLoading = false;
        },
        error: (err) => {
          this.notifications = [];
          this.isLoading = false;
          if (err.message?.includes('not authenticated')) {
            this.isOpen = false;
          }
        }
      });
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
