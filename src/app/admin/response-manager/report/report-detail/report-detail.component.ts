import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute, RouterModule } from '@angular/router';
import { Subscription } from 'rxjs';
import { ReportDetailService, ReportDetail } from './report-detail.service';
import { JwtUserUtilService } from '../../../../auth/jwt-user-util.service';
import { ToastService } from '../../../../shared/toast.service';

@Component({
  selector: 'app-report-detail',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './report-detail.component.html',
  styleUrls: ['./report-detail.component.scss']
})
export class ReportDetailComponent implements OnInit, OnDestroy {
  report: ReportDetail | null = null;
  loading = true; // Bắt đầu với loading = true
  errorMsg = '';
  successMsg = '';
  processing = false;
  reportId: number = 0;
  private routeSubscription?: Subscription;

  // Thông tin đăng nhập thực từ token
  isLoggedIn = false;
  userRole: 'admin' | 'staff' | 'user' = 'user';
  userId: number = 0; // Sẽ được set từ token

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private reportService: ReportDetailService,
    private cdr: ChangeDetectorRef,
    private jwtUserUtil: JwtUserUtilService,
    private toastService: ToastService
  ) {}

  ngOnInit() {
    console.log('ReportDetailComponent initialized');
    
    // Lấy thông tin user từ token
    this.isLoggedIn = this.jwtUserUtil.isLoggedIn();
    const userIdFromToken = this.jwtUserUtil.getUserIdFromToken();
    const roleFromToken = this.jwtUserUtil.getRoleFromToken();
    
    if (userIdFromToken) {
      this.userId = parseInt(userIdFromToken);
    }
    
    if (roleFromToken) {
      this.userRole = roleFromToken.toLowerCase() as 'admin' | 'staff' | 'user';
    }
    
    console.log('User info:', {
      isLoggedIn: this.isLoggedIn,
      userId: this.userId,
      userRole: this.userRole
    });
    
    // Chỉ check role admin, không redirect
    if (!this.isLoggedIn || this.userRole !== 'admin') {
      console.log('Access denied - not admin role');
      this.errorMsg = 'Bạn không có quyền truy cập trang này. Chỉ admin mới được phép.';
      this.loading = false;
      return;
    }

    // Sử dụng params observable để theo dõi route changes
    this.routeSubscription = this.route.params.subscribe(params => {
      console.log('Route params changed:', params);
      this.reportId = Number(params['id']);
      console.log('Report ID:', this.reportId);
      
      if (this.reportId && !isNaN(this.reportId)) {
        this.loadReport();
      } else {
        this.errorMsg = 'ID báo cáo không hợp lệ.';
        this.loading = false;
        this.cdr.detectChanges();
      }
    });
  }

  loadReport() {
    console.log('Starting to load report with ID:', this.reportId);
    
    this.loading = true;
    this.errorMsg = '';
    this.successMsg = '';
    this.report = null;
    this.cdr.detectChanges(); // Force change detection
    
    this.reportService.getReportDetail(this.reportId).subscribe({
      next: (report) => {
        console.log('Report data loaded successfully:', report);
        this.report = report;
        this.loading = false;
        this.cdr.detectChanges(); // Force change detection
      },
      error: (error) => {
        console.error('Error loading report:', error);
        this.errorMsg = 'Không thể tải chi tiết báo cáo. Vui lòng thử lại.';
        this.loading = false;
        this.report = null;
        this.cdr.detectChanges(); // Force change detection
      }
    });
  }

  getStatusText(status: string): string {
    switch (status) {
      case 'PENDING': return 'Chờ xử lý';
      case 'CLAIMED': return 'Đã nhận';
      case 'HANDLED': return 'Đã xử lý';
      case 'APPROVED': return 'Đã phê duyệt';
      case 'REJECTED': return 'Đã từ chối';
      default: 
        return status || 'Không xác định';
    }
  }

  getStatusClass(status: string): string {
    switch (status) {
      case 'PENDING': return 'status-pending';
      case 'CLAIMED': return 'status-claimed';
      case 'HANDLED': return 'status-handled';
      case 'APPROVED': return 'status-approved';
      case 'REJECTED': return 'status-rejected';
      default: return 'status-pending'; // Default fallback
    }
  }

  onImageError(event: any) {
    event.target.style.display = 'none';
  }

  goBack() {
    this.router.navigate(['/admin/reports']);
  }

  approveReport() {
    if (!this.report || this.processing) return;
    
    console.log('Attempting to approve with userId:', this.userId);
    console.log('Report details:', {
      id: this.report.reportId,
      status: this.report.status,
      claimedById: this.report.claimedById
    });
    
    // Security validation: Check if current user has permission to approve this report
    if (this.report.claimedById && Number(this.report.claimedById) !== Number(this.userId)) {
      this.toastService.error(`Không có quyền xử lý báo cáo này. Chỉ người nhận báo cáo mới có thể xử lý.`);
      return;
    }
    
    // Additional validation: Check report status
    if (this.report.status !== 'PENDING' && this.report.status !== 'CLAIMED') {
      this.toastService.error('Báo cáo này không thể được phê duyệt do trạng thái không hợp lệ.');
      return;
    }
    
    // TEST: Thử claim report trước nếu chưa được claim
    if (this.report.status === 'PENDING') {
      console.log('Report is PENDING, trying to claim first...');
      this.processing = true;
      this.cdr.detectChanges();
      
      this.reportService.claimReport(this.reportId).subscribe({
        next: (claimResponse) => {
          console.log('Claim successful:', claimResponse);
          // Sau khi claim thành công, thử approve
          this.proceedWithApprove();
        },
        error: (claimError) => {
          console.error('Claim failed:', claimError);
          this.processing = false;
          this.toastService.error('Không thể nhận báo cáo. Vui lòng thử lại.');
          this.cdr.detectChanges();
        }
      });
    } else {
      // Nếu đã được claim, proceed với approve
      this.proceedWithApprove();
    }
  }
  
  private proceedWithApprove() {
    this.processing = true;
    this.errorMsg = '';
    this.successMsg = '';
    this.cdr.detectChanges();
    
    this.reportService.approveReport(this.reportId, this.userId).subscribe({
      next: (response) => {
        console.log('Approve response:', response);
        this.toastService.success('Đã phê duyệt báo cáo thành công!');
        this.processing = false;
        this.cdr.detectChanges();
        this.loadReport(); // Reload để cập nhật trạng thái
      },
      error: (error) => {
        console.error('Error approving report:', error);
        this.processing = false;
        
        if (error.status === 403) {
          this.toastService.error('Bạn không có quyền phê duyệt báo cáo này.');
        } else if (error.status === 400) {
          this.toastService.error('Báo cáo không ở trạng thái có thể phê duyệt.');
        } else if (error.status === 500) {
          this.toastService.error('Lỗi hệ thống. Vui lòng liên hệ admin để được hỗ trợ.');
        } else {
          this.toastService.error('Không thể phê duyệt báo cáo. Vui lòng thử lại sau.');
        }
        
        this.cdr.detectChanges();
      }
    });
  }

  rejectReport() {
    if (!this.report || this.processing) return;
    
    console.log('Attempting to reject with userId:', this.userId);
    
    // Security validation: Check if current user has permission to reject this report
    if (this.report.claimedById && Number(this.report.claimedById) !== Number(this.userId)) {
      this.toastService.error(`Không có quyền xử lý báo cáo này. Chỉ người nhận báo cáo mới có thể xử lý.`);
      return;
    }
    
    // Additional validation: Check report status
    if (this.report.status !== 'PENDING' && this.report.status !== 'CLAIMED') {
      this.toastService.error('Báo cáo này không thể được từ chối do trạng thái không hợp lệ.');
      return;
    }
    
    this.processing = true;
    this.errorMsg = '';
    this.successMsg = '';
    this.cdr.detectChanges();
    
    this.reportService.rejectReport(this.reportId, this.userId).subscribe({
      next: (response) => {
        console.log('Reject response:', response);
        this.toastService.success('Đã từ chối báo cáo thành công!');
        this.processing = false;
        this.cdr.detectChanges();
        this.loadReport(); // Reload để cập nhật trạng thái
      },
      error: (error) => {
        console.error('Error rejecting report:', error);
        this.processing = false;
        
        if (error.status === 403) {
          this.toastService.error('Bạn không có quyền từ chối báo cáo này.');
        } else if (error.status === 400) {
          this.toastService.error('Báo cáo không ở trạng thái có thể từ chối.');
        } else if (error.status === 500) {
          this.toastService.error('Lỗi hệ thống. Vui lòng liên hệ admin để được hỗ trợ.');
        } else {
          this.toastService.error('Không thể từ chối báo cáo. Vui lòng thử lại sau.');
        }
        
        this.cdr.detectChanges();
      }
    });
  }

  formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleString('vi-VN');
  }

  canHandleReport(): boolean {
    if (!this.report) return false;
    
    // Chỉ cho phép approve/reject nếu:
    // 1. Report có status PENDING hoặc CLAIMED
    // 2. Nếu report đã được claim, thì chỉ người claim mới có thể handle
    if (this.report.status === 'PENDING') {
      return true; // Ai cũng có thể handle report PENDING
    }
    
    if (this.report.status === 'CLAIMED') {
      // Convert cả hai về number để so sánh chắc chắn
      const canHandle = Number(this.report.claimedById) === Number(this.userId);
      return canHandle;
    }
    
    return false; // Không thể handle report đã APPROVED/REJECTED/HANDLED
  }

  isClaimedByOther(): boolean {
    if (!this.report || this.report.status !== 'CLAIMED') return false;
    return Number(this.report.claimedById) !== Number(this.userId);
  }

  ngOnDestroy() {
    if (this.routeSubscription) {
      this.routeSubscription.unsubscribe();
    }
  }
}
