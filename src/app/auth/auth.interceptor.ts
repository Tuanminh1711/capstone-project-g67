import { HttpInterceptorFn } from '@angular/common/http';

export const authInterceptor: HttpInterceptorFn = (request, next) => {
  const match = document.cookie.match(new RegExp('(^| )token=([^;]+)'));
  const token = match ? match[2] : null;
  if (token) {
    request = request.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`
      }
    });
  }
  return next(request);
};
