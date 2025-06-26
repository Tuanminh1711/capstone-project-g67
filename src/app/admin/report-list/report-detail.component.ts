import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { AdminTopNavigatorComponent } from '../../shared/admin-top-navigator/admin-top-navigator.component';
import { AdminSidebarComponent } from '../../shared/admin-sidebar/admin-sidebar.component';
import { AdminFooterComponent } from '../../shared/admin-footer/admin-footer.component';
import { Report } from './report-list.component';

export interface ReportDetail extends Report {
  reportedUserId: string;
  reportedUserName: string;
  evidence: string[];
  adminNotes: string;
  resolutionDate?: string;
  resolvedBy?: string;
}

@Component({
  selector: 'app-report-detail',
  standalone: true,
  imports: [CommonModule, AdminTopNavigatorComponent, AdminSidebarComponent, AdminFooterComponent],
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
  isLoggedIn = true; // Đổi thành false để test chuyển hướng
  userRole: 'admin' | 'staff' | 'user' = 'admin'; // Đổi thành 'user' để test chuyển hướng

  constructor(
    private route: ActivatedRoute,
    private router: Router
  ) {}

  ngOnInit() {
    // Kiểm tra phân quyền
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
    
    // TODO: Replace with real API call
    setTimeout(() => {
      // Mock data for demonstration
      this.report = {
        id: this.reportId,
        title: 'Nội dung spam',
        description: 'Người dùng đăng nội dung spam không phù hợp',
        status: 'pending',
        createdAt: '2024-01-15 10:30:00',
        createdBy: 'user123',
        reporterName: 'Nguyễn Văn A',
        reportedContent: 'Nội dung vi phạm chi tiết...',
        reportedUserId: 'user456',
        reportedUserName: 'Trần Văn B',
        evidence: [
          'Screenshot 1: Nội dung spam',
          'Screenshot 2: Thời gian đăng bài'
        ],
        adminNotes: 'Cần xem xét kỹ lưỡng trước khi xử lý',
        resolutionDate: undefined,
        resolvedBy: undefined
      };
      this.loading = false;
    }, 500);
  }

  getStatusClass(status: string): string {
    switch (status.toLowerCase()) {
      case 'pending': return 'status-pending';
      case 'approved': return 'status-approved';
      case 'rejected': return 'status-rejected';
      case 'resolved': return 'status-resolved';
      default: return '';
    }
  }

  getStatusText(status: string): string {
    switch (status.toLowerCase()) {
      case 'pending': return 'Chờ xử lý';
      case 'approved': return 'Đã duyệt';
      case 'rejected': return 'Từ chối';
      case 'resolved': return 'Đã giải quyết';
      default: return status;
    }
  }

  approveReport() {
    if (!this.report) return;
    this.processing = true;
    // 1. Đổi trạng thái sang "approved"
    this.report.status = 'approved';
    // 2. Gửi email tự động (mock)
    setTimeout(() => {
      this.successMsg = 'Đã gửi email thông báo duyệt báo cáo cho người dùng.';
      this.processing = false;
      // 3. Đổi trạng thái sang "Đang chờ" (giả lập)
      // 4. Sau khi xử lý xong, admin có thể đổi sang "Đã giải quyết" (resolved)
    }, 1000);
  }

  rejectReport() {
    if (!this.report) return;
    // Chuyển hướng sang màn Send Response để nhập lý do từ chối
    this.router.navigate(['/admin/reports', this.report.id, 'send-response'], {
      state: {
        id: this.report.id,
        description: this.report.description,
        email: this.report.createdBy + '@gmail.com' // Giả lập email từ username
      }
    });
  }

  resolveReport() {
    if (confirm('Bạn có chắc chắn muốn đánh dấu báo cáo này đã được giải quyết?')) {
      // TODO: Call API to resolve report
      if (this.report) {
        this.report.status = 'resolved';
        this.report.resolutionDate = new Date().toISOString();
        this.report.resolvedBy = 'admin';
      }
    }
  }

  goBack() {
    this.router.navigate(['/admin/reports']);
  }
} 