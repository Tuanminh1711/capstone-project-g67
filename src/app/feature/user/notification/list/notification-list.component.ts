import { Router } from '@angular/router';
import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { NotificationService } from '../notification.service';
import { Notification, NotificationPage, NotificationType } from '../notification.model';
import { TopNavigatorComponent } from '../../../../shared/top-navigator/top-navigator.component';
import { FooterComponent } from '../../../../shared/footer/footer.component';

@Component({
  selector: 'app-notification-list',
  standalone: true,
  imports: [CommonModule, TopNavigatorComponent],
  templateUrl: './notification-list.component.html',
  styleUrls: ['./notification-list.component.scss']
})
export class NotificationListComponent implements OnInit, OnDestroy {
  // Helper: convert type to NotificationType if possible
  toNotificationType(type: any): NotificationType {
    if (Object.values(NotificationType).includes(type)) {
      return type as NotificationType;
    }
    // fallback: map string to enum
    switch (type) {
      case 'SYSTEM': return NotificationType.SYSTEM;
      case 'PLANT_CARE': return NotificationType.PLANT_CARE;
      case 'EXPERT_RESPONSE': return NotificationType.EXPERT_RESPONSE;
      case 'TICKET_UPDATE': return NotificationType.TICKET_UPDATE;
      case 'PROMOTION': return NotificationType.PROMOTION;
      case 'REMINDER': return NotificationType.REMINDER;
      default: return NotificationType.SYSTEM;
    }
  }

  // Helper: format createdAt safely
  formatCreatedAt(date: string | number | undefined): string {
    if (!date) return '';
    return this.formatTime(date.toString());
  }
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
    // Load notifications ngay khi component khởi tạo
    this.loadNotifications();
    
    // Subscribe vào notifications updates từ service
    this.notificationService.notifications$.pipe(
      takeUntil(this.destroy$)
    ).subscribe(notifications => {
      if (notifications && notifications.length > 0) {
        // Cập nhật local notifications nếu có thay đổi từ service
        this.notifications = notifications.map(n => ({
          ...n,
          isRead: n.status === 'READ' || n.isRead === true,
          status: n.status || (n.isRead ? 'READ' : 'UNREAD')
        }));
        
        this.cdr.detectChanges();
      }
    });

    // Subscribe vào unread count updates từ service
    this.notificationService.unreadCount$.pipe(
      takeUntil(this.destroy$)
    ).subscribe(count => {
      // Badge count sẽ tự động cập nhật thông qua service
      this.cdr.detectChanges();
    });
    
    // Nếu sau 1 giây vẫn chưa có dữ liệu và không loading, thử lại
    setTimeout(() => {
      if (!this.isLoading && this.notifications.length === 0 && !this.error) {
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
    this.isLoading = true;
    this.error = null;
    
    this.notificationService.getUserNotifications(page, this.pageSize)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response: NotificationPage) => {
          // Đảm bảo content luôn là array
          // Đồng bộ trạng thái đã đọc/chưa đọc từ API (status: 'READ'/'UNREAD')
          this.notifications = (response.content || []).map(n => {
            const mappedNotification = {
              ...n,
              isRead: n.status === 'READ' || n.isRead === true,
              status: n.status || (n.isRead ? 'READ' : 'UNREAD')
            };
            return mappedNotification;
          });
          
          this.currentPage = response.number || 0;
          this.totalElements = response.totalElements || 0;
          this.totalPages = response.totalPages || 0;
          
          // Tắt loading state
          this.isLoading = false;
          
          // Trigger change detection để đảm bảo UI cập nhật
          this.cdr.detectChanges();
        },
        error: (error) => {
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
          
          // Trigger change detection để đảm bảo UI cập nhật
          this.cdr.detectChanges();
        }
      });
  }

  /**
   * Đánh dấu notification đã đọc
   */
  markAsRead(notification: Notification): void {
    if (notification.isRead) {
      return;
    }

    // Cập nhật UI ngay lập tức để tránh lag
    const originalState = notification.isRead;
    notification.isRead = true;
    notification.status = 'READ';

    // Trigger change detection ngay lập tức để UI cập nhật
    this.cdr.detectChanges();

    this.notificationService.markAsRead(notification.id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          // Reload lại danh sách để đảm bảo đồng bộ với backend
          setTimeout(() => {
            this.loadNotifications(this.currentPage);
          }, 100);
          
          // Trigger change detection để đảm bảo UI cập nhật
          this.cdr.detectChanges();
        },
        error: (error) => {
          // Revert lại trạng thái nếu có lỗi
          notification.isRead = originalState;
          notification.status = originalState ? 'READ' : 'UNREAD';
          
          // Trigger change detection để đảm bảo UI cập nhật
          this.cdr.detectChanges();
        }
      });
  }

  /**
   * Đánh dấu tất cả đã đọc (tự động force update nếu cần)
   */
  markAllAsRead(): void {
    const unreadNotifications = this.notifications.filter(n => !n.isRead);
    if (unreadNotifications.length === 0) {
      return;
    }
    
    // 1. Cập nhật UI ngay lập tức để tránh lag
    unreadNotifications.forEach(notification => {
      notification.isRead = true;
      notification.status = 'READ';
    });
    
    // 2. Reset badge count ngay lập tức
    this.notificationService.resetUnreadCount();
    
    // 3. Trigger change detection ngay lập tức để UI cập nhật
    this.cdr.detectChanges();
    
    // 4. Gọi API để đánh dấu tất cả đã đọc
    this.notificationService.markAllAsRead()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          // 5. Đảm bảo tất cả notifications đều được đánh dấu đã đọc
          this.notifications.forEach(notification => {
            notification.isRead = true;
            notification.status = 'READ';
          });
          
          // 6. Force update ngay lập tức để đảm bảo UI nhất quán
          this.forceUpdateAllAsRead();
          
          // 7. Reload từ backend để đồng bộ (sau 500ms)
          setTimeout(() => {
            this.loadNotifications(this.currentPage);
          }, 500);
          
          // 8. Force refresh badge count từ server
          setTimeout(() => {
            this.notificationService.forceRefreshUnreadCount();
          }, 600);
          
          // 9. Trigger change detection để đảm bảo UI cập nhật
          this.cdr.detectChanges();
        },
        error: (error) => {
          // Nếu API gặp lỗi, vẫn giữ UI đã cập nhật
          // Không revert lại để đảm bảo trải nghiệm người dùng
          this.cdr.detectChanges();
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
          // Service sẽ tự động cập nhật notifications và unread count
          // Chỉ cần cập nhật local state và trigger change detection
          this.notifications = this.notifications.filter(n => n.id !== notification.id);
          this.totalElements = Math.max(0, this.totalElements - 1);
          
          // Nếu trang hiện tại không còn notification và không phải trang đầu
          if (this.notifications.length === 0 && this.currentPage > 0) {
            this.loadNotifications(this.currentPage - 1);
          } else {
            // Cập nhật lại totalPages
            this.totalPages = Math.ceil(this.totalElements / this.pageSize);
          }
          
          this.cdr.detectChanges();
        },
        error: (error) => {
          // Error deleting notification
          // Trigger change detection để đảm bảo UI cập nhật
          this.cdr.detectChanges();
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
    // Nếu có link thì ưu tiên điều hướng theo link
    if (notification.link) {
      let link = notification.link;
      // Map BE /user-plants/:id => FE /user/user-plant-detail/:id
      const userPlantMatch = link.match(/^\/user-plants\/(\d+)$/);
      if (userPlantMatch) {
        link = `/user/user-plant-detail/${userPlantMatch[1]}`;
      }
      // Map BE /ticket/:id => FE /user/my-tickets/:id
      const ticketMatch = link.match(/^\/ticket\/(\d+)$/);
      if (ticketMatch) {
        link = `/user/my-tickets/${ticketMatch[1]}`;
      }
      // Map BE /vip/benefits => FE /vip/welcome
      if (link === '/vip/benefits') {
        link = '/vip/welcome';
      }
      this.router.navigate([link]);
      return;
    }
    // Nếu không có link thì fallback về entity
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
    // Xử lý cả trường hợp dateString là số (timestamp)
    let date: Date;
    if (!dateString) return '';
    if (!isNaN(Number(dateString))) {
      date = new Date(Number(dateString));
    } else {
      date = new Date(dateString);
    }
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
    this.loadNotifications(this.currentPage);
  }

  /**
   * Force update tất cả notifications thành đã đọc (fallback nếu backend có vấn đề)
   * Được gọi tự động trong markAllAsRead nếu cần
   */
  private forceUpdateAllAsRead(): void {
    // Cập nhật tất cả notifications thành đã đọc
    this.notifications.forEach(notification => {
      notification.isRead = true;
      notification.status = 'READ';
    });
    
    // Đảm bảo UI cập nhật ngay lập tức
    this.cdr.detectChanges();
    
    // Force refresh một lần nữa để đảm bảo
    setTimeout(() => {
      this.cdr.detectChanges();
    }, 100);
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
