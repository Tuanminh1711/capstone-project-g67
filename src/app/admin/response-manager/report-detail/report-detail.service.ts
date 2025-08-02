import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { catchError, tap, map } from 'rxjs/operators';
import { ConfigService } from '../../../shared/config.service';

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
  constructor(
    private http: HttpClient,
    private configService: ConfigService
  ) {}

  getReportDetail(reportId: number): Observable<ReportDetail> {
    return this.http.get<ReportDetailResponse>(`${this.configService.apiUrl}/manager/report-detail/${reportId}`)
      .pipe(
        map(response => {
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
    return this.http.post(`${this.configService.apiUrl}/manager/claim-report/${reportId}`, {});
  }

  handleReport(reportId: number, notes?: string): Observable<any> {
    return this.http.post(`${this.configService.apiUrl}/manager/handle-report/${reportId}`, { notes });
  }

  approveReport(reportId: number, userId: number, adminNotes: string = 'Đã kiểm tra, report hợp lệ.'): Observable<any> {
    // Thử các endpoint alternatives
    const body = {
      action: 'APPROVE',
      adminNotes: adminNotes,
      userId: userId
    };
    
    return this.http.post(`${this.configService.apiUrl}/manager/approve-report/${reportId}`, body).pipe(
      catchError(error => {
        // Nếu endpoint approve không tồn tại, thử endpoint handle với action
        const alternativeBody = { ...body, status: 'APPROVED' };
        return this.http.put(`${this.configService.apiUrl}/manager/report/${reportId}/status`, alternativeBody);
      })
    );
  }

  rejectReport(reportId: number, userId: number, adminNotes: string = 'Report không hợp lệ.'): Observable<any> {
    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
      'userId': userId.toString()
    });
    
    const body = {
      status: 'REJECTED',
      adminNotes: adminNotes
    };
    
    return this.http.put(`${this.configService.apiUrl}/manager/handle-report/${reportId}`, body, { headers });
  }
}
