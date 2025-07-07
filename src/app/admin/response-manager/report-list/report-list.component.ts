import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { HttpClientModule, HttpClient } from '@angular/common/http';
import { AdminLayoutComponent } from '../../../shared/admin-layout/admin-layout.component';
import { BehaviorSubject, Subscription } from 'rxjs';
import { ConfirmationDialogService } from '../../../shared/confirmation-dialog.service';
import { JwtUserUtilService } from '../../../auth/jwt-user-util.service';
import { ToastService } from '../../../shared/toast.service';

export interface Report {
  reportId: number;
  plantId: number;
  plantName: string;
  scientificName: string;
  reporterId: number;
  reporterName: string;
  reporterEmail: string;
  reason: string;
  status: string;
  adminNotes?: string;
  createdAt: string;
}

@Component({
  selector: 'app-report-list',
  standalone: true,
  imports: [CommonModule, FormsModule, HttpClientModule],
  templateUrl: './report-list.component.html',
  styleUrls: ['./report-list.component.scss']
})
export class ReportListComponent implements OnInit, OnDestroy {
  private reportsSubject = new BehaviorSubject<Report[]>([]);
  reports$ = this.reportsSubject.asObservable();
  allReports: Report[] = [];
  pageNo = 0;
  pageSize = 10;
  totalPages = 1;
  totalElements = 0;
  loading = false;
  errorMsg = '';
  searchText = '';
  currentKeyword = '';
  searchDebounce: any;
  private sub: Subscription = new Subscription();
  successMsg = '';

  sortField: string = '';
  sortDirection: 'asc' | 'desc' = 'asc';

  // Giả lập thông tin đăng nhập và role
  isLoggedIn = true; // Đổi thành false để test chuyển hướng
  userRole: 'admin' | 'staff' | 'user' = 'admin'; // Đổi thành 'user' để test chuyển hướng

  private toast = inject(ToastService);

  constructor(
    private router: Router,
    private http: HttpClient,
    private confirmationDialog: ConfirmationDialogService,
    private jwtUserUtil: JwtUserUtilService
  ) {}

  ngOnInit() {
    // Kiểm tra phân quyền
    if (!this.isLoggedIn || (this.userRole !== 'admin' && this.userRole !== 'staff')) {
      this.router.navigate(['/login']);
      return;
    }
    this.loadReports();
  }

  ngOnDestroy() {
    this.sub.unsubscribe();
    clearTimeout(this.searchDebounce);
  }

  loadReports() {
    this.loading = true;
    this.errorMsg = '';
    this.currentKeyword = '';
    this.http.get<any>('http://localhost:8080/api/manager/report-list', {
      params: {
        page: this.pageNo,
        size: this.pageSize,
        keyword: this.searchText.trim() || ''
      }
    }).subscribe({
      next: (res) => {
        const data = res.data || {};
        this.allReports = (data.reports || []).map((r: any) => ({
          reportId: r.reportId,
          plantId: r.plantId,
          plantName: r.plantName,
          scientificName: r.scientificName,
          reporterId: r.reporterId,
          reporterName: r.reporterName,
          reporterEmail: r.reporterEmail,
          reason: r.reason,
          status: r.status,
          adminNotes: r.adminNotes,
          createdAt: r.createdAt
        }));
        this.totalElements = data.totalElements || this.allReports.length;
        this.totalPages = data.totalPages || 1;
        this.pageNo = data.currentPage || 0;
        this.updatePage();
        this.loading = false;
      },
      error: (err) => {
        this.loading = false;
        this.errorMsg = err?.error?.message || 'Không thể tải danh sách báo cáo.';
      }
    });
  }

  updatePage() {
    const start = 0;
    const end = this.pageSize;
    this.reportsSubject.next(this.allReports.slice(start, end));
  }

  onSearchInputChange(): void {
    clearTimeout(this.searchDebounce);
    this.searchDebounce = setTimeout(() => {
      const keyword = this.searchText.trim();
      if (keyword !== this.currentKeyword) {
        this.loadReports();
      }
    }, 300);
  }

  onSearch(): void {
    const keyword = this.searchText.trim();
    if (keyword !== this.currentKeyword) {
      this.loadReports();
    }
  }

  goToPage(page: number): void {
    if (page >= 0 && page < this.totalPages) {
      this.pageNo = page;
      this.updatePage();
    }
  }

  nextPage() {
    this.goToPage(this.pageNo + 1);
  }

  prevPage() {
    this.goToPage(this.pageNo - 1);
  }

  viewDetail(report: Report) {
    this.router.navigate(['/admin/reports', report.reportId]);
  }

  reloadReports() {
    this.loadReports();
  }

  sortBy(field: string) {
    if (this.sortField === field) {
      this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortField = field;
      this.sortDirection = 'asc';
    }
    
    this.allReports.sort((a: any, b: any) => {
      const valA = (a[field] || '').toString().toLowerCase();
      const valB = (b[field] || '').toString().toLowerCase();
      if (valA < valB) return this.sortDirection === 'asc' ? -1 : 1;
      if (valA > valB) return this.sortDirection === 'asc' ? 1 : -1;
      return 0;
    });
    
    this.pageNo = 0;
    this.updatePage();
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
    switch (status?.toUpperCase()) {
      case 'PENDING': return 'Chờ xử lý';
      case 'CLAIMED': return 'Đã nhận xử lý';
      case 'APPROVED': return 'Đã duyệt';
      case 'REJECTED': return 'Từ chối';
      case 'RESOLVED': return 'Đã giải quyết';
      default: return status;
    }
  }

  claimReport(reportId: number) {
    this.confirmationDialog.showDialog({
      title: 'Xác nhận nhận xử lý báo cáo',
      message: `Bạn có chắc chắn muốn nhận xử lý báo cáo #${reportId}?`,
      confirmText: 'Nhận xử lý',
      cancelText: 'Hủy',
      icon: '📝',
      type: 'info'
    }).subscribe(confirmed => {
      if (confirmed) {
        // Ưu tiên lấy userId từ JWT lưu trong cookie auth_token
        const userId = this.jwtUserUtil.getUserIdFromToken();
        if (!userId) {
          this.toast.error('Không xác định được tài khoản admin (token không hợp lệ hoặc hết hạn).');
          return;
        }
        this.claimReportApi(reportId, userId);
      }
    });
  }

  private claimReportApi(reportId: number, userId: string) {
    this.http.put(
      `/api/manager/claim-report/${reportId}`,
      {}, // body rỗng
      {
        withCredentials: true,
        headers: { userId: userId }
      }
    ).subscribe({
      next: () => {
        this.toast.success(`Đã nhận xử lý báo cáo #${reportId}`);
        this.reloadReports();
      },
      error: (err) => {
        this.toast.error(err?.error?.message || 'Không thể nhận xử lý báo cáo. Vui lòng thử lại.');
      }
    });
  }
}