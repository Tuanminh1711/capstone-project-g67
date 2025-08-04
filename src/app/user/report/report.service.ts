import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { UserReport, UserReportListResponse, ReportFilter } from './report.model';
import { CookieService } from '../../auth/cookie.service';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class ReportService {
  private apiUrl = `${environment.apiUrl}/plants-report`;

  constructor(
    private http: HttpClient,
    private cookieService: CookieService
  ) {}

  /**
   * Lấy headers có authentication
   */
  private getAuthHeaders(): HttpHeaders {
    const token = this.cookieService.getCookie('auth_token');
    return new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    });
  }

  /**
   * Kiểm tra user đã login chưa
   */
  private isUserLoggedIn(): boolean {
    const token = this.cookieService.getCookie('auth_token');
    return !!token;
  }

  /**
   * Lấy danh sách reports của user
   */
  getUserReports(filter: ReportFilter): Observable<UserReportListResponse> {
    if (!this.isUserLoggedIn()) {
      return throwError(() => new Error('User not authenticated'));
    }

    let params = new HttpParams()
      .set('page', filter.page.toString())
      .set('size', filter.size.toString());

    if (filter.status) {
      params = params.set('status', filter.status);
    }

    const headers = this.getAuthHeaders();

    return this.http.get<any>(`${this.apiUrl}/my-reports`, { params, headers })
      .pipe(
        map(response => {
          console.log('Raw API response:', response);
          
          if (response && (response.status === 200 || response.code === 200) && response.data) {
            const reportData = response.data as UserReportListResponse;
            console.log('Parsed report data:', reportData);
            
            // Transform to match expected structure if needed
            return {
              reports: reportData.reports || [],
              totalElements: reportData.totalElements || 0,
              totalPages: reportData.totalPages || 0,
              currentPage: reportData.currentPage || 0,
              pageSize: reportData.pageSize || filter.size
            } as UserReportListResponse;
          } else {
            throw new Error(response?.message || 'Failed to get user reports');
          }
        }),
        catchError(error => {
          console.error('Error getting user reports:', error);
          return throwError(() => error);
        })
      );
  }

  /**
   * Lấy chi tiết report
   */
  getUserReportDetail(reportId: number): Observable<UserReport> {
    if (!this.isUserLoggedIn()) {
      return throwError(() => new Error('User not authenticated'));
    }

    const headers = this.getAuthHeaders();

    return this.http.get<any>(`${this.apiUrl}/my-reports/${reportId}`, { headers })
      .pipe(
        map(response => {
          if (response && (response.status === 200 || response.code === 200) && response.data) {
            return response.data as UserReport;
          } else {
            throw new Error(response?.message || 'Failed to get report detail');
          }
        }),
        catchError(error => {
          console.error('Error getting report detail:', error);
          return throwError(() => error);
        })
      );
  }

  /**
   * Translate report status to Vietnamese
   */
  translateStatus(status: string): string {
    const translations: { [key: string]: string } = {
      'PENDING': 'Đang chờ xử lý',
      'CLAIMED': 'Đã tiếp nhận',
      'APPROVED': 'Đã phê duyệt',
      'REJECTED': 'Đã từ chối',
      'IN_PROGRESS': 'Đang xử lý'
    };
    return translations[status?.toUpperCase()] || status || 'Không rõ';
  }

  /**
   * Get status class for styling
   */
  getStatusClass(status: string): string {
    const classes: { [key: string]: string } = {
      'PENDING': 'status-pending',
      'CLAIMED': 'status-claimed',
      'APPROVED': 'status-approved',
      'REJECTED': 'status-rejected',
      'IN_PROGRESS': 'status-in-progress'
    };
    return classes[status?.toUpperCase()] || 'status-default';
  }

  /**
   * Format timestamp to readable date
   */
  formatDate(timestamp: number): string {
    if (!timestamp) return 'Chưa có thông tin';
    
    const date = new Date(timestamp);
    return date.toLocaleDateString('vi-VN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  }
}
