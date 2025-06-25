import { Injectable } from '@angular/core';
import { HttpInterceptor, HttpRequest, HttpHandler, HttpEvent, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, finalize } from 'rxjs/operators';
import { environment } from '../../environments/environment';

@Injectable()
export class ApiInterceptor implements HttpInterceptor {
  private activeRequests = 0;

  constructor() {}

  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    this.activeRequests++;

    // Clone request and add common headers
    let apiReq = req.clone({
      setHeaders: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }
    });

    // Add base URL for production
    if (environment.production && !req.url.startsWith('http')) {
      apiReq = apiReq.clone({
        url: `${environment.baseUrl}${req.url}`
      });
    }

    // Note: Authorization header is handled by authInterceptor

    return next.handle(apiReq).pipe(
      catchError((error: HttpErrorResponse) => {
        // Only log in development mode
        if (!environment.production) {
          console.error('API Error:', error);
        }
        
        // Process error message based on response type
        let errorMessage = 'An error occurred';
        
        if (error.error) {
          if (typeof error.error === 'string') {
            // Handle plain text errors (like CORS errors)
            errorMessage = error.error;
          } else if (error.error.message) {
            // Handle JSON errors with message property
            errorMessage = error.error.message;
          } else if (typeof error.error === 'object') {
            try {
              // Handle other JSON error formats
              errorMessage = JSON.stringify(error.error);
            } catch (e) {
              errorMessage = 'Invalid error response format';
            }
          }
        } else if (error.message) {
          errorMessage = error.message;
        }
        
        // Handle common HTTP errors
        if (error.status === 0) {
          // Network error or CORS issue
          errorMessage = 'Network error or CORS issue - check your connection and server configuration';
          console.error('🌐 Network/CORS Error:', errorMessage);
        } else if (error.status === 401) {
          // Unauthorized - redirect to login
          errorMessage = 'Authentication required - token may be invalid or expired';
          console.error('🔒 Authentication Error:', errorMessage);
          // Token handling is now done by authInterceptor
          window.location.href = '/login';
        } else if (error.status === 403) {
          // Forbidden
          errorMessage = 'Access denied - insufficient permissions or invalid token';
          console.error('🚫 Authorization Error:', errorMessage);
          // Token handling is now done by authInterceptor
        } else if (error.status >= 500) {
          // Server error
          errorMessage = 'Server error - please try again later';
          console.error('🔥 Server Error:', errorMessage);
        }

        // Always return a consistent error format
        const processedError = new HttpErrorResponse({
          error: { message: errorMessage },
          headers: error.headers,
          status: error.status,
          statusText: error.statusText,
          url: error.url || undefined
        });

        return throwError(() => processedError);
      }),
      finalize(() => {
        this.activeRequests--;
      })
    );
  }

  get isLoading(): boolean {
    return this.activeRequests > 0;
  }
}
