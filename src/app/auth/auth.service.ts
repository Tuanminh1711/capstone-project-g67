import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { CookieService } from './cookie.service';
import { JwtUserUtilService } from './jwt-user-util.service';
import { environment } from '../../environments/environment'; 

export interface LoginRequest {
  username: string;
  password: string;
}

export interface LoginResponse {
  token?: string | null;
  accessToken?: string;
  refreshToken?: string;
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
  // Kiểm tra mã reset password
  verifyResetCode(email: string, code: string): Observable<any> {
    // Gửi qua query string cho đúng backend
    return this.http.post(`${this.apiUrl}/auth/verify-reset-code?email=${encodeURIComponent(email)}&code=${encodeURIComponent(code)}`, {});
  }

  // Đặt lại mật khẩu
  resetPassword(email: string, code: string, newPassword: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/auth/reset-password?email=${encodeURIComponent(email)}&code=${encodeURIComponent(code)}&newPassword=${encodeURIComponent(newPassword)}`, {});
  }
  // Gửi yêu cầu quên mật khẩu
  forgotPassword(email: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/auth/forgot-password`, { email });
  }
  private apiUrl = environment.apiUrl; // Direct to backend

  constructor(
    private http: HttpClient,
    private cookieService: CookieService,
    private jwtUserUtil: JwtUserUtilService
  ) {}

  login(data: LoginRequest): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(`${this.apiUrl}/auth/login`, data).pipe(
        tap(response => {
          // Lưu token vào cookie 'auth_token', thời hạn 1 tiếng, bảo mật cao
          if (response.token) {
            this.cookieService.setAuthToken(response.token);
          }
          if (response.accessToken) {
            this.cookieService.setAccessToken(response.accessToken);
          }
          // Không lưu refreshToken bằng JS, backend phải set cookie HttpOnly
          
          // Kiểm tra xem có cần redirect về trang cũ không
          this.checkRedirectAfterLogin();
        })
    );
  }

  register(data: RegisterRequest): Observable<RegisterResponse> {
    return this.http.post<RegisterResponse>(`${this.apiUrl}/auth/register`, data);
  }

  verifyEmail(data: VerifyEmailRequest): Observable<VerifyEmailResponse> {
    // Truyền email và otp qua query string
    return this.http.post<VerifyEmailResponse>(
      `${this.apiUrl}/auth/verify-email?email=${encodeURIComponent(data.email)}&otp=${encodeURIComponent(data.otp)}`,
      {}
    );
  }

  resendVerificationEmail(email: string): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/auth/resend-verification?email=${encodeURIComponent(email)}`, {});
  }

  /**
   * Đăng xuất
   */
  logout(redirect = true): void {
    const token = this.cookieService.getCookie('auth_token');
    const role = this.jwtUserUtil.getRoleFromToken()?.toLowerCase(); // Chuyển về chữ thường để so sánh
    
    const doLogout = () => {
      // Xóa token trước khi chuyển hướng để tránh flash của trang home
      this.cookieService.removeAuthToken();
      this.cookieService.removeAccessToken();

      if (redirect) {
        // Sử dụng session storage để đánh dấu rằng đây là một logout
        sessionStorage.setItem('isLogout', 'true');
        
        // Logic redirect based on role
        if (role === 'admin' || role === 'staff' || role === 'expert') {
          // Admin, staff, expert luôn về login-admin
          window.location.href = '/login-admin';
        } else {
          // User thường về home
          window.location.href = '/home';
        }
      }
    };

    if (token) {
      this.http.post(`${this.apiUrl}/auth/logout`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      }).subscribe({
        next: (response: any) => {
          // Logout successful
          doLogout();
        },
        error: (error: any) => {
          // Logout API error - still logout locally
          doLogout(); // Vẫn logout dù API fail
        }
      });
    } else {
      doLogout();
    }
  }

  /**
   * Đăng xuất dành riêng cho Admin/Staff
   */
  logoutAdmin(): void {
    const token = this.cookieService.getCookie('auth_token');
    
    const doAdminLogout = () => {
      // Xóa tất cả tokens
      this.cookieService.removeAuthToken();
      this.cookieService.removeAccessToken();
      
      // Đánh dấu logout
      sessionStorage.setItem('isLogout', 'true');
      sessionStorage.setItem('logoutType', 'admin');
      
      // Luôn chuyển về login-admin
      window.location.href = '/login-admin';
    };

    if (token) {
      this.http.post(`${this.apiUrl}/auth/logout`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      }).subscribe({
        next: (response: any) => {
          // Admin logout successful
          doAdminLogout();
        },
        error: (error: any) => {
          // Admin logout API error - still logout locally
          doAdminLogout(); // Vẫn logout dù API fail
        }
      });
    } else {
      doAdminLogout();
    }
  }

  /**
   * Đăng xuất dành riêng cho Expert
   */
  logoutExpert(): void {
    const token = this.cookieService.getCookie('auth_token');
    
    const doExpertLogout = () => {
      // Xóa tất cả tokens
      this.cookieService.removeAuthToken();
      this.cookieService.removeAccessToken();
      
      // Đánh dấu logout
      sessionStorage.setItem('isLogout', 'true');
      sessionStorage.setItem('logoutType', 'expert');
      
      // Luôn chuyển về login-admin
      window.location.href = '/login-admin';
    };

    if (token) {
      this.http.post(`${this.apiUrl}/auth/logout`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      }).subscribe({
        next: (response: any) => {
          // Expert logout successful
          doExpertLogout();
        },
        error: (error: any) => {
          // Expert logout API error - still logout locally
          doExpertLogout(); // Vẫn logout dù API fail
        }
      });
    } else {
      doExpertLogout();
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
   * Lấy username hiện tại từ token
   */
  getCurrentUsername(): string | null {
    return this.jwtUserUtil.getUsernameFromToken();
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
  getProfile(userId?: string): Observable<any> {
    // Lấy token từ cookie
    const token = this.cookieService.getCookie('auth_token');
    const headers: Record<string, string> = token ? { Authorization: `Bearer ${token}` } : {};
    return this.http.get<any>(`${this.apiUrl}/user/profile`, Object.keys(headers).length ? { headers } : {});
  }

  /**
   * Kiểm tra và redirect về trang cũ sau khi đăng nhập
   */
  private checkRedirectAfterLogin(): void {
    const redirectUrl = sessionStorage.getItem('redirectAfterLogin');
    if (redirectUrl) {
      // Xóa redirect URL khỏi session storage
      sessionStorage.removeItem('redirectAfterLogin');
      
      // Redirect về trang cũ
      setTimeout(() => {
        window.location.href = redirectUrl;
      }, 100);
    }
  }

  loginAdmin(data: { username: string; password: string }) {
    return this.http.post<any>(`${this.apiUrl}/auth/login-admin`, data).pipe(
      tap(response => {
        // Lưu token vào cookie sau khi đăng nhập admin thành công
        if (response.token) {
          this.cookieService.setAuthToken(response.token);
        }
        if (response.accessToken) {
          this.cookieService.setAccessToken(response.accessToken);
        }
      })
    );
  }
}
