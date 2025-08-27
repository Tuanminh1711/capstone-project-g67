import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { Router } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import { NotificationService } from '../notification.service';
import { Notification, NotificationPage, NotificationType } from '../notification.model';
import { TopNavigatorComponent } from '../../../../shared/top-navigator/top-navigator.component';
import { FooterComponent } from '../../../../shared/footer/footer.component';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-notification-list',
  standalone: true,
  imports: [CommonModule, TopNavigatorComponent],
  templateUrl: './notification-list.component.html',
  styleUrls: ['./notification-list.component.scss']
})
export class NotificationListComponent implements OnInit, OnDestroy {
  // Helper: xác định notification chưa đọc dựa vào status
  isUnread(notification: Notification): boolean {
    return notification.status !== 'READ';
  }
  hasNewChatMessage = false;
  notifications: Notification[] = [];
  currentPage = 0;
  pageSize = 10;
  totalElements = 0;
  totalPages = 0;
  isLoading = false;
  error: string | null = null;
  
  private destroy$ = new Subject<void>();

  // Enum cho template
  NotificationType = NotificationType;
  
  // Math cho template
  MathUtil = Math;

  constructor(
    private notificationService: NotificationService,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.loadNotifications();
    // Subscribe to unread notifications to update chat message alert
    this.notificationService.getUnreadNotifications()
      .pipe(takeUntil(this.destroy$))
      .subscribe((unreadNotifications) => {
        this.hasNewChatMessage = unreadNotifications.some(n =>
          n.title && n.title.includes('Tin nhắn mới')
        );
        this.cdr.detectChanges();
      });
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
    // Chỉ đánh dấu đã đọc nếu chưa đọc (dựa vào status)
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

  refresh(): void {
    this.loadNotifications(this.currentPage);
  }

  previousPage(): void {
    if (this.currentPage > 0) {
      this.goToPage(this.currentPage - 1);
    }
  }

  nextPage(): void {
    if (this.currentPage < this.totalPages - 1) {
      this.goToPage(this.currentPage + 1);
    }
  }

  goToPage(page: number): void {
    if (page >= 0 && page < this.totalPages) {
      this.loadNotifications(page);
    }
  }

  getVisiblePages(): number[] {
    const pages: number[] = [];
    const maxVisible = 5;
    
    if (this.totalPages <= maxVisible) {
      for (let i = 0; i < this.totalPages; i++) {
        pages.push(i);
      }
    } else {
      const start = Math.max(0, this.currentPage - 2);
      const end = Math.min(this.totalPages - 1, start + maxVisible - 1);
      
      if (start > 0) {
        pages.push(0);
        if (start > 1) {
          pages.push(-1); // -1 để hiển thị ...
        }
      }
      
      for (let i = start; i <= end; i++) {
        if (i !== 0 && i !== this.totalPages - 1) {
          pages.push(i);
        }
      }
      
      if (end < this.totalPages - 1) {
        if (end < this.totalPages - 2) {
          pages.push(-1);
        }
        pages.push(this.totalPages - 1);
      }
      
      if (!pages.includes(0)) {
        pages.unshift(0);
      }
      if (!pages.includes(this.totalPages - 1)) {
        pages.push(this.totalPages - 1);
      }
    }
    
    return pages;
  }

  trackByNotificationId(index: number, notification: Notification): number {
    return notification.id;
  }

  getNotificationClass(type: NotificationType): string {
    switch (type) {
      case NotificationType.SYSTEM:
        return 'notification-system';
      case NotificationType.PLANT_CARE:
        return 'notification-plant-care';
      case NotificationType.EXPERT_RESPONSE:
        return 'notification-expert-response';
      case NotificationType.TICKET_UPDATE:
        return 'notification-ticket-update';
      case NotificationType.PROMOTION:
        return 'notification-promotion';
      case NotificationType.REMINDER:
        return 'notification-reminder';
      default:
        return 'notification-default';
    }
  }

  getNotificationIcon(type: NotificationType): string {
    switch (type) {
      case NotificationType.SYSTEM:
        return 'fas fa-cog';
      case NotificationType.PLANT_CARE:
        return 'fas fa-seedling';
      case NotificationType.EXPERT_RESPONSE:
        return 'fas fa-user-check';
      case NotificationType.TICKET_UPDATE:
        return 'fas fa-ticket-alt';
      case NotificationType.PROMOTION:
        return 'fas fa-gift';
      case NotificationType.REMINDER:
        return 'fas fa-bell';
      default:
        return 'fas fa-bell';
    }
  }

  toNotificationType(type: string): NotificationType {
    switch (type) {
      case 'SYSTEM':
        return NotificationType.SYSTEM;
      case 'PLANT_CARE':
        return NotificationType.PLANT_CARE;
      case 'EXPERT_RESPONSE':
        return NotificationType.EXPERT_RESPONSE;
      case 'TICKET_UPDATE':
        return NotificationType.TICKET_UPDATE;
      case 'PROMOTION':
        return NotificationType.PROMOTION;
      case 'REMINDER':
        return NotificationType.REMINDER;
      default:
        return NotificationType.SYSTEM;
    }
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

  formatCreatedAt(date: string | number | undefined): string {
    if (!date) return '';
    
    const dateObj = new Date(date);
    const now = new Date();
    const diffInHours = (now.getTime() - dateObj.getTime()) / (1000 * 60 * 60);
    
    if (diffInHours < 1) {
      return 'Vừa xong';
    } else if (diffInHours < 24) {
      return `${Math.floor(diffInHours)} giờ trước`;
    } else {
      return dateObj.toLocaleDateString('vi-VN');
    }
  }
}