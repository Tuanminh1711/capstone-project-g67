import { inject } from '@angular/core';
import { HttpInterceptorFn, HttpRequest, HttpHandlerFn, HttpEvent } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { Router } from '@angular/router';
import { AuthService } from './auth.service';
import { ToastService } from '../shared/toast/toast.service';

export const expertOnlyInterceptor: HttpInterceptorFn = (req: HttpRequest<any>, next: HttpHandlerFn): Observable<HttpEvent<any>> => {
  const authService = inject(AuthService);
  const router = inject(Router);
  const toast = inject(ToastService);

  // Chỉ áp dụng cho các API request đến expert endpoints
  if (req.url.includes('/expert/') || req.url.includes('/api/expert')) {
    const userRole = authService.getCurrentUserRole();
    
    // Chỉ cho phép EXPERT role
    if (userRole !== 'EXPERT') {
      toast.error('Bạn không có quyền truy cập chức năng này!');
      
      // Chuyển hướng về trang phù hợp
      switch (userRole) {
        case 'ADMIN':
          router.navigate(['/admin']);
          break;
        case 'VIP':
          router.navigate(['/vip/welcome']);
          break;
        case 'USER':
          router.navigate(['/']);
          break;
        default:
          router.navigate(['/login-admin']);
      }
      
      return throwError(() => new Error('Access denied: Expert role required'));
    }
  }

  return next(req).pipe(
    catchError((error) => {
      // Xử lý các lỗi 403 Forbidden từ server
      if (error.status === 403 && req.url.includes('/expert')) {
        toast.error('Bạn không có quyền truy cập chức năng Expert!');
        router.navigate(['/']);
      }
      return throwError(() => error);
    })
  );
};
