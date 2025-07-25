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
  token: string | null;
  userId?: string;
  username?: string;
  message?: string;
  status?: number;
  role?: string | null;
  email?: string;
  requiresVerification?: boolean;
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

export interface VerifyEmailRequest {
  email: string;
  otp: string;
}

export interface VerifyEmailResponse {
  message: string;
  success: boolean;
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
          this.cookieService.setAuthToken(response.token, 7); // 7 ngày
        }
      })
    );
  }

  register(data: RegisterRequest): Observable<RegisterResponse> {
    return this.http.post<RegisterResponse>(`${this.apiUrl}/register`, data);
  }

  verifyEmail(data: VerifyEmailRequest): Observable<VerifyEmailResponse> {
    // Truyền email và otp qua query string
    return this.http.post<VerifyEmailResponse>(
      `${this.apiUrl}/verify-email?email=${encodeURIComponent(data.email)}&otp=${encodeURIComponent(data.otp)}`,
      {}
    );
  }

  resendVerificationEmail(email: string): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/resend-verification?email=${encodeURIComponent(email)}`, {});
  }

  /**
   * Đăng xuất - xóa token khỏi cookie
   */
  logout(): void {
    const token = this.cookieService.getAuthToken();
    if (token) {
      this.http.post(`${this.apiUrl}/logout`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      }).subscribe({
        next: () => {
          this.cookieService.removeAuthToken();
        },
        error: () => {
          // Dù lỗi vẫn xóa token phía client
          this.cookieService.removeAuthToken();
        }
      });
    } else {
      this.cookieService.removeAuthToken();
    }
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

  loginAdmin(data: { username: string; password: string }) {
    return this.http.post<any>('http://localhost:8080/api/auth/login-admin', data);
  }
}
