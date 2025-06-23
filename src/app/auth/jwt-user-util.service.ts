import { jwtDecode } from 'jwt-decode';
import { Injectable } from '@angular/core';
import { CookieService } from 'ngx-cookie-service';

@Injectable({ providedIn: 'root' })
export class JwtUserUtilService {
  constructor(private cookieService: CookieService) {}

  getUserIdFromToken(): string | null {
    let token = this.cookieService.get('token');
    // Chỉ dùng document.cookie nếu đang ở trình duyệt (không phải SSR)
    if (!token && typeof document !== 'undefined') {
      const match = document.cookie.match(new RegExp('(^| )token=([^;]+)'));
      token = match ? match[2] : '';
    }
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
    let token = this.cookieService.get('token');
    if (!token && typeof document !== 'undefined') {
      const match = document.cookie.match(new RegExp('(^| )token=([^;]+)'));
      token = match ? match[2] : '';
    }
    if (!token) return null;
    try {
      const decoded: any = jwtDecode(token);
      return decoded.role || null;
    } catch (e) {
      return null;
    }
  }
}
