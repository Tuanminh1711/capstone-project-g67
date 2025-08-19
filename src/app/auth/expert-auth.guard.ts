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
    
    // Nếu chưa đăng nhập, chuyển hướng về trang đăng nhập admin
    if (!role) {
      return this.router.createUrlTree(['/login-admin']);
    }
    
    // CHỈ cho phép Expert truy cập các route expert
    if (role === 'EXPERT') {
      return true;
    }
    
    // Tất cả các role khác (ADMIN, STAFF, USER, VIP, GUEST) đều không được phép truy cập
    
    // Chuyển hướng dựa trên role
    switch (role) {
      case 'ADMIN':
        return this.router.createUrlTree(['/admin']);
      case 'STAFF':
        return this.router.createUrlTree(['/admin']); // Staff cũng dùng admin interface
      case 'VIP':
        return this.router.createUrlTree(['/vip']);
      case 'USER':
        return this.router.createUrlTree(['/']);
      default:
        return this.router.createUrlTree(['/login-admin']);
    }
  }
}
