import { Injectable } from '@angular/core';
import { CanActivate, CanActivateChild, Router, UrlTree, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { AuthService } from './auth.service';

@Injectable({ providedIn: 'root' })
export class VipAuthGuard implements CanActivate, CanActivateChild {
  constructor(private authService: AuthService, private router: Router) {}

  canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): boolean | UrlTree {
    return this.checkVipAccess(route, state);
  }

  canActivateChild(childRoute: ActivatedRouteSnapshot, state: RouterStateSnapshot): boolean | UrlTree {
    return this.checkVipAccess(childRoute, state);
  }

  private checkVipAccess(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): boolean | UrlTree {
    const role = this.authService.getCurrentUserRole();
    const isLoggedIn = this.authService.isLoggedIn();
    const url = state && state.url ? state.url : (this.router.url || '');
    
    console.log('[VIP GUARD DEBUG] role:', role, '| isLoggedIn:', isLoggedIn, '| url:', url);

    // Kiểm tra xem người dùng đã đăng nhập chưa
    if (!isLoggedIn) {
      console.log('[VIP GUARD] User not logged in, redirecting to home');
      return this.router.createUrlTree(['/home']);
    }

    // Chỉ cho phép VIP và EXPERT truy cập
    if (role === 'VIP' || role === 'EXPERT') {
      console.log('[VIP GUARD] Access granted for role:', role);
      return true;
    }

    // Nếu không phải VIP hoặc EXPERT, từ chối truy cập
    console.log('[VIP GUARD] Access denied for role:', role, 'redirecting to home');
    
    // Hiển thị thông báo lỗi nếu có thể
    if (role === 'USER') {
      // Có thể thêm toast notification ở đây
      console.warn('❌ Bạn cần nâng cấp lên VIP để truy cập tính năng này!');
    } else {
      console.warn('❌ Bạn không có quyền truy cập vào khu vực VIP!');
    }

    return this.router.createUrlTree(['/home']);
  }
}
