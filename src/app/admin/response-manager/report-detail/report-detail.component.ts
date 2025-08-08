import { Component, OnInit, OnDestroy, ChangeDetectorRef, inject, NgZone } from '@angular/core';
import { AdminPageTitleService } from '../../../shared/admin-page-title.service';
import { Router, ActivatedRoute, RouterModule } from '@angular/router';
import { Subscription } from 'rxjs';
import { ReportDetailService, ReportDetail } from './report-detail.service';
import { JwtUserUtilService } from '../../../auth/jwt-user-util.service';
import { ToastService } from '../../../shared/toast/toast.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-report-detail',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule
  ],
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

  route: ActivatedRoute;
  router: Router;
  reportService: ReportDetailService;
  cdr: ChangeDetectorRef;
  jwtUserUtil: JwtUserUtilService;
  toastService: ToastService;
  ngZone: NgZone;

  private pageTitleService = inject(AdminPageTitleService);
  constructor() {
    this.pageTitleService.setTitle('CHI TIẾT BÁO CÁO');
    this.route = inject(ActivatedRoute);
    this.router = inject(Router);
    this.reportService = inject(ReportDetailService);
    this.cdr = inject(ChangeDetectorRef);
    this.jwtUserUtil = inject(JwtUserUtilService);
    this.toastService = inject(ToastService);
    this.ngZone = inject(NgZone);
  }

  ngOnInit() {
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
    // Chỉ check role admin, không redirect
    if (!this.isLoggedIn || (this.userRole !== 'admin' && this.userRole !== 'staff')) {
      this.errorMsg = 'Bạn không có quyền truy cập trang này. Chỉ admin và staff mới được phép.';
      this.loading = false;
      return;
    }
    // Sử dụng params observable để theo dõi route changes
    this.routeSubscription = this.route.params.subscribe(params => {
      this.reportId = Number(params['id']);
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
    this.loading = true;
    this.errorMsg = '';
    this.successMsg = '';
    this.report = null;
    this.cdr.detectChanges(); // Force change detection
    
    this.reportService.getReportDetail(this.reportId).subscribe({
      next: (report) => {
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

  goToApproveEdit() {
    if (!this.report) return;
    
    // Check if user can approve this report
    if (!this.canApproveEdit()) {
      if (this.report.status === 'HANDLED') {
        this.toastService.error('Report này đã được xử lý và không thể chỉnh sửa nữa.');
      } else if (this.report.status === 'PENDING') {
        this.toastService.error('Cần claim report trước khi có thể chỉnh sửa để chấp thuận.');
      } else if (this.report.status === 'CLAIMED' && this.isClaimedByOther()) {
        this.toastService.error('Bạn không có quyền chỉnh sửa report này. Chỉ người đã claim report mới có thể chỉnh sửa.');
      } else {
        this.toastService.error('Bạn không có quyền chỉnh sửa report này.');
      }
      return;
    }
    
    // Navigate to approve report edit page with reportId
    this.router.navigate(['/admin/response-manager/approve-report', this.report.reportId]);
  }

  // Check if current user can approve/edit this report
  canApproveEdit(): boolean {
    if (!this.report) return false;
    
    // Cannot edit if report is already handled (approved/rejected)
    if (this.report.status === 'HANDLED') {
      return false;
    }
    
    // Only allow approve/edit if:
    // 1. Report status is CLAIMED (not PENDING or HANDLED)
    // 2. Current user is the one who claimed it
    if (this.report.status === 'CLAIMED') {
      return Number(this.report.claimedById) === Number(this.userId);
    }
    
    return false; // Cannot edit PENDING or HANDLED reports
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
    
    // Security validation: Check if report is claimed and current user is the one who claimed it
    if (this.report.status !== 'CLAIMED') {
      this.toastService.error('Chỉ có thể từ chối báo cáo đã được nhận.');
      return;
    }
    
    if (this.report.claimedById && Number(this.report.claimedById) !== Number(this.userId)) {
      this.toastService.error('Không có quyền xử lý báo cáo này. Chỉ người nhận báo cáo mới có thể xử lý.');
      return;
    }
    
    this.processing = true;
    this.errorMsg = '';
    this.successMsg = '';
    
    // Use NgZone to avoid change detection errors
    this.ngZone.run(() => {
      this.cdr.detectChanges();
    });
    
    this.reportService.rejectReport(this.reportId, this.userId).subscribe({
      next: (response) => {
        this.ngZone.run(() => {
          this.toastService.success('Đã từ chối báo cáo thành công!');
          this.processing = false;
          this.cdr.detectChanges();
          this.loadReport(); // Reload để cập nhật trạng thái
        });
      },
      error: (error) => {
        console.error('Error rejecting report:', error);
        this.ngZone.run(() => {
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
        });
      }
    });
  }

  formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleString('vi-VN');
  }

  canHandleReport(): boolean {
    if (!this.report) return false;
    
    // Cannot handle if already processed
    if (this.report.status === 'HANDLED') {
      return false;
    }
    
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
    
    return false; // Không thể handle report đã HANDLED
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
