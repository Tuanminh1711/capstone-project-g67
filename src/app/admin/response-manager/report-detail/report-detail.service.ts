import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { catchError, tap, map } from 'rxjs/operators';

// Models cho report-detail theo API thực
export interface ReportLog {
  logId: number;
  action: string;
  userName: string;
  userEmail: string;
  note: string | null;
  createdAt: string;
}

export interface ReportDetail {
  reportId: number;
  reason: string;
  status: 'PENDING' | 'CLAIMED' | 'HANDLED';
  adminNotes: string | null;
  createdAt: string;
  plantId: number;
  plantName: string;
  scientificName: string;
  plantDescription: string;
  plantStatus: string;
  categoryName: string;
  plantImageUrls: string[];
  reporterId: number;
  reporterName: string;
  reporterEmail: string;
  reporterPhone: string;
  claimedById: number | null;
  claimedByName: string | null;
  claimedByEmail: string | null;
  claimedAt: string | null;
  handledById: number | null;
  handledByName: string | null;
  handledByEmail: string | null;
  handledAt: string | null;
  reportLogs: ReportLog[];
}

export interface ReportDetailResponse {
  status: number;
  message: string;
  data: ReportDetail;
}

@Injectable({
  providedIn: 'root'
})
export class ReportDetailService {
  private baseUrl = 'http://localhost:8080/api/manager';

  constructor(private http: HttpClient) {}

  getReportDetail(reportId: number): Observable<ReportDetail> {
    console.log('Calling API:', `${this.baseUrl}/report-detail/${reportId}`);
    
    return this.http.get<ReportDetailResponse>(`${this.baseUrl}/report-detail/${reportId}`)
      .pipe(
        map(response => {
          console.log('API Response:', response);
          if (response && response.data) {
            return response.data;
          }
          throw new Error('Invalid response format');
        }),
        catchError(error => {
          console.error('API Error:', error);
          throw error;
        })
      );
  }

  claimReport(reportId: number): Observable<any> {
    return this.http.post(`${this.baseUrl}/claim-report/${reportId}`, {});
  }

  handleReport(reportId: number, notes?: string): Observable<any> {
    return this.http.post(`${this.baseUrl}/handle-report/${reportId}`, { notes });
  }

  approveReport(reportId: number, userId: number, adminNotes: string = 'Đã kiểm tra, report hợp lệ.'): Observable<any> {
    // Thử các endpoint alternatives
    const body = {
      action: 'APPROVE',
      adminNotes: adminNotes,
      userId: userId
    };
    
    console.log('Approve request - trying approve endpoint:', {
      url: `${this.baseUrl}/approve-report/${reportId}`,
      body: body
    });
    
    return this.http.post(`${this.baseUrl}/approve-report/${reportId}`, body).pipe(
      catchError(error => {
        console.log('Approve endpoint failed, trying alternative...');
        // Nếu endpoint approve không tồn tại, thử endpoint handle với action
        const alternativeBody = { ...body, status: 'APPROVED' };
        return this.http.put(`${this.baseUrl}/report/${reportId}/status`, alternativeBody);
      })
    );
  }

  rejectReport(reportId: number, userId: number, adminNotes: string = 'Report không hợp lệ.'): Observable<any> {
    const body = {
      action: 'REJECT',
      adminNotes: adminNotes,
      userId: userId
    };
    
    return this.http.post(`${this.baseUrl}/reject-report/${reportId}`, body).pipe(
      catchError(error => {
        console.log('Reject endpoint failed, trying alternative...');
        const alternativeBody = { ...body, status: 'REJECTED' };
        return this.http.put(`${this.baseUrl}/report/${reportId}/status`, alternativeBody);
      })
    );
  }
}
