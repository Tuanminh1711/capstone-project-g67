import { Component, OnInit, ChangeDetectorRef, OnDestroy, ViewChild, AfterViewChecked, HostListener, ElementRef } from '@angular/core';
import { ExpertNotificationListComponent } from '../../notification/expert-notification-list.component';
import { JwtUserUtilService } from '../../../../auth/jwt-user-util.service';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../../../auth/auth.service';
import { HttpClient } from '@angular/common/http';
import { UrlService } from '../../../../shared/services/url.service';
import { ChatService } from '../../../../shared/services/chat.service';
import { BehaviorSubject, Observable, Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { NotificationService } from '../../../user/notification/notification.service';

@Component({
  selector: 'app-expert-sidebar',
  standalone: true,
  imports: [CommonModule, RouterModule, ExpertNotificationListComponent],
  templateUrl: './expert-sidebar.component.html',
  styleUrls: ['./expert-sidebar.component.scss']
})
export class ExpertSidebarComponent implements OnInit, OnDestroy, AfterViewChecked {
  @ViewChild('notiList') notiListComponent?: ExpertNotificationListComponent;
  showNotificationList = false;
  private lastShowNotificationList = false;
  @HostListener('document:click', ['$event'])
  onDocumentClick(event: Event): void {
    // Kiểm tra xem click có phải từ notification dropdown không
    const target = event.target as HTMLElement;
    const notificationBadge = this.elementRef.nativeElement.querySelector('.sidebar-notification-badge');
    const notificationDropdown = this.elementRef.nativeElement.querySelector('.expert-notification-list-dropdown');
    
    if (this.showNotificationList && 
        !notificationBadge?.contains(target) && 
        !notificationDropdown?.contains(target)) {
      this.showNotificationList = false;
      setTimeout(() => {
        this.cdr.detectChanges();
      }, 0);
    }
  }

  toggleNotificationList(): void {
    console.log('Toggle notification clicked, current state:', this.showNotificationList);
    this.showNotificationList = !this.showNotificationList;
    console.log('New state:', this.showNotificationList);
    
    // Sử dụng setTimeout để tránh ExpressionChangedAfterItHasBeenCheckedError
    setTimeout(() => {
      this.cdr.detectChanges();
    }, 0);
  }

  ngAfterViewChecked(): void {
    if (this.showNotificationList && this.notiListComponent && !this.lastShowNotificationList) {
      this.notiListComponent.showList(true);
      this.lastShowNotificationList = true;
    } else if (!this.showNotificationList && this.lastShowNotificationList) {
      this.lastShowNotificationList = false;
    }
  }
  notificationCount = 0;
  isChatDropdownOpen = false;
  recentUsers$ = new BehaviorSubject<{ username: string, userId: number, conversationId?: string }[]>([]);
  currentUserName: string = 'Expert'; // Giá trị mặc định
  fullUserName: string = 'Expert'; // Lưu tên đầy đủ cho tooltip
  currentUserId: string | null = null;
  
  // Notification properties
  unreadNotificationCount = 0;
  isNotificationDropdownOpen = false;
  isLoadingNotifications = false;
  notifications: any[] = [];
  private destroy$ = new Subject<void>();

  constructor(
    private cdr: ChangeDetectorRef,
    private router: Router,
    private authService: AuthService,
    private http: HttpClient,
    private urlService: UrlService,
    private chatService: ChatService,
    private jwtUserUtil: JwtUserUtilService,
    private notificationService: NotificationService,
    private elementRef: ElementRef
  ) {}

  ngOnInit(): void {
    this.loadNotificationCountSimple();
    this.loadCurrentUser();
    this.loadRecentUsers();
    this.currentUserId = this.jwtUserUtil.getUserIdFromToken();
    
    // Refresh notification count every 30 seconds
    setInterval(() => {
      this.loadNotificationCountSimple();
    }, 30000);
  }

  /**
   * Gọi API /api/notifications để lấy số lượng thông báo chưa đọc
   */
  private loadNotificationCountSimple(): void {
    // Chỉ load nếu không đang hiển thị dropdown
    if (this.showNotificationList) {
      return;
    }
    
    this.http.get<any>('/api/notifications').subscribe({
      next: (res) => {
        let newCount = 0;
        
        if (Array.isArray(res)) {
          // Đếm số lượng chưa đọc nếu có trường status
          newCount = res.filter(n => n.status !== 'READ').length;
        } else if (res && typeof res === 'object') {
          // Kiểm tra các trường có thể chứa notifications
          let notifications: any[] = [];
          if (res.data && Array.isArray(res.data.content)) {
            // Cấu trúc: { data: { content: [...] } }
            notifications = res.data.content;
          } else if (Array.isArray(res.content)) {
            // Cấu trúc: { content: [...] }
            notifications = res.content;
          } else if (Array.isArray(res.data)) {
            // Cấu trúc: { data: [...] }
            notifications = res.data;
          } else if (Array.isArray(res.notifications)) {
            // Cấu trúc: { notifications: [...] }
            notifications = res.notifications;
          } else if (Array.isArray(res.items)) {
            // Cấu trúc: { items: [...] }
            notifications = res.items;
          }
          
          newCount = notifications.filter((n: any) => n.status !== 'READ').length;
        }
        
        // Chỉ update nếu count thay đổi
        if (this.notificationCount !== newCount) {
          this.notificationCount = newCount;
          console.log('Notification count updated:', this.notificationCount);
          console.log('Total notifications:', res?.data?.content?.length || 0);
          console.log('Unread count:', newCount);
          setTimeout(() => {
            this.cdr.detectChanges();
          }, 0);
        }
      },
      error: (error) => {
        console.error('Error loading notification count:', error);
        if (this.notificationCount !== 0) {
          this.notificationCount = 0;
          setTimeout(() => {
            this.cdr.detectChanges();
          }, 0);
        }
      }
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadCurrentUser() {
    // Lấy tên người dùng từ AuthService
    const username = this.authService.getCurrentUsername();
    if (username && username.trim()) {
      this.fullUserName = username;
      this.currentUserName = this.formatDisplayName(username);
    } else {
      // Nếu không có username trong AuthService, thử lấy từ API
      this.loadUserProfile();
    }
  }

  formatDisplayName(name: string): string {
    // Cắt tên nếu quá dài (giới hạn 15 ký tự)
    if (name.length > 15) {
      return name.substring(0, 15) + '...';
    }
    return name;
  }

  loadUserProfile() {
    // Gọi API để lấy thông tin profile người dùng
    const apiUrl = `${this.urlService.getApiUrl('experts')}/profile`;
    this.http.get<any>(apiUrl).subscribe({
      next: (profile) => {
        let displayName = 'Expert'; // Fallback mặc định
        
        if (profile && profile.username) {
          displayName = profile.username;
        } else if (profile && profile.fullName) {
          displayName = profile.fullName;
        } else if (profile && profile.name) {
          displayName = profile.name;
        }
        
        this.fullUserName = displayName;
        this.currentUserName = this.formatDisplayName(displayName);
        this.cdr.detectChanges();
      },
      error: (error) => {
        this.fullUserName = 'Expert';
        this.currentUserName = 'Expert'; // Giữ giá trị mặc định
      }
    });
  }

  loadRecentUsers() {
    // Lấy danh sách các cuộc trò chuyện giống trang tin nhắn riêng tư
    this.chatService.getConversations().subscribe({
      next: (conversations) => {
        const users = conversations.map(c => ({
          username: c.otherUsername,
          userId: c.otherUserId,
          conversationId: c.conversationId
        }));
        this.recentUsers$.next(users);
        this.cdr.detectChanges();
      },
      error: () => {
        this.recentUsers$.next([]);
        this.cdr.detectChanges();
      }
    });
  }

  toggleChatDropdown() {
    this.isChatDropdownOpen = !this.isChatDropdownOpen;
  }

  navigateToCommunityChat() {
    this.router.navigate(['/expert/chat']);
    // Dropdown luôn mở
  }

  navigateToUserChat(user: any) {
    this.router.navigate(['/expert/private-chat'], { queryParams: { conversationId: user.conversationId } });
    // Dropdown luôn mở
  }

    isChatRoute(): boolean {
    const url = this.router.url;
    return url.startsWith('/expert/chat') || url.startsWith('/expert/private-chat');
  }

  logout() {
    // Sử dụng AuthService logout dành riêng cho expert
    this.authService.logoutExpert();
  }

  /**
   * Load số thông báo chưa đọc
   */
  private loadNotificationCount(): void {
    this.notificationService.getUnreadCount()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (count: number) => {
          this.unreadNotificationCount = count;
          this.cdr.detectChanges();
        },
        error: (error: any) => {
          console.error('Error loading notification count:', error);
          this.unreadNotificationCount = 0;
        }
      });
  }

  /**
   * Subscribe để cập nhật số thông báo chưa đọc
   */
  private subscribeToNotifications(): void {
    this.notificationService.unreadCount$
      .pipe(takeUntil(this.destroy$))
      .subscribe((count: number) => {
        this.unreadNotificationCount = count;
        this.cdr.detectChanges();
      });
  }

  /**
   * Toggle notification dropdown
   */
  toggleNotificationDropdown(): void {
    this.isNotificationDropdownOpen = !this.isNotificationDropdownOpen;
    if (this.isNotificationDropdownOpen && this.notifications.length === 0) {
      this.loadNotifications();
    }
  }

  /**
   * Load danh sách notifications
   */
  private loadNotifications(): void {
    this.isLoadingNotifications = true;
    
    this.notificationService.getUserNotifications(0, 5) // Chỉ load 5 notifications đầu tiên cho dropdown
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response: any) => {
          this.notifications = response.content || [];
          this.isLoadingNotifications = false;
          this.cdr.detectChanges();
        },
        error: (error: any) => {
          console.error('Error loading notifications:', error);
          this.notifications = [];
          this.isLoadingNotifications = false;
          this.cdr.detectChanges();
        }
      });
  }

  /**
   * Kiểm tra notification có chưa đọc không
   */
  isUnread(notification: any): boolean {
    return notification.status !== 'READ';
  }

  /**
   * Xử lý khi click vào notification
   */
  onNotificationClick(notification: any): void {
    // Đánh dấu đã đọc nếu chưa đọc
    if (notification.status !== 'READ') {
      this.notificationService.markAsRead(notification.id)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: () => {
            notification.status = 'READ';
            this.unreadNotificationCount = Math.max(0, this.unreadNotificationCount - 1);
            this.cdr.detectChanges();
          },
          error: (error: any) => {
            console.error('Error marking as read:', error);
          }
        });
    }

    // Đóng dropdown
    this.isNotificationDropdownOpen = false;

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

  /**
   * Format thời gian
   */
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

  /**
   * Navigate đến trang thông báo
   */
  navigateToNotifications(): void {
    this.router.navigate(['/expert/notifications']);
  }

  // trackBy function for notifications
  trackByNotificationId(index: number, notification: any): any {
    return notification && notification.id ? notification.id : index;
  }

  // Thêm method để refresh notification count
  refreshNotificationCount(): void {
    this.loadNotificationCountSimple();
  }
}
