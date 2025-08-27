import { Component, Input, OnInit, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { environment } from '../../../../environments/environment';

@Component({
  selector: 'app-expert-notification-list',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './expert-notification-list.component.html',
  styleUrls: ['./expert-notification-list.component.scss']
})

export class ExpertNotificationListComponent implements OnInit {
  notifications: any[] = [];
  isLoading = false;
  
  @Output() notificationStatusChanged = new EventEmitter<void>();

  constructor(
    private http: HttpClient,
    private router: Router
  ) {}

  ngOnInit(): void {
    // Không load notification khi khởi tạo, chỉ khi được gọi
    // this.loadNotifications();
  }

  // Gọi hàm này từ parent khi dropdown được mở
  showList(show: boolean) {
    if (show) {
      this.loadNotifications();
    }
  }

    loadNotifications(): void {
    this.isLoading = true;
    this.notifications = []; // Reset notifications before loading
    
    let url = '';
    if (environment.endpoints?.notifications) {
      // Nếu endpoints.notifications đã bắt đầu bằng '/api', không cần ghép apiUrl nếu apiUrl cũng là '/api'
      if (environment.apiUrl && environment.endpoints.notifications.startsWith('/')) {
        // Nếu apiUrl là '/api' hoặc kết thúc bằng '/api', tránh lặp
        if (environment.apiUrl === '/api' && environment.endpoints.notifications.startsWith('/api')) {
          url = environment.endpoints.notifications;
        } else if (environment.apiUrl.endsWith('/') && environment.endpoints.notifications.startsWith('/')) {
          url = environment.apiUrl.slice(0, -1) + environment.endpoints.notifications;
        } else {
          url = environment.apiUrl + environment.endpoints.notifications;
        }
      } else if (environment.apiUrl) {
        url = environment.apiUrl + '/' + environment.endpoints.notifications;
      } else {
        url = environment.endpoints.notifications;
      }
    } else {
      url = environment.apiUrl ? `${environment.apiUrl}/notifications` : '/api/notifications';
    }
    
    console.log('Loading notifications from:', url);
    
    this.http.get<any>(url).subscribe({
      next: (res) => {
        console.log('Notifications response:', res);
        console.log('Response type:', typeof res);
        console.log('Is array:', Array.isArray(res));
        
        let notifications: any[] = [];
        
        if (Array.isArray(res)) {
          // Nếu response là array trực tiếp
          notifications = res;
        } else if (res && typeof res === 'object') {
          // Nếu response là object, kiểm tra các trường có thể chứa notifications
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
          } else if (res.content && Array.isArray(res.content.content)) {
            // Nested content structure
            notifications = res.content.content;
          } else {
            // Nếu không có trường nào, thử convert object thành array
            console.log('No array field found, trying to convert object to array');
            if (res && Object.keys(res).length > 0) {
              // Nếu có data, thử tạo notification từ object
              notifications = [res];
            }
          }
        }
        
        this.notifications = notifications || [];
        this.isLoading = false;
        console.log('Parsed notifications:', this.notifications);
        console.log('Final notifications count:', this.notifications.length);
      },
      error: (error) => {
        console.error('Error loading notifications:', error);
        this.notifications = [];
        this.isLoading = false;
      }
    });
  }

  onNotificationClick(notification: any): void {
    console.log('Notification clicked:', notification);
    
    // Đánh dấu đã đọc nếu chưa đọc
    if (notification.status !== 'READ') {
      this.markAsRead(notification.id);
    }
    
    // Điều hướng dựa vào link
    if (notification.link) {
      console.log('Navigating to:', notification.link);
      
      // Xử lý các loại link khác nhau
      if (notification.link.includes('/chat/conversation/')) {
        // Chat riêng tư
        this.router.navigate(['/expert/private-chat'], { 
          queryParams: { conversationId: notification.link.split('/').pop() }
        });
      } else if (notification.link.includes('/chat/community')) {
        // Chat cộng đồng
        this.router.navigate(['/expert/chat']);
      } else if (notification.link.startsWith('/')) {
        // Route nội bộ
        this.router.navigate([notification.link]);
      } else {
        // Link ngoài
        window.open(notification.link, '_blank');
      }
    } else {
      // Fallback: điều hướng dựa vào title
      if (notification.title && notification.title.includes('Community')) {
        this.router.navigate(['/expert/chat']);
      } else if (notification.title && notification.title.includes('từ')) {
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

  private markAsRead(notificationId: number): void {
    // Gọi API để đánh dấu đã đọc
    const url = `${environment.apiUrl}/notifications/${notificationId}/read`;
    
    console.log('Marking notification as read:', notificationId);
    console.log('API URL:', url);
    
    this.http.patch<any>(url, {}).subscribe({
      next: (response) => {
        console.log('Marked as read successfully:', response);
        // Cập nhật trạng thái local
        const notification = this.notifications.find(n => n.id === notificationId);
        if (notification) {
          notification.status = 'READ';
          console.log('Updated local notification status to READ');
          // Emit event để parent component cập nhật notification count
          this.notificationStatusChanged.emit();
        }
      },
      error: (error) => {
        console.error('Error marking as read:', error);
        console.error('Error details:', {
          status: error.status,
          message: error.message,
          url: url
        });
        
        // Thử endpoint khác nếu endpoint đầu tiên không hoạt động
        if (error.status === 404) {
          console.log('Trying alternative endpoint...');
          this.tryAlternativeMarkAsRead(notificationId);
        }
      }
    });
  }

  private tryAlternativeMarkAsRead(notificationId: number): void {
    // Thử endpoint khác
    const alternativeUrl = `${environment.apiUrl}/notifications/${notificationId}`;
    
    this.http.put<any>(alternativeUrl, { status: 'READ' }).subscribe({
      next: (response) => {
        console.log('Marked as read with alternative endpoint:', response);
        const notification = this.notifications.find(n => n.id === notificationId);
        if (notification) {
          notification.status = 'READ';
          this.notificationStatusChanged.emit();
        }
      },
      error: (altError) => {
        console.error('Alternative endpoint also failed:', altError);
        // Nếu cả 2 endpoint đều fail, vẫn cập nhật local để UX tốt hơn
        const notification = this.notifications.find(n => n.id === notificationId);
        if (notification) {
          notification.status = 'READ';
          this.notificationStatusChanged.emit();
        }
      }
    });
  }

  trackByNotificationId(index: number, notification: any): any {
    return notification && notification.id ? notification.id : index;
  }
}
