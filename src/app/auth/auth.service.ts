import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { CookieService } from './cookie.service';
import { JwtUserUtilService } from './jwt-user-util.service';

export interface LoginRequest {
  username: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  userId?: string;
  // Thêm các trường khác nếu backend trả về
}

export interface RegisterRequest {
  username: string;
  password: string;
  confirmPassword: string;
  fullName: string;
  phone: string;
  email: string;
}

export interface RegisterResponse {
  // Định nghĩa các trường backend trả về khi đăng ký thành công
  message: string;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private apiUrl = '/api/auth'; // Use relative URL to work with proxy

  constructor(
    private http: HttpClient,
    private cookieService: CookieService,
    private jwtUserUtil: JwtUserUtilService
  ) {}

  login(data: LoginRequest): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(`${this.apiUrl}/login`, data).pipe(
      tap(response => {
        // Lưu token vào cookie khi login thành công
        if (response.token) {
          console.log('Token received from login response:', response.token);
          this.cookieService.setAuthToken(response.token, 7); // 7 ngày
          console.log('Token successfully saved in cookie.');
        } else {
          console.error('No token found in login response.');
        }
      })
    );
  }

  register(data: RegisterRequest): Observable<RegisterResponse> {
    return this.http.post<RegisterResponse>(`${this.apiUrl}/register`, data);
  }

  /**
   * Đăng xuất - xóa token khỏi cookie
   */
  logout(): void {
    this.cookieService.removeAuthToken();
  }

  /**
   * Kiểm tra xem user có đang đăng nhập không
   */
  isLoggedIn(): boolean {
    return this.jwtUserUtil.isLoggedIn();
  }

  /**
   * Lấy userId hiện tại từ token
   */
  getCurrentUserId(): string | null {
    return this.jwtUserUtil.getUserIdFromToken();
  }

  /**
   * Lấy role hiện tại từ token
   */
  getCurrentUserRole(): string | null {
    return this.jwtUserUtil.getRoleFromToken();
  }

  // Kiểm tra kết nối API backend
  ping(): Observable<string> {
    return this.http.get(`${this.apiUrl}/ping`, { responseType: 'text' });
  }

  // Lấy thông tin profile user
  getProfile(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/profile`, { withCredentials: true });
  }
}
