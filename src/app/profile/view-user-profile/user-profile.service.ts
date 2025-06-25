import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, BehaviorSubject, throwError } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
import { ConfigService } from '../../shared/config.service';
import { JwtUserUtilService } from '../../auth/jwt-user-util.service';

export interface UserProfile {
  id: number;
  username: string;
  email: string;
  fullName: string;
  phoneNumber: string;
  avatar: string | null;
  gender: string | null;
  livingEnvironment: string | null;
}

export interface UpdateUserProfileRequest {
  id: number;
  fullName: string;
  phoneNumber: string;
  livingEnvironment: string;
  avatar: string;
  gender: string;
}

@Injectable({
  providedIn: 'root'
})
export class UserProfileService {
  // Cache dữ liệu profile
  private profileCache = new BehaviorSubject<UserProfile | null>(null);
  
  constructor(
    private http: HttpClient,
    private configService: ConfigService,
    private jwtUserUtil: JwtUserUtilService
  ) {}

  getUserProfile(userId: number): Observable<UserProfile> {
    console.log('Loading user profile via proxy for userId:', userId);
    
    // Sử dụng relative URL để tận dụng proxy configuration
    return this.http.get<UserProfile>(`/api/user/profile/${userId}`, {
      withCredentials: true
    }).pipe(
      tap(profile => {
        console.log('User profile loaded:', profile);
        // Cache profile data
        this.profileCache.next(profile);
      }),
      catchError(this.handleError)
    );
  }

  updateUserProfile(updateData: UpdateUserProfileRequest): Observable<any> {
    const userId = this.jwtUserUtil.getUserIdFromToken();
    if (userId) {
      updateData.id = parseInt(userId, 10);
    } else {
      console.error('User ID not found in token. Cannot update profile.');
      alert('Error: Unable to update profile. User ID is missing.');
      return throwError(() => new Error('User ID not found in token'));
    }

    console.log('Sending update profile request to: /api/user/updateprofile (via proxy)');
    console.log('Update data:', updateData);

    return this.http.put<any>('/api/user/updateprofile', updateData, {
      withCredentials: true,
      headers: {
        'Content-Type': 'application/json'
      }
    }).pipe(
      tap(response => {
        console.log('Update profile response:', response);
        this.profileCache.next(null);
      }),
      catchError(error => {
        console.error('Failed to update profile:', error);
        alert('Error: Failed to update profile. Please try again later.');
        return throwError(() => error);
      })
    );
  }

  changePassword(passwordData: any): Observable<any> {
    console.log('Sending password change request to: /api/auth/changepassword (via proxy)');
    console.log('Password data:', { oldPassword: '***', newPassword: '***' });
    
    // Sử dụng relative URL để tận dụng proxy configuration
    return this.http.post<any>('/api/auth/changepassword', passwordData, {
      withCredentials: true,
      headers: {
        'Content-Type': 'application/json'
      }
    }).pipe(
      tap(response => {
        console.log('Password change response:', response);
      }),
      catchError(this.handleError)
    );
  }

  // Lấy profile từ cache
  getCachedProfile(): UserProfile | null {
    return this.profileCache.value;
  }

  // Clear cache
  clearProfileCache(): void {
    this.profileCache.next(null);
  }

  // Error handling
  private handleError = (error: HttpErrorResponse): Observable<never> => {
    console.error('UserProfileService Error:', error);
    
    let errorMessage = 'Đã xảy ra lỗi không mong muốn.';
    
    if (error.error instanceof ErrorEvent) {
      // Client-side error
      errorMessage = `Lỗi kết nối: ${error.error.message}`;
    } else {
      // Server-side error
      switch (error.status) {
        case 400:
          errorMessage = 'Dữ liệu không hợp lệ.';
          break;
        case 401:
          errorMessage = 'Bạn cần đăng nhập để thực hiện hành động này.';
          break;
        case 403:
          errorMessage = 'Bạn không có quyền truy cập.';
          break;
        case 404:
          errorMessage = 'Không tìm thấy thông tin người dùng.';
          break;
        case 500:
          errorMessage = 'Lỗi máy chủ. Vui lòng thử lại sau.';
          break;
        default:
          errorMessage = `Lỗi ${error.status}: ${error.error?.message || 'Không xác định'}`;
      }
    }
    
    return throwError(() => ({ ...error, userMessage: errorMessage }));
  };
}
