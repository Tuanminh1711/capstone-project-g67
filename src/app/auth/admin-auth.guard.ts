import { Injectable } from '@angular/core';
import { CanActivate, CanActivateChild, Router, UrlTree, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { AuthService } from './auth.service';

@Injectable({ providedIn: 'root' })
export class AdminAuthGuard implements CanActivate, CanActivateChild {
  constructor(private authService: AuthService, private router: Router) {}

  canActivate(): boolean | UrlTree {
    return this.checkAdminOrLogin(arguments[0], arguments[1]);
  }

  canActivateChild(childRoute: ActivatedRouteSnapshot, state: RouterStateSnapshot): boolean | UrlTree {
    return this.checkAdminOrLogin(childRoute, state);
  }

  private checkAdminOrLogin(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): boolean | UrlTree {
    const role = this.authService.getCurrentUserRole();
    const url = state && state.url ? state.url : (this.router.url || '');
    console.log('[GUARD DEBUG] role:', role, '| url:', url);
    // Nếu đã đăng nhập (admin hoặc staff) mà vào /login-admin thì redirect về /admin
    if ((role === 'ADMIN' || role === 'STAFF') && url === '/login-admin') {
      return this.router.createUrlTree(['/admin']);
    }
    // Nếu chưa đăng nhập, chỉ cho phép vào /login-admin
    if (!role && url === '/login-admin') {
      return true;
    }
    if (role === 'ADMIN') {
      return true;
    }
    if (role === 'STAFF') {
      const allowedStaffRoutes = [
        '/admin',
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
      if (allowedStaffRoutes.some(r => url === r || url.startsWith(r))) {
        return true;
      }
      return this.router.createUrlTree(['/admin']);
    }
    // Nếu không phải admin hoặc staff, chuyển hướng về trang đăng nhập admin
    return this.router.createUrlTree(['/login-admin']);
  }
// End of AdminAuthGuard
}
