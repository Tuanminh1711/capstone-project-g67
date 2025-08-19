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

    // Kiểm tra xem người dùng đã đăng nhập chưa
    if (!isLoggedIn) {
      return this.router.createUrlTree(['/home']);
    }

    // Chỉ cho phép VIP và EXPERT truy cập
    if (role === 'VIP' || role === 'EXPERT') {
      return true;
    }

    // Nếu không phải VIP hoặc EXPERT, từ chối truy cập
    
    // Hiển thị thông báo lỗi nếu có thể
    if (role === 'USER') {
      // Có thể thêm toast notification ở đây
    }

    return this.router.createUrlTree(['/home']);
  }
}
