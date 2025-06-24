import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { AdminTopNavigatorComponent } from '../../shared/admin-top-navigator/admin-top-navigator.component';
import { AdminSidebarComponent } from '../../shared/admin-sidebar/admin-sidebar.component';
import { AdminFooterComponent } from '../../shared/admin-footer/admin-footer.component';
import { Report } from './report-list.component';
import { BehaviorSubject, Subscription } from 'rxjs';

export interface ReportForAction extends Report {
  selected: boolean;
  action?: 'approve' | 'reject' | 'resolve';
  notes?: string;
}

@Component({
  selector: 'app-report-approve-reject',
  standalone: true,
  imports: [CommonModule, AdminTopNavigatorComponent, AdminSidebarComponent, AdminFooterComponent],
  templateUrl: './report-approve-reject.component.html',
  styleUrls: ['./report-approve-reject.component.scss']
})
export class ReportApproveRejectComponent implements OnInit, OnDestroy {
  private reportsSubject = new BehaviorSubject<ReportForAction[]>([]);
  reports$ = this.reportsSubject.asObservable();
  allReports: ReportForAction[] = [];
  loading = false;
  errorMsg = '';
  successMsg = '';
  processing = false;
  private sub: Subscription = new Subscription();

  constructor(private router: Router) {}

  ngOnInit() {
    this.loadReports();
  }

  ngOnDestroy() {
    this.sub.unsubscribe();
  }

  loadReports() {
    this.loading = true;
    this.errorMsg = '';
    
    // TODO: Replace with real API call
    setTimeout(() => {
      // Mock data for demonstration
      this.allReports = [
        {
          id: 1,
          title: 'Nội dung spam',
          description: 'Người dùng đăng nội dung spam không phù hợp',
          status: 'pending',
          createdAt: '2024-01-15 10:30:00',
          createdBy: 'user123',
          reporterName: 'Nguyễn Văn A',
          reportedContent: 'Nội dung vi phạm...',
          selected: false
        },
        {
          id: 2,
          title: 'Ngôn ngữ không phù hợp',
          description: 'Sử dụng từ ngữ thiếu văn hóa',
          status: 'pending',
          createdAt: '2024-01-14 15:20:00',
          createdBy: 'user456',
          reporterName: 'Trần Thị B',
          reportedContent: 'Nội dung vi phạm...',
          selected: false
        },
        {
          id: 3,
          title: 'Quảng cáo trái phép',
          description: 'Đăng quảng cáo không được phép',
          status: 'pending',
          createdAt: '2024-01-13 09:15:00',
          createdBy: 'user789',
          reporterName: 'Lê Văn C',
          reportedContent: 'Nội dung vi phạm...',
          selected: false
        }
      ];
      
      this.reportsSubject.next(this.allReports);
      this.loading = false;
    }, 500);
  }

  isAllSelected(): boolean {
    return this.allReports.length > 0 && this.allReports.every(report => report.selected);
  }

  toggleSelectAll() {
    const allSelected = this.isAllSelected();
    this.allReports.forEach(report => {
      report.selected = !allSelected;
    });
    this.reportsSubject.next([...this.allReports]);
  }

  toggleSelect(report: ReportForAction) {
    report.selected = !report.selected;
    this.reportsSubject.next([...this.allReports]);
  }

  onActionChange(report: ReportForAction, event: Event) {
    const target = event.target as HTMLSelectElement;
    const action = target.value as 'approve' | 'reject' | 'resolve';
    this.setAction(report, action);
  }

  setAction(report: ReportForAction, action: 'approve' | 'reject' | 'resolve') {
    report.action = action;
    this.reportsSubject.next([...this.allReports]);
  }

  updateNotes(report: ReportForAction, event: Event) {
    const target = event.target as HTMLTextAreaElement;
    report.notes = target.value;
  }

  getSelectedReports(): ReportForAction[] {
    return this.allReports.filter(report => report.selected);
  }

  getSelectedCount(): number {
    return this.getSelectedReports().length;
  }

  canProcess(): boolean {
    const selectedReports = this.getSelectedReports();
    return selectedReports.length > 0 && selectedReports.every(report => report.action);
  }

  processReports() {
    if (!this.canProcess()) {
      this.errorMsg = 'Vui lòng chọn ít nhất một báo cáo và đặt hành động cho tất cả báo cáo đã chọn.';
      setTimeout(() => this.errorMsg = '', 3000);
      return;
    }

    if (!confirm(`Bạn có chắc chắn muốn xử lý ${this.getSelectedCount()} báo cáo đã chọn?`)) {
      return;
    }

    this.processing = true;
    this.errorMsg = '';
    this.successMsg = '';

    const selectedReports = this.getSelectedReports();
    
    // TODO: Replace with real API call
    setTimeout(() => {
      // Simulate API processing
      selectedReports.forEach(report => {
        // Convert action to status
        switch (report.action) {
          case 'approve':
            report.status = 'approved';
            break;
          case 'reject':
            report.status = 'rejected';
            break;
          case 'resolve':
            report.status = 'resolved';
            break;
        }
        report.selected = false;
        report.action = undefined;
        report.notes = undefined;
      });

      this.successMsg = `Đã xử lý thành công ${selectedReports.length} báo cáo!`;
      this.processing = false;
      
      setTimeout(() => this.successMsg = '', 3000);
      this.reportsSubject.next([...this.allReports]);
    }, 1000);
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

  getActionText(action: string): string {
    switch (action) {
      case 'approve': return 'Duyệt';
      case 'reject': return 'Từ chối';
      case 'resolve': return 'Giải quyết';
      default: return '';
    }
  }

  getActionClass(action: string): string {
    switch (action) {
      case 'approve': return 'action-approve';
      case 'reject': return 'action-reject';
      case 'resolve': return 'action-resolve';
      default: return '';
    }
  }

  viewDetail(report: ReportForAction) {
    this.router.navigate(['/admin/reports', report.id]);
  }

  reloadReports() {
    this.loadReports();
  }
} 