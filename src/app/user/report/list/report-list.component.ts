import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { ReportService } from '../report.service';
import { UserReport, UserReportListResponse, ReportStatus, ReportFilter } from '../report.model';
import { TopNavigatorComponent } from '../../../shared/top-navigator/top-navigator.component';
import { FooterComponent } from '../../../shared/footer/footer.component';

@Component({
  selector: 'app-report-list',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, TopNavigatorComponent],
  templateUrl: './report-list.component.html',
  styleUrls: ['./report-list.component.scss']
})
export class ReportListComponent implements OnInit, OnDestroy {
  /**
   * Lấy danh sách các trang hiển thị cho phân trang
   */
  getVisiblePages(): number[] {
    const pages: number[] = [];
    const maxVisible = 5;
    if (this.totalPages <= maxVisible) {
      for (let i = 0; i < this.totalPages; i++) {
        pages.push(i);
      }
    } else {
      let start = Math.max(0, this.currentPage - Math.floor(maxVisible / 2));
      let end = start + maxVisible;
      if (end > this.totalPages) {
        end = this.totalPages;
        start = end - maxVisible;
      }
      if (start > 0) {
        pages.push(0);
        if (start > 1) pages.push(-1); // -1 để hiển thị '...'
      }
      for (let i = start; i < end; i++) {
        pages.push(i);
      }
      if (end < this.totalPages) {
        if (end < this.totalPages - 1) pages.push(-1);
        pages.push(this.totalPages - 1);
      }
    }
    return pages;
  }
  reports: UserReport[] = [];
  currentPage = 0;
  pageSize = 10;
  totalElements = 0;
  totalPages = 0;
  isLoading = false;
  error: string | null = null;
  
  // Filter
  selectedStatus = '';
  statusOptions = [
    { value: '', label: 'Tất cả trạng thái' },
    { value: 'PENDING', label: 'Đang chờ xử lý' },
    { value: 'CLAIMED', label: 'Đã tiếp nhận' },
    { value: 'IN_PROGRESS', label: 'Đang xử lý' },
    { value: 'APPROVED', label: 'Đã phê duyệt' },
    { value: 'REJECTED', label: 'Đã từ chối' }
  ];

  private destroy$ = new Subject<void>();

  // For template
  ReportStatus = ReportStatus;
  Math = Math;

  constructor(
    private reportService: ReportService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.currentPage = 0;
    this.loadReports(0);
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Load danh sách reports
   */
  loadReports(page: number = 0): void {
    this.isLoading = true;
    this.error = null;

    const filter: ReportFilter = {
      page,
      size: this.pageSize,
      status: this.selectedStatus || undefined
    };

    this.reportService.getUserReports(filter)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response: UserReportListResponse) => {
          console.log('Report response received:', response);
          
          this.reports = response.reports || [];
          this.currentPage = response.currentPage || 0;
          this.totalElements = response.totalElements || 0;
          this.totalPages = response.totalPages || 0;
          this.isLoading = false;
          this.cdr.detectChanges(); // Force change detection
          
          console.log(`Loaded ${this.reports.length} reports`);
        },
        error: (error) => {
          console.error('Error loading reports:', error);
          this.reports = [];
          this.currentPage = 0;
          this.totalElements = 0;
          this.totalPages = 0;
          
          if (error.message?.includes('not authenticated')) {
            this.error = 'Bạn cần đăng nhập để xem báo cáo.';
          } else {
            this.error = 'Không thể tải danh sách báo cáo. Vui lòng thử lại.';
          }
          this.isLoading = false;
          this.cdr.detectChanges(); // Force change detection
        }
      });
  }

  /**
   * Filter theo status
   */
  onStatusFilterChange(): void {
    this.currentPage = 0;
    this.loadReports(0);
  }

  /**
   * Chuyển trang
   */
  goToPage(page: number): void {
    if (page >= 0 && page < this.totalPages && page !== this.currentPage) {
      this.loadReports(page);
    }
  }

  /**
   * Trang trước
   */
  previousPage(): void {
    if (this.currentPage > 0) {
      this.goToPage(this.currentPage - 1);
    }
  }

  /**
   * Trang sau
   */
  nextPage(): void {
    if (this.currentPage < this.totalPages - 1) {
      this.goToPage(this.currentPage + 1);
    }
  }

  /**
   * Refresh danh sách
   */
  refresh(): void {
    this.currentPage = 0;
    this.loadReports(0);
  }

  /**
   * Reset filter
   */
  resetFilter(): void {
    this.selectedStatus = '';
    this.currentPage = 0;
    this.isLoading = true;
    this.error = null;
    this.reports = [];

    const filter: ReportFilter = {
      page: 0,
      size: this.pageSize,
      status: this.selectedStatus || undefined
    };

    this.reportService.getUserReports(filter)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response: UserReportListResponse) => {
          this.reports = response.reports || [];
          this.currentPage = response.currentPage ?? 0;
          this.totalElements = response.totalElements ?? 0;
          this.totalPages = response.totalPages ?? 0;
          this.isLoading = false;
          this.cdr.detectChanges();
        },
        error: (error) => {
          this.reports = [];
          this.currentPage = 0;
          this.totalElements = 0;
          this.totalPages = 0;
          if (error.message?.includes('not authenticated')) {
            this.error = 'Bạn cần đăng nhập để xem báo cáo.';
          } else {
            this.error = 'Không thể tải danh sách báo cáo. Vui lòng thử lại.';
          }
          this.isLoading = false;
          this.cdr.detectChanges();
        }
      });
  }

  /**
   * Track by function cho ngFor
   */
  trackByReportId(index: number, report: UserReport): number {
    return report.reportId;
  }

  /**
   * Translate status
   */
  translateStatus(status: string): string {
    return this.reportService.translateStatus(status);
  }

  /**
   * Get status class
   */
  getStatusClass(status: string): string {
    return this.reportService.getStatusClass(status);
  }

  /**
   * Format date
   */
  formatDate(timestamp: number): string {
    return this.reportService.formatDate(timestamp);
  }
}
