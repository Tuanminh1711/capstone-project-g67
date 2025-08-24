import { Injectable } from '@angular/core';
import { HttpClient, HttpParams, HttpHeaders } from '@angular/common/http';
import { Observable, BehaviorSubject } from 'rxjs';
import { tap, map } from 'rxjs/operators';
import { environment } from '../../../../environments/environment';
import { Notification, NotificationResponse, NotificationPage } from './notification.model';
import { CookieService } from '../../../auth/cookie.service';

@Injectable({
  providedIn: 'root'
})
export class NotificationService {
  private readonly apiUrl = `${environment.apiUrl}/notifications`;
  
  // Subject để theo dõi số notification chưa đọc
  private unreadCountSubject = new BehaviorSubject<number>(0);
  public unreadCount$ = this.unreadCountSubject.asObservable();

  // Subject để theo dõi danh sách notification
  private notificationsSubject = new BehaviorSubject<Notification[]>([]);
  public notifications$ = this.notificationsSubject.asObservable();

  constructor(
    private http: HttpClient,
    private cookieService: CookieService
  ) {}

  /**
   * Tạo HTTP headers với Bearer token
   */
  private getAuthHeaders(): HttpHeaders {
    const token = this.cookieService.getCookie('auth_token');
    if (!token) {
      return new HttpHeaders();
    }
    
    return new HttpHeaders({
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    });
  }

  /**
   * Kiểm tra xem user đã đăng nhập chưa
   */
  private isUserLoggedIn(): boolean {
    const token = this.cookieService.getCookie('auth_token');
    return !!token;
  }

  /**
   * Lấy số notification chưa đọc từ API /unread-count
   */
  getUnreadCount(): Observable<number> {
    if (!this.isUserLoggedIn()) {
      throw new Error('User not authenticated');
    }

    const headers = this.getAuthHeaders();

    return this.http.get<any>(`${this.apiUrl}/unread-count`, { headers })
      .pipe(
        map(response => {
          // Handle different response structures
          if (response && (response.status === 200 || response.code === 200) && response.data !== undefined) {
            return typeof response.data === 'number' ? response.data : 0;
          } else if (response && typeof response === 'number') {
            return response;
          } else if (response && typeof response.count === 'number') {
            return response.count;
          } else {
            return 0;
          }
        }),
        tap(count => {
          // Cập nhật unread count trong service
          this.unreadCountSubject.next(count);
        })
      );
  }

  /**
   * Lấy danh sách notification có phân trang từ API /notifications
   */
  getUserNotifications(page: number = 0, size: number = 10): Observable<NotificationPage> {
    if (!this.isUserLoggedIn()) {
      throw new Error('User not authenticated');
    }

    const params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString());

    const headers = this.getAuthHeaders();

    return this.http.get<any>(`${this.apiUrl}`, { params, headers })
      .pipe(
        map(response => {
          console.log('🔍 Raw API response:', response);
          
          // Handle different response structures
          if (response && (response.status === 200 || response.code === 200) && response.data !== undefined) {
            const notificationPage = response.data as NotificationPage;
            const content = notificationPage.content || [];
            
            console.log('🔍 Parsed notification page:', notificationPage);
            console.log('🔍 Content array:', content);
            
            // Cập nhật danh sách notifications
            this.notificationsSubject.next(content);
            
            return {
              content,
              totalElements: notificationPage.totalElements || 0,
              totalPages: notificationPage.totalPages || 0,
              size: notificationPage.size || size,
              number: notificationPage.number || page,
              first: notificationPage.first || page === 0,
              last: notificationPage.last || true
            } as NotificationPage;
          } else if (response && Array.isArray(response)) {
            // Direct array response
            console.log('🔍 Direct array response:', response);
            
            const mockPage: NotificationPage = {
              content: response,
              totalElements: response.length,
              totalPages: response.length > 0 ? 1 : 0,
              size: size,
              number: page,
              first: page === 0,
              last: true
            };
            
            // Cập nhật danh sách notifications
            this.notificationsSubject.next(response);
            
            return mockPage;
          } else {
            // Empty response
            console.log('🔍 Empty response, returning empty page');
            
            const emptyPage: NotificationPage = {
              content: [],
              totalElements: 0,
              totalPages: 0,
              size: size,
              number: page,
              first: true,
              last: true
            };
            
            this.notificationsSubject.next([]);
            return emptyPage;
          }
        })
      );
  }

  /**
   * Lấy danh sách notification chưa đọc
   */
  getUnreadNotifications(): Observable<Notification[]> {
    if (!this.isUserLoggedIn()) {
      throw new Error('User not authenticated');
    }

    const headers = this.getAuthHeaders();

    return this.http.get<any>(`${this.apiUrl}/unread`, { headers })
      .pipe(
        map(response => {
          // Handle different response structures
          if (response && (response.status === 200 || response.code === 200) && response.data !== undefined) {
            const unreadNotifications = Array.isArray(response.data) ? response.data : [];
            
            // Cập nhật unread count dựa trên số thông báo chưa đọc thực tế
            this.unreadCountSubject.next(unreadNotifications.length);
            
            return unreadNotifications;
          } else if (response && Array.isArray(response)) {
            // Direct array response
            const unreadNotifications = response;
            
            // Cập nhật unread count dựa trên số thông báo chưa đọc thực tế
            this.unreadCountSubject.next(unreadNotifications.length);
            
            return unreadNotifications;
          } else {
            // Reset unread count khi không có thông báo chưa đọc
            this.unreadCountSubject.next(0);
            return [];
          }
        })
      );
  }

  /**
   * Đánh dấu notification đã đọc
   */
  markAsRead(notificationId: number): Observable<any> {
    if (!this.isUserLoggedIn()) {
      throw new Error('User not authenticated');
    }

    const headers = this.getAuthHeaders();

    return this.http.post<NotificationResponse>(`${this.apiUrl}/${notificationId}/mark-read`, {}, { headers })
      .pipe(
        tap(response => {
          if (response.code === 200 || (response.message && response.message.includes('marked as read successfully'))) {
            // Cập nhật trạng thái notification trong danh sách
            const notifications = this.notificationsSubject.value;
            const updatedNotifications = notifications.map(notif => 
              notif.id === notificationId ? { 
                ...notif, 
                status: 'READ' as const
              } : notif
            );
            this.notificationsSubject.next(updatedNotifications);
            
            // Giảm số unread count
            const currentCount = this.unreadCountSubject.value;
            this.unreadCountSubject.next(Math.max(0, currentCount - 1));
          }
        }),
        map(response => {
          if (response.code === 200 || (response.message && response.message.includes('marked as read successfully'))) {
            return response;
          } else {
            throw new Error(response.message);
          }
        })
      );
  }

  /**
   * Đánh dấu tất cả notification đã đọc
   */
  markAllAsRead(): Observable<any> {
    if (!this.isUserLoggedIn()) {
      throw new Error('User not authenticated');
    }

    const headers = this.getAuthHeaders();

    return this.http.post<NotificationResponse>(`${this.apiUrl}/mark-all-read`, {}, { headers })
      .pipe(
        tap(response => {
          if (response.code === 200) {
            // Cập nhật tất cả notification thành đã đọc
            const notifications = this.notificationsSubject.value;
            
            const updatedNotifications = notifications.map(notif => ({ 
              ...notif, 
              status: 'READ' as const
            }));
            
            this.notificationsSubject.next(updatedNotifications);
            
            // Reset unread count về 0
            this.unreadCountSubject.next(0);
          }
        }),
        map(response => {
          if (response.code === 200) {
            return response;
          } else {
            throw new Error(response.message);
          }
        })
      );
  }

  /**
   * Xóa notification
   */
  deleteNotification(notificationId: number): Observable<any> {
    if (!this.isUserLoggedIn()) {
      throw new Error('User not authenticated');
    }

    const headers = this.getAuthHeaders();

    return this.http.delete<NotificationResponse>(`${this.apiUrl}/${notificationId}`, { headers })
      .pipe(
        tap(response => {
          if (response.code === 200) {
            // Xóa notification khỏi danh sách
            const notifications = this.notificationsSubject.value;
            const updatedNotifications = notifications.filter(notif => notif.id !== notificationId);
            this.notificationsSubject.next(updatedNotifications);
            
            // Nếu notification chưa đọc thì giảm unread count
            const deletedNotification = notifications.find(notif => notif.id === notificationId);
            if (deletedNotification && deletedNotification.status !== 'READ') {
              const currentCount = this.unreadCountSubject.value;
              this.unreadCountSubject.next(Math.max(0, currentCount - 1));
            }
          }
        }),
        map(response => {
          if (response.code === 200) {
            return response;
          } else {
            throw new Error(response.message);
          }
        })
      );
  }

  /**
   * Load unread count từ server
   */
  loadUnreadCountIfLoggedIn(): void {
    if (!this.isUserLoggedIn()) {
      return;
    }

    this.getUnreadCount().subscribe({
      error: (error) => {
        // Reset về 0 nếu có lỗi
        this.unreadCountSubject.next(0);
      }
    });
  }

  /**
   * Refresh notification data
   */
  refreshNotifications(): void {
    this.loadUnreadCountIfLoggedIn();
    if (this.isUserLoggedIn()) {
      this.getUserNotifications(0, 10).subscribe({
        error: (error) => {
          // Error refreshing notifications
        }
      });
    }
  }

  /**
   * Get current unread count value
   */
  getCurrentUnreadCount(): number {
    return this.unreadCountSubject.value;
  }

  /**
   * Reset unread count to zero
   */
  resetUnreadCount(): void {
    this.unreadCountSubject.next(0);
  }

  /**
   * Force refresh unread count from server
   */
  forceRefreshUnreadCount(): void {
    this.loadUnreadCountIfLoggedIn();
  }
}
