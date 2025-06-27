import { Component, OnInit, Injectable } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute, RouterModule } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';

// Models cho report-review
export interface ReportReview {
  id: number;
  title: string;
  content: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  type: 'PLANT_ISSUE' | 'SYSTEM_BUG' | 'CONTENT_VIOLATION' | 'OTHER';
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  createdAt: string;
  createdBy: {
    id: number;
    username: string;
    email: string;
  };
  attachments: string[];
}

export interface ReviewRequest {
  reportId: number;
  status: 'APPROVED' | 'REJECTED';
  reviewNote: string;
}

// Service cho report-review
@Injectable({
  providedIn: 'root'
})
export class ReportReviewService {
  constructor(private http: HttpClient) {}

  getReportForReview(id: number): Observable<ReportReview> {
    // Mock data for now
    const mockReport: ReportReview = {
      id: id,
      title: `Report #${id} - Plant Disease Issue`,
      content: 'This is a detailed report about plant disease affecting multiple plants in the garden.',
      status: 'PENDING',
      type: 'PLANT_ISSUE',
      priority: 'HIGH',
      createdAt: '2024-01-15T10:30:00Z',
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

    return of(mockReport);
  }

  submitReview(reviewData: ReviewRequest): Observable<any> {
    // Mock API call
    return of({ success: true, message: 'Review submitted successfully' });
  }
}

@Component({
  selector: 'app-report-review',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './report-review.component.html',
  styleUrls: ['./report-review.component.scss']
})
export class ReportReviewComponent implements OnInit {
  report: ReportReview | null = null;
  loading = false;
  submitting = false;
  errorMsg = '';
  successMsg = '';
  reportId: number = 0;

  // Review form data
  reviewStatus: 'APPROVED' | 'REJECTED' = 'APPROVED';
  reviewNote: string = '';

  // User info (mock)
  isLoggedIn = true;
  userRole: 'admin' | 'staff' | 'user' = 'admin';

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private reviewService: ReportReviewService
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
    
    this.reviewService.getReportForReview(this.reportId).subscribe({
      next: (report) => {
        this.report = report;
        this.loading = false;
      },
      error: (error) => {
        this.errorMsg = 'Không thể tải thông tin báo cáo.';
        this.loading = false;
      }
    });
  }

  submitReview() {
    if (!this.reviewNote.trim()) {
      this.errorMsg = 'Vui lòng nhập ghi chú xem xét.';
      return;
    }

    this.submitting = true;
    this.errorMsg = '';
    this.successMsg = '';

    const reviewData: ReviewRequest = {
      reportId: this.reportId,
      status: this.reviewStatus,
      reviewNote: this.reviewNote.trim()
    };

    this.reviewService.submitReview(reviewData).subscribe({
      next: (response) => {
        this.successMsg = 'Xem xét báo cáo thành công!';
        this.submitting = false;
        
        // Redirect after success
        setTimeout(() => {
          this.router.navigate(['/admin/response-manager/report-list']);
        }, 2000);
      },
      error: (error) => {
        this.errorMsg = 'Có lỗi xảy ra khi gửi xem xét.';
        this.submitting = false;
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

  formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleString('vi-VN');
  }

  goBack() {
    this.router.navigate(['/admin/response-manager/report-detail', this.reportId]);
  }

  goToList() {
    this.router.navigate(['/admin/response-manager/report-list']);
  }
}
