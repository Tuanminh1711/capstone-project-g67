import { HttpErrorResponse, HttpHeaders, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { CookieService } from './cookie.service';
import { environment } from '../../environments/environment';

export const authInterceptor: HttpInterceptorFn = (request, next) => {
  const cookieService = inject(CookieService);
  const token = cookieService.getCookie('auth_token');

  // Chuẩn bị headers - merge với headers hiện có
  let headers = request.headers;

  // Chỉ set Content-Type nếu body KHÔNG phải FormData
  if (!(request.body instanceof FormData)) {
    if (!headers.has('Content-Type')) {
      headers = headers.set('Content-Type', 'application/json');
    }
    if (!headers.has('Accept')) {
      headers = headers.set('Accept', 'application/json');
    }
  }
  // Không gửi Authorization cho login/register
  const isAuthApi = ['/api/auth/login', '/api/auth/register'].some(url => request.url.includes(url));
  if (token && !isAuthApi) {
    headers = headers.set('Authorization', `Bearer ${token}`);
    // Authorization header added for add plant endpoint
    // Debug logging removed for security
  } else if (request.url.includes('/user-plants/add')) {
    // No token found for add plant request
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
      // Chỉ ghi log lỗi quan trọng, không log lỗi categories, upload và plants
      const ignoredEndpoints = ['/api/categories', '/api/upload/image', '/api/plants/search', '/api/user/profile'];
      const shouldLog = !environment.production && 
        !ignoredEndpoints.some(endpoint => apiReq.url.includes(endpoint));
      
      if (shouldLog) {
        console.error('API Error:', error);
        // Detailed error logging removed for security
        // Only log essential error information
      }
      
      // Xử lý thông báo lỗi - cải thiện để xử lý cả JSON và text responses
      let errorMessage = 'An unknown error occurred';
      
      // Kiểm tra nếu error.error là SyntaxError (JSON parsing failed)
      if (error.error instanceof SyntaxError) {
        // JSON parsing failed, response might be plain text
        errorMessage = 'Response format error - server returned non-JSON data';
      } else if (error.error) {
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
      
      // Final error message prepared
      return throwError(() => new Error(errorMessage));
    })
  );
};
