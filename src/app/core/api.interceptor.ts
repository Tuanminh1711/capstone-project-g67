import { Injectable } from '@angular/core';
import { HttpInterceptor, HttpRequest, HttpHandler, HttpEvent, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, finalize } from 'rxjs/operators';
import { environment } from '../../environments/environment';

@Injectable()
export class ApiInterceptor implements HttpInterceptor {
  private activeRequests = 0;

  intercept(req: HttpRequest<unknown>, next: HttpHandler): Observable<HttpEvent<unknown>> {
    this.activeRequests++;

    let apiReq = req.clone({
      setHeaders: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }
    });

    if (environment.production && !req.url.startsWith('http')) {
      apiReq = apiReq.clone({
        url: `${environment.baseUrl}${req.url}`
      });
    }

    return next.handle(apiReq).pipe(
      catchError((error: HttpErrorResponse) => {
        // API Error handled

        let errorMessage = 'An error occurred';
        const err = error.error;
        if (err) {
          if (typeof err === 'string') {
            errorMessage = err;
          } else if (err.message) {
            errorMessage = err.message;
          } else if (typeof err === 'object') {
            try {
              errorMessage = JSON.stringify(err);
            } catch {
              errorMessage = 'Invalid error response format';
            }
          }
        } else if (error.message) {
          errorMessage = error.message;
        }

        switch (error.status) {
          case 0:
            errorMessage = 'Network error or CORS issue - check your connection and server configuration';
            break;
          case 401:
            errorMessage = 'Authentication required - token may be invalid or expired';
            // For SPA, consider using router navigation instead of window.location.href
            break;
          case 403:
            errorMessage = 'Access denied - insufficient permissions or invalid token';
            break;
          default:
            if (error.status >= 500) {
              errorMessage = 'Server error - please try again later';
            }
            break;
        }

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
