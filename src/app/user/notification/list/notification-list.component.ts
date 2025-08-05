import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { NotificationService } from '../notification.service';
import { Notification, NotificationPage, NotificationType } from '../notification.model';
import { TopNavigatorComponent } from '../../../shared/top-navigator/top-navigator.component';
import { FooterComponent } from '../../../shared/footer/footer.component';

@Component({
  selector: 'app-notification-list',
  standalone: true,
  imports: [CommonModule, TopNavigatorComponent, FooterComponent],
  templateUrl: './notification-list.component.html',
  styleUrls: ['./notification-list.component.scss']
})
export class NotificationListComponent implements OnInit, OnDestroy {
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
    console.log('NotificationListComponent initialized, loading notifications...');
    // Load notifications ngay khi component khởi tạo
    this.loadNotifications();
    
    // Nếu sau 1 giây vẫn chưa có dữ liệu và không loading, thử lại
    setTimeout(() => {
      if (!this.isLoading && this.notifications.length === 0 && !this.error) {
        console.log('Retrying to load notifications...');
        this.loadNotifications();
      }
    }, 1000);
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Load danh sách notification
   */
  loadNotifications(page: number = 0): void {
    console.log('Loading notifications for page:', page);
    this.isLoading = true;
    this.error = null;
    
    this.notificationService.getUserNotifications(page, this.pageSize)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response: NotificationPage) => {
          console.log('Notification response:', response);
          
          // Đảm bảo content luôn là array
          this.notifications = response.content || [];
          this.currentPage = response.number || 0;
          this.totalElements = response.totalElements || 0;
          this.totalPages = response.totalPages || 0;
          
          // Tắt loading state
          this.isLoading = false;
          
          console.log(`Successfully loaded ${this.notifications.length} notifications`);
          
          // Trigger change detection để đảm bảo UI cập nhật
          this.cdr.detectChanges();
        },
        error: (error) => {
          console.error('Error loading notifications:', error);
          
          // Reset data
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
        }
      });
  }

  /**
   * Đánh dấu notification đã đọc
   */
  markAsRead(notification: Notification): void {
    if (notification.isRead) {
      console.log('Notification already read:', notification.id);
      return;
    }

    console.log('Marking notification as read:', notification.id);
    
    // Cập nhật UI ngay lập tức để tránh lag
    const originalState = notification.isRead;
    notification.isRead = true;
    
    this.notificationService.markAsRead(notification.id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          console.log('Successfully marked notification as read:', notification.id);
          // Đã cập nhật UI rồi, không cần làm gì thêm
        },
        error: (error) => {
          console.error('Error marking notification as read:', error);
          // Revert lại trạng thái nếu có lỗi
          notification.isRead = originalState;
        }
      });
  }

  /**
   * Đánh dấu tất cả đã đọc
   */
  markAllAsRead(): void {
    const unreadNotifications = this.notifications.filter(n => !n.isRead);
    
    if (unreadNotifications.length === 0) {
      console.log('No unread notifications to mark');
      return;
    }
    
    console.log('Marking all notifications as read:', unreadNotifications.length);
    
    // Cập nhật UI ngay lập tức
    const originalStates = unreadNotifications.map(n => ({ id: n.id, isRead: n.isRead }));
    unreadNotifications.forEach(notification => notification.isRead = true);
    
    this.notificationService.markAllAsRead()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          console.log('Successfully marked all notifications as read');
          // UI đã được cập nhật rồi
        },
        error: (error) => {
          console.error('Error marking all notifications as read:', error);
          // Revert lại trạng thái nếu có lỗi
          originalStates.forEach(state => {
            const notification = this.notifications.find(n => n.id === state.id);
            if (notification) {
              notification.isRead = state.isRead;
            }
          });
        }
      });
  }

  /**
   * Xóa notification
   */
  deleteNotification(notification: Notification, event: Event): void {
    event.stopPropagation();
    
    if (!confirm('Bạn có chắc chắn muốn xóa thông báo này?')) {
      return;
    }

    this.notificationService.deleteNotification(notification.id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          console.log('Deleted notification:', notification.id);
          
          // Xóa khỏi local state ngay lập tức
          this.notifications = this.notifications.filter(n => n.id !== notification.id);
          this.totalElements = Math.max(0, this.totalElements - 1);
          
          // Nếu trang hiện tại không còn notification và không phải trang đầu
          if (this.notifications.length === 0 && this.currentPage > 0) {
            this.loadNotifications(this.currentPage - 1);
          } else {
            // Cập nhật lại totalPages
            this.totalPages = Math.ceil(this.totalElements / this.pageSize);
          }
        },
        error: (error) => {
          console.error('Error deleting notification:', error);
        }
      });
  }

  /**
   * Chuyển trang
   */
  goToPage(page: number): void {
    if (page >= 0 && page < this.totalPages && page !== this.currentPage) {
      this.loadNotifications(page);
    }
  }

  /**
   * Trang trước
   */
  previousPage(): void {
    if (this.currentPage > 0) {
      this.goToPage(this.currentPage - 1);
    }
  }

  /**
   * Trang sau
   */
  nextPage(): void {
    if (this.currentPage < this.totalPages - 1) {
      this.goToPage(this.currentPage + 1);
    }
  }

  /**
   * Xử lý click notification
   */
  onNotificationClick(notification: Notification): void {
    // Đánh dấu đã đọc
    this.markAsRead(notification);
    
    // Navigate dựa trên type và relatedEntityId
    if (notification.relatedEntityId && notification.relatedEntityType) {
      this.navigateToRelatedEntity(notification);
    }
  }

  /**
   * Navigate đến entity liên quan
   */
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
        // Không navigate nếu không biết type
        break;
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
      return `${diffMinutes} phút trước`;
    } else if (diffHours < 24) {
      return `${diffHours} giờ trước`;
    } else if (diffDays < 7) {
      return `${diffDays} ngày trước`;
    } else {
      return date.toLocaleDateString('vi-VN');
    }
  }

  /**
   * Refresh danh sách
   */
  refresh(): void {
    console.log('Refreshing notifications for page:', this.currentPage);
    this.loadNotifications(this.currentPage);
  }

  /**
   * Track by function cho ngFor
   */
  trackByNotificationId(index: number, notification: Notification): number {
    return notification.id;
  }

  /**
   * Get page numbers cho pagination
   */
  getVisiblePages(): number[] {
    const pages: number[] = [];
    const maxVisible = 5;
    
    if (this.totalPages <= maxVisible) {
      // Hiển thị tất cả trang nếu ít hơn maxVisible
      for (let i = 0; i < this.totalPages; i++) {
        pages.push(i);
      }
    } else {
      // Logic phức tạp hơn cho nhiều trang
      const start = Math.max(0, this.currentPage - 2);
      const end = Math.min(this.totalPages - 1, start + maxVisible - 1);
      
      // Thêm trang đầu và ... nếu cần
      if (start > 0) {
        pages.push(0);
        if (start > 1) {
          pages.push(-1); // -1 để hiển thị ...
        }
      }
      
      // Thêm các trang ở giữa
      for (let i = start; i <= end; i++) {
        if (i !== 0 && i !== this.totalPages - 1) {
          pages.push(i);
        }
      }
      
      // Thêm ... và trang cuối nếu cần
      if (end < this.totalPages - 1) {
        if (end < this.totalPages - 2) {
          pages.push(-1); // -1 để hiển thị ...
        }
        pages.push(this.totalPages - 1);
      }
      
      // Nếu chưa có trang đầu hoặc cuối, thêm vào
      if (!pages.includes(0)) {
        pages.unshift(0);
      }
      if (!pages.includes(this.totalPages - 1)) {
        pages.push(this.totalPages - 1);
      }
    }
    
    return pages;
  }
}
