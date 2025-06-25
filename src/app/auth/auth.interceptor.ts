import { HttpErrorResponse, HttpHeaders, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { CookieService } from './cookie.service';
import { environment } from '../../environments/environment';

export const authInterceptor: HttpInterceptorFn = (request, next) => {
  const cookieService = inject(CookieService);
  const token = cookieService.getAuthToken();

  // Chuẩn bị headers
  let headers = new HttpHeaders({
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  });

  if (token) {
    headers = headers.set('Authorization', `Bearer ${token}`);
  }

  // Chuẩn bị URL cho môi trường production
  let url = request.url;
  if (environment.production && !request.url.startsWith('http')) {
    url = `${environment.baseUrl}${request.url}`;
  }

  // Clone request với headers và URL mới
  const apiReq = request.clone({
    headers: headers,
    url: url
  });

  return next(apiReq).pipe(
    catchError((error: HttpErrorResponse) => {
      // Ghi log lỗi trong môi trường development
      if (!environment.production) {
        console.error('API Error:', error);
      }
      
      // Xử lý thông báo lỗi
      let errorMessage = 'An unknown error occurred';
      if (error.error) {
        if (typeof error.error === 'string') {
          errorMessage = error.error;
        } else if (error.error.message) {
          errorMessage = error.error.message;
        } else if (typeof error.error === 'object') {
          errorMessage = JSON.stringify(error.error);
        }
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      return throwError(() => new Error(errorMessage));
    })
  );
};
