import { Injectable } from '@angular/core';
import { CanActivate, CanActivateChild, Router, UrlTree, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { AuthService } from './auth.service';

@Injectable({ providedIn: 'root' })
export class ExpertAuthGuard implements CanActivate, CanActivateChild {
  constructor(private authService: AuthService, private router: Router) {}

  canActivate(): boolean | UrlTree {
    return this.checkExpertOrLogin(arguments[0], arguments[1]);
  }

  canActivateChild(childRoute: ActivatedRouteSnapshot, state: RouterStateSnapshot): boolean | UrlTree {
    return this.checkExpertOrLogin(childRoute, state);
  }

  private checkExpertOrLogin(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): boolean | UrlTree {
    const role = this.authService.getCurrentUserRole();
    const url = state && state.url ? state.url : (this.router.url || '');
    console.log('[EXPERT GUARD DEBUG] role:', role, '| url:', url);
    
    // Nếu chưa đăng nhập, chuyển hướng về trang đăng nhập admin
    if (!role) {
      return this.router.createUrlTree(['/auth/login-admin']);
    }
    
    // Chỉ cho phép Expert và Staff truy cập các route expert
    if (role === 'EXPERT' || role === 'STAFF') {
      return true;
    }
    
    // Admin cũng có thể truy cập (để quản lý)
    if (role === 'ADMIN') {
      return true;
    }
    
    // Các role khác không được phép truy cập
    return this.router.createUrlTree(['/auth/login-admin']);
  }
}
