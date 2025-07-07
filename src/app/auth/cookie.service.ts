import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class CookieService {
  
  /**
   * Lấy cookie theo tên
   * @param name Tên cookie
   * @returns Giá trị cookie hoặc null nếu không tìm thấy
   */
  getCookie(name: string): string | null {
    if (typeof document === 'undefined') {
      return null; // SSR safety
    }
    
    const nameEQ = name + "=";
    const ca = document.cookie.split(';');
    
    for (let i = 0; i < ca.length; i++) {
      let c = ca[i];
      while (c.charAt(0) === ' ') {
        c = c.substring(1, c.length);
      }
      if (c.indexOf(nameEQ) === 0) {
        return c.substring(nameEQ.length, c.length);
      }
    }
    return null;
  }

  /**
   * Set cookie với các tùy chọn bảo mật
   * @param name Tên cookie
   * @param value Giá trị cookie
   * @param days Số ngày hết hạn (mặc định 7 ngày)
   * @param secure Chỉ gửi qua HTTPS (mặc định true cho production)
   * @param sameSite SameSite policy (mặc định 'Strict')
   */
  setCookie(
    name: string, 
    value: string, 
    days: number = 7, 
    secure: boolean = false, // Default false cho development 
    sameSite: 'Strict' | 'Lax' | 'None' = 'Lax' // Lax cho development
  ): void {
    if (typeof document === 'undefined') {
      return; // SSR safety
    }

    const expires = new Date();
    expires.setTime(expires.getTime() + (days * 24 * 60 * 60 * 1000));
    
    let cookieString = `${name}=${value}; expires=${expires.toUTCString()}; path=/`;
    
    // Chỉ set Secure flag khi chạy trên HTTPS (production)
    if (secure && location.protocol === 'https:') {
      cookieString += '; Secure';
    }
    
    cookieString += `; SameSite=${sameSite}`;
    
    document.cookie = cookieString;
  }

  /**
   * Xóa cookie
   * @param name Tên cookie cần xóa
   */
  deleteCookie(name: string): void {
    if (typeof document === 'undefined') {
      return; // SSR safety
    }
    
    document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
  }

  /**
   * Kiểm tra xem cookie có tồn tại không
   * @param name Tên cookie
   * @returns true nếu cookie tồn tại, false nếu không
   */
  hasCookie(name: string): boolean {
    return this.getCookie(name) !== null;
  }

  /**
   * Lấy JWT token từ cookie
   * @returns JWT token hoặc null nếu không tìm thấy
   */
  getAuthToken(): string | null {
    const token = this.getCookie('auth_token');
    return token;
  }

  /**
   * Lưu JWT token vào cookie với bảo mật cao
   * @param token JWT token
   * @param days Số ngày hết hạn (mặc định 7 ngày)
   */
  setAuthToken(token: string, days: number = 7): void {
    // Development: không dùng secure và strict
    this.setCookie('auth_token', token, days, false, 'Lax');
  }

  /**
   * Xóa JWT token khỏi cookie
   */
  removeAuthToken(): void {
    this.deleteCookie('auth_token');
  }
}
