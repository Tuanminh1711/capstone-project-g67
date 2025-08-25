import { Injectable } from '@angular/core';
import { CanActivate, CanActivateChild, Router, UrlTree, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { AuthService } from './auth.service';
import { ToastService } from '../shared/toast/toast.service';

@Injectable({ providedIn: 'root' })
export class UserAuthGuard implements CanActivate, CanActivateChild {
  constructor(
    private authService: AuthService, 
    private router: Router,
    private toast: ToastService
  ) {}

  canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): boolean | UrlTree {
    return this.checkUserAccess(route, state);
  }

  canActivateChild(childRoute: ActivatedRouteSnapshot, state: RouterStateSnapshot): boolean | UrlTree {
    return this.checkUserAccess(childRoute, state);
  }

  private checkUserAccess(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): boolean | UrlTree {
    const role = this.authService.getCurrentUserRole();
    const isLoggedIn = this.authService.isLoggedIn();

    // Kiểm tra xem người dùng đã đăng nhập chưa
    if (!isLoggedIn) {
      // Lưu URL hiện tại để redirect sau khi đăng nhập
      sessionStorage.setItem('redirectAfterLogin', state.url);
      this.toast.error('Vui lòng đăng nhập để truy cập trang này!');
      return this.router.createUrlTree(['/home']);
    }

    // Kiểm tra role
    if (role === 'USER' || role === 'VIP' || role === 'EXPERT' || role === 'ADMIN' || role === 'STAFF') {
      return true;
    }

    // Nếu không có role hợp lệ, từ chối truy cập
    this.toast.error('Bạn không có quyền truy cập trang này!');
    return this.router.createUrlTree(['/home']);
  }
}
