import { Component, OnInit, Injectable } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute, RouterModule } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';

// Models cho report-detail
export interface ReportDetail {
  id: number;
  title: string;
  content: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  type: 'PLANT_ISSUE' | 'SYSTEM_BUG' | 'CONTENT_VIOLATION' | 'OTHER';
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  createdAt: string;
  updatedAt: string;
  createdBy: {
    id: number;
    username: string;
    email: string;
  };
  reviewedBy?: {
    id: number;
    username: string;
    email: string;
  };
  reviewNote?: string;
  attachments: string[];
}

// Service cho report-detail
@Injectable({
  providedIn: 'root'
})
export class ReportDetailService {
  constructor(private http: HttpClient) {}

  getReportDetail(id: number): Observable<ReportDetail> {
    // Mock data for now - replace with real API call
    const mockReport: ReportDetail = {
      id: id,
      title: `Report #${id} - Plant Disease Issue`,
      content: 'This is a detailed report about plant disease affecting multiple plants in the garden.',
      status: 'PENDING',
      type: 'PLANT_ISSUE',
      priority: 'HIGH',
      createdAt: '2024-01-15T10:30:00Z',
      updatedAt: '2024-01-15T10:30:00Z',
      createdBy: {
        id: 1,
        username: 'user123',
        email: 'user123@example.com'
      },
      attachments: [
        'https://example.com/image1.jpg',
        'https://example.com/image2.jpg'
      ]
    };

    return of(mockReport).pipe(
      map(report => report),
      catchError(error => {
        console.error('Error loading report detail:', error);
        throw error;
      })
    );
  }
}

@Component({
  selector: 'app-report-detail',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './report-detail.component.html',
  styleUrls: ['./report-detail.component.scss']
})
export class ReportDetailComponent implements OnInit {
  report: ReportDetail | null = null;
  loading = false;
  errorMsg = '';
  successMsg = '';
  processing = false;
  reportId: number = 0;

  // Giả lập thông tin đăng nhập và role
  isLoggedIn = true;
  userRole: 'admin' | 'staff' | 'user' = 'admin';

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private reportService: ReportDetailService
  ) {}

  ngOnInit() {
    if (!this.isLoggedIn || (this.userRole !== 'admin' && this.userRole !== 'staff')) {
      this.router.navigate(['/login']);
      return;
    }
    this.loadReport();
  }

  loadReport() {
    this.loading = true;
    this.errorMsg = '';
    this.reportId = Number(this.route.snapshot.paramMap.get('id'));
    
    this.reportService.getReportDetail(this.reportId).subscribe({
      next: (report) => {
        this.report = report;
        this.loading = false;
      },
      error: (error) => {
        this.errorMsg = 'Không thể tải chi tiết báo cáo.';
        this.loading = false;
      }
    });
  }

  getStatusText(status: string): string {
    switch (status) {
      case 'PENDING': return 'Chờ xử lý';
      case 'APPROVED': return 'Đã duyệt';
      case 'REJECTED': return 'Từ chối';
      default: return status;
    }
  }

  getStatusClass(status: string): string {
    switch (status) {
      case 'PENDING': return 'status-pending';
      case 'APPROVED': return 'status-approved';
      case 'REJECTED': return 'status-rejected';
      default: return '';
    }
  }

  getTypeText(type: string): string {
    switch (type) {
      case 'PLANT_ISSUE': return 'Vấn đề về cây';
      case 'SYSTEM_BUG': return 'Lỗi hệ thống';
      case 'CONTENT_VIOLATION': return 'Vi phạm nội dung';
      case 'OTHER': return 'Khác';
      default: return type;
    }
  }

  getPriorityText(priority: string): string {
    switch (priority) {
      case 'LOW': return 'Thấp';
      case 'MEDIUM': return 'Trung bình';
      case 'HIGH': return 'Cao';
      case 'URGENT': return 'Khẩn cấp';
      default: return priority;
    }
  }

  getPriorityClass(priority: string): string {
    switch (priority) {
      case 'LOW': return 'priority-low';
      case 'MEDIUM': return 'priority-medium';
      case 'HIGH': return 'priority-high';
      case 'URGENT': return 'priority-urgent';
      default: return '';
    }
  }

  formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleString('vi-VN');
  }

  goToReview() {
    this.router.navigate(['/admin/response-manager/report-review', this.reportId]);
  }

  goBack() {
    this.router.navigate(['/admin/response-manager/report-list']);
  }

  downloadAttachment(url: string) {
    window.open(url, '_blank');
  }
}
