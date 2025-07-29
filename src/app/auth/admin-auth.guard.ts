import { Injectable } from '@angular/core';
import { CanActivate, CanActivateChild, Router, UrlTree, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { AuthService } from './auth.service';

@Injectable({ providedIn: 'root' })
export class AdminAuthGuard implements CanActivate, CanActivateChild {
  constructor(private authService: AuthService, private router: Router) {}

  canActivate(): boolean | UrlTree {
    return this.checkAdmin();
  }

  canActivateChild(childRoute: ActivatedRouteSnapshot, state: RouterStateSnapshot): boolean | UrlTree {
    return this.checkAdmin();
  }

  private checkAdmin(): boolean | UrlTree {
    const role = this.authService.getCurrentUserRole();
    if (role === 'ADMIN') {
      return true;
    }
    if (role === 'STAFF') {
      // Chỉ cho phép staff vào các route quản lý cây và phản hồi
      const url = this.router.url || '';
      // Các route staff được phép truy cập
      const allowedStaffRoutes = [
        '/admin/plants',
        '/admin/plants/create',
        '/admin/plants/view',
        '/admin/plants/edit',
        '/admin/plants/update',
        '/admin/reports',
        '/admin/reports/detail',
        '/admin/reports/review',
        '/admin/support/tickets',
        '/admin/support/tickets/',
        '/admin/support/tickets/detail',
      ];
      // Nếu url bắt đầu bằng 1 trong các route trên thì cho phép
      if (allowedStaffRoutes.some(r => url.startsWith(r))) {
        return true;
      }
      // Nếu không, chuyển hướng staff về trang quản lý cây
      return this.router.createUrlTree(['/admin/plants']);
    }
    // Nếu không phải admin hoặc staff, chuyển hướng về trang đăng nhập admin
    return this.router.createUrlTree(['/login-admin']);
  }
// End of AdminAuthGuard
}
