import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { HttpClientModule, HttpClient } from '@angular/common/http';
import { BehaviorSubject, Subscription } from 'rxjs';
import { ConfirmationDialogService } from '../../../shared/services/confirmation-dialog/confirmation-dialog.service';
import { JwtUserUtilService } from '../../../auth/jwt-user-util.service';
import { ToastService } from '../../../shared/toast/toast.service';
import { environment } from '../../../../environments/environment';

import { Report } from '../../../shared/models/report.model';

@Component({
  selector: 'app-report-list',
  standalone: true,
  imports: [CommonModule, FormsModule, HttpClientModule],
  templateUrl: './report-list.component.html',
  styleUrls: ['./report-list.component.scss']
})
export class ReportListComponent implements OnInit, OnDestroy {
  selectedStatus: string = '';
  searchText: string = '';
  allReports: Report[] = [];
  private reportsSubject = new BehaviorSubject<Report[]>([]);
  reports$ = this.reportsSubject.asObservable();
  pageNo = 0;
  pageSize = 10;
  totalPages = 1;
  totalElements = 0;
  loading = false;
  errorMsg = '';
  currentKeyword = '';
  searchDebounce: any;
  private sub: Subscription = new Subscription();
  successMsg = '';
  sortField: string = '';
  sortDirection: 'asc' | 'desc' = 'asc';
  isLoggedIn = true;
  userRole: 'admin' | 'staff' | 'user' = 'admin';
  private toast = inject(ToastService);
  private confirmationDialog = inject(ConfirmationDialogService);
  private jwtUserUtil = inject(JwtUserUtilService);
  private router = inject(Router);
  private http = inject(HttpClient);




  constructor() {
    this.allReports = [];
    this.reportsSubject = new BehaviorSubject<Report[]>([]);
    this.reports$ = this.reportsSubject.asObservable();
  }

  ngOnInit() {
    // Kiểm tra phân quyền thực tế từ JWT
    const jwtUtil = this.jwtUserUtil;
    const role = jwtUtil.getRoleFromToken();
    this.isLoggedIn = !!role;
    this.userRole = (role || '').toLowerCase() as any;
    if (!this.isLoggedIn || (this.userRole !== 'admin' && this.userRole !== 'staff')) {
      this.router.navigate(['/login-admin']);
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
    const searchValue = this.searchText.trim();
    const body: any = {
      plantName: searchValue,
      reporterName: searchValue,
      status: this.selectedStatus || '', // nếu có dropdown status thì lấy, không thì để ''
      page: this.pageNo,
      size: this.pageSize
    };
    this.http.post<any>(`${environment.apiUrl}/manager/report-list`, body).subscribe({
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
        this.totalElements = data.totalElements || 0;
        this.totalPages = data.totalPages || 1;
        this.pageNo = data.currentPage || 0;
        this.reportsSubject.next(this.allReports);
        this.loading = false;
      },
      error: (err) => {
        this.loading = false;
        this.errorMsg = err?.error?.message || 'Không thể tải danh sách báo cáo.';
        this.allReports = [];
        this.reportsSubject.next([]);
      }
    });
  }

  reloadReports() {
    this.pageNo = 0;
    this.loadReports();
  }

  onSearchInputChange(): void {
    clearTimeout(this.searchDebounce);
    this.searchDebounce = setTimeout(() => {
      this.pageNo = 0;
      this.loadReports();
    }, 300);
  }

  onSearch(): void {
    this.pageNo = 0;
    this.loadReports();
  }

  goToPage(page: number): void {
    if (page >= 0 && page < this.totalPages && page !== this.pageNo) {
      this.pageNo = page;
      this.loadReports(); // Gọi API để load dữ liệu trang mới
    }
  }

  nextPage() {
    if (this.pageNo + 1 < this.totalPages) {
      this.goToPage(this.pageNo + 1);
    }
  }

  prevPage() {
    if (this.pageNo > 0) {
      this.goToPage(this.pageNo - 1);
    }
  }

  viewDetail(report: Report) {
    this.router.navigate(['/admin/reports/detail', report.reportId]);
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
    this.reportsSubject.next(this.allReports);
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
    }).subscribe((confirmed: boolean) => {
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
        this.toast.error((err as any)?.error?.message || 'Không thể nhận xử lý báo cáo. Vui lòng thử lại.');
      }
    });
  }
}