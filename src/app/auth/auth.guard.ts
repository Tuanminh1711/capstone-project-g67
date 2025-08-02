import { Injectable } from '@angular/core';
import { CanActivate, Router, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { AuthService } from './auth.service';

@Injectable({ providedIn: 'root' })
export class AuthGuard implements CanActivate {
  constructor(private authService: AuthService, private router: Router) {}

  canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): boolean {
    const isLoggedIn = this.authService.isLoggedIn();
    
    if (!isLoggedIn) {
      // Thay vì redirect, chúng ta sẽ cho phép truy cập nhưng với thông tin hạn chế
      // Component sẽ tự xử lý hiển thị thông tin phù hợp
      return true;
    }

    return true;
  }
}
