import { inject } from '@angular/core';
import { HttpInterceptorFn, HttpRequest, HttpHandlerFn, HttpEvent, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { Router } from '@angular/router';
import { AuthService } from './auth.service';
import { ToastService } from '../shared/toast/toast.service';

export const sessionInterceptor: HttpInterceptorFn = (req: HttpRequest<any>, next: HttpHandlerFn): Observable<HttpEvent<any>> => {
  const authService = inject(AuthService);
  const router = inject(Router);
  const toast = inject(ToastService);

  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      // Xử lý lỗi 401 Unauthorized (token hết hạn hoặc không hợp lệ)
      if (error.status === 401) {
        // Kiểm tra xem có phải lỗi session timeout không
        if (error.error?.message?.includes('expired') || 
            error.error?.message?.includes('invalid') ||
            error.error?.message?.includes('unauthorized')) {
          
          // Lưu URL hiện tại để redirect sau khi đăng nhập lại
          const currentUrl = router.url;
          if (currentUrl !== '/home' && currentUrl !== '/') {
            sessionStorage.setItem('redirectAfterLogin', currentUrl);
          }
          
          // Hiển thị thông báo
          toast.error('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại!');
          
          // Xóa token cũ
          authService.logout();
          
          // Redirect về home
          router.navigate(['/home']);
          
          return throwError(() => new Error('Session expired'));
        }
      }
      
      // Xử lý lỗi 403 Forbidden (không có quyền)
      if (error.status === 403) {
        toast.error('Bạn không có quyền truy cập chức năng này!');
        
        // Redirect về home nếu không có quyền
        if (router.url !== '/home' && router.url !== '/') {
          router.navigate(['/home']);
        }
        
        return throwError(() => new Error('Access denied'));
      }
      
      // Xử lý lỗi 500 Internal Server Error
      // if (error.status >= 500) {
      //   toast.error('Lỗi hệ thống. Vui lòng thử lại sau!');
      // }
      
      return throwError(() => error);
    })
  );
};
