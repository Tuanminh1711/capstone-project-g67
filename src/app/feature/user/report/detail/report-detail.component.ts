import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, ActivatedRoute, Router } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { ReportService } from '../report.service';
import { UserReport } from '../report.model';
import { TopNavigatorComponent } from '../../../../shared/top-navigator/top-navigator.component';
import { FooterComponent } from '../../../../shared/footer/footer.component';

@Component({
  selector: 'app-report-detail',
  standalone: true,
  imports: [CommonModule, RouterModule, TopNavigatorComponent],
  templateUrl: './report-detail.component.html',
  styleUrls: ['./report-detail.component.scss']
})
export class ReportDetailComponent implements OnInit, OnDestroy {
  report: UserReport | null = null;
  isLoading = false;
  error: string | null = null;
  reportId: number | null = null;

  private destroy$ = new Subject<void>();

  constructor(
    private reportService: ReportService,
    private route: ActivatedRoute,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.route.params.pipe(takeUntil(this.destroy$)).subscribe(params => {
      const id = params['id'];
      if (id) {
        this.reportId = +id;
        this.loadReportDetail(this.reportId);
      } else {
        this.error = 'ID báo cáo không hợp lệ.';
      }
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Load chi tiết report
   */
  loadReportDetail(reportId: number): void {
    this.isLoading = true;
    this.error = null;

    this.reportService.getUserReportDetail(reportId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (report: UserReport) => {
          this.report = report;
          this.isLoading = false;
          this.cdr.detectChanges(); // Force change detection
        },
        error: (error) => {
          console.error('Error loading report detail:', error);
          this.report = null;
          
          if (error.status === 404) {
            this.error = 'Không tìm thấy báo cáo này.';
          } else if (error.message?.includes('not authenticated')) {
            this.error = 'Bạn cần đăng nhập để xem chi tiết báo cáo.';
          } else {
            this.error = 'Không thể tải chi tiết báo cáo. Vui lòng thử lại.';
          }
          this.isLoading = false;
          this.cdr.detectChanges(); // Force change detection
        }
      });
  }

  /**
   * Quay lại danh sách
   */
  goBack(): void {
    this.router.navigate(['/user/report']);
  }

  /**
   * Refresh chi tiết
   */
  refresh(): void {
    if (this.reportId) {
      this.loadReportDetail(this.reportId);
    }
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

  /**
   * Navigate to plant detail
   */
  viewPlantDetail(): void {
    if (this.report?.plantId) {
      this.router.navigate(['/plant-detail', this.report.plantId]);
    }
  }
}
