import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, BehaviorSubject, throwError } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
import { ConfigService } from '../../../shared/config.service';
import { JwtUserUtilService } from '../../../auth/jwt-user-util.service';

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

  getUserProfile(): Observable<UserProfile> {
    // Use configService to build the correct URL based on environment
    const url = this.configService.getFullUrl('/api/user/profile');
    return this.http.get<UserProfile>(url, {
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
    const url = this.configService.getFullUrl('/api/user/updateprofile');
    return this.http.put<any>(url, updateData, {
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
