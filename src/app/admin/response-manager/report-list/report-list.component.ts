import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';
import { AdminTopNavigatorComponent } from '../../../shared/admin-top-navigator/admin-top-navigator.component';
import { AdminSidebarComponent } from '../../../shared/admin-sidebar/admin-sidebar.component';
import { AdminFooterComponent } from '../../../shared/admin-footer/admin-footer.component';
import { BehaviorSubject, Subscription } from 'rxjs';

export interface Report {
  id: number;
  title: string;
  description: string;
  status: 'pending' | 'approved' | 'rejected' | 'resolved' | 'in_progress' | 'closed';
  priority?: 'low' | 'medium' | 'high' | 'urgent';
  category?: string;
  createdAt: string;
  createdBy: string;
  responseCount?: number;
  lastUpdated?: string;
  reporterName: string;
  reportedContent: string;
}

@Component({
  selector: 'app-report-list',
  standalone: true,
  imports: [CommonModule, FormsModule, HttpClientModule, AdminTopNavigatorComponent, AdminSidebarComponent, AdminFooterComponent],
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

  constructor(private router: Router) {}

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
          priority: 'high',
          category: 'spam',
          responseCount: 0,
          lastUpdated: '2024-01-15 10:30:00'
        },
        {
          id: 2,
          title: 'Ngôn ngữ không phù hợp',
          description: 'Sử dụng từ ngữ thiếu văn hóa',
          status: 'approved',
          createdAt: '2024-01-14 15:20:00',
          createdBy: 'user456',
          reporterName: 'Trần Thị B',
          reportedContent: 'Nội dung vi phạm...',
          priority: 'medium',
          category: 'language',
          responseCount: 2,
          lastUpdated: '2024-01-14 16:00:00'
        },
        {
          id: 3,
          title: 'Quảng cáo trái phép',
          description: 'Đăng quảng cáo không được phép',
          status: 'resolved',
          createdAt: '2024-01-13 09:15:00',
          createdBy: 'user789',
          reporterName: 'Lê Văn C',
          reportedContent: 'Nội dung vi phạm...',
          priority: 'low',
          category: 'advertisement',
          responseCount: 1,
          lastUpdated: '2024-01-13 14:00:00'
        }
      ];
      
      this.totalElements = this.allReports.length;
      this.totalPages = Math.ceil(this.totalElements / this.pageSize) || 1;
      this.pageNo = 0;
      this.updatePage();
      this.loading = false;
    }, 500);
  }

  updatePage() {
    const start = this.pageNo * this.pageSize;
    const end = start + this.pageSize;
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
    this.router.navigate(['/admin/reports', report.id]);
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
    switch (status.toLowerCase()) {
      case 'pending': return 'Chờ xử lý';
      case 'approved': return 'Đã duyệt';
      case 'rejected': return 'Từ chối';
      case 'resolved': return 'Đã giải quyết';
      default: return status;
    }
  }
}