
import { jwtDecode } from 'jwt-decode';
import { Injectable } from '@angular/core';
import { CookieService } from './cookie.service';

@Injectable({ providedIn: 'root' })
export class JwtUserUtilService {
  constructor(private cookieService: CookieService) {}

  public getAuthToken(): string | null {
    return this.cookieService.getCookie('auth_token');
  }

  getUserIdFromToken(): string | null {
    // Lấy token từ cookie thay vì localStorage
    const token = this.cookieService.getCookie('auth_token');
    if (!token) return null;
    
    try {
      const decoded: any = jwtDecode(token);
      // Ưu tiên trả về userId nếu có, nếu không thì trả về null
      return decoded.userId ? decoded.userId.toString() : null;
    } catch (e) {
      return null;
    }
  }

  getRoleFromToken(): string | null {
    // Lấy token từ cookie thay vì localStorage
    const token = this.cookieService.getCookie('auth_token');
    if (!token) return null;
    
    try {
      const decoded: any = jwtDecode(token);
      return decoded.role || null;
    } catch (e) {
      return null;
    }
  }

  /**
   * Kiểm tra xem user có đang đăng nhập không
   */
  isLoggedIn(): boolean {
    return this.cookieService.hasCookie('auth_token');
  }

  /**
   * Lấy thông tin đầy đủ từ token
   */
  getTokenInfo(): any | null {
    const token = this.cookieService.getCookie('auth_token');
    if (!token) return null;
    
    try {
      return jwtDecode(token);
    } catch (e) {
      return null;
    }
  }
}
