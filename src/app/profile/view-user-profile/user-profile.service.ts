import { environment } from '../../../environments/environment';

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
  avatar?: string; // Optional field
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

  getUserProfile(): Observable<UserProfile> {
    // Sử dụng endpoint mới với JWT Authorization header
    // Backend sẽ lấy userId từ JWT token trong request attribute
    return this.http.get<UserProfile>('/api/user/profile', {
      withCredentials: true
    }).pipe(
      tap(profile => {
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
      return throwError(() => new Error('User ID not found in token'));
    }

    return this.http.put<any>('/api/user/updateprofile', updateData, {
      withCredentials: true,
      headers: {
        'Content-Type': 'application/json'
      }
    }).pipe(
      tap(response => {
        this.profileCache.next(null);
      }),
      catchError(error => {
        return throwError(() => error);
      })
    );
  }

  changePassword(passwordData: any): Observable<any> {
    // Sử dụng endpoint mới với JWT Authorization header
    // Backend sẽ lấy userId từ JWT token trong request attribute
    return this.http.post<any>('/api/auth/change-password', passwordData, {
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


  updateAvatar(file: File): Observable<any> {
    const formData = new FormData();
    formData.append('avatar', file);
    // Use environment.apiUrl for update-avatar
    return this.http.post<any>(`${environment.apiUrl}/user/update-avatar`, formData, {
      withCredentials: true
    }).pipe(
      tap(response => {
        this.profileCache.next(null);
      }),
      catchError(error => {
        return throwError(() => error);
      })
    );
  }

  /**
   * Upload avatar cho user hiện tại.
   * @param file File ảnh đại diện (File object từ input)
   * @returns Observable với response từ backend
   */
  uploadAvatar(file: File): Observable<any> {
    const formData = new FormData();
    formData.append('avatar', file);
    return this.http.put<any>('/api/user/update-avatar', formData, {
      withCredentials: true
    }).pipe(
      tap(response => {
        this.profileCache.next(null);
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
          errorMessage = 'Lỗi máy chủ. API chưa sẵn sàng hoặc có lỗi xử lý.';
          break;
        default:
          errorMessage = `Lỗi ${error.status}: ${error.error?.message || 'Không xác định'}`;
      }
    }
    
    return throwError(() => ({ ...error, userMessage: errorMessage }));
  };

 
}
