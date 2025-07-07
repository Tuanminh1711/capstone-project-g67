import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { ToastService } from '../../../shared/toast.service';

interface ActivityLog {
  id: number;
  action: string;
  timestamp: string;
  ipAddress: string;
  description: string;
}

interface ActivityLogsResponse {
  status: number;
  message: string;
  data: {
    content: ActivityLog[];
    pageable: {
      pageNumber: number;
      pageSize: number;
      sort: any;
      offset: number;
      paged: boolean;
      unpaged: boolean;
    };
    last: boolean;
    totalElements: number;
    totalPages: number;
    size: number;
    number: number;
    sort: any;
    numberOfElements: number;
    first: boolean;
    empty: boolean;
  };
}

@Component({
  selector: 'app-admin-user-activity-logs',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './admin-user-activity-logs.component.html',
  styleUrls: ['./admin-user-activity-logs.component.scss']
})
export class AdminUserActivityLogsComponent implements OnInit {
  userId: number = 0;
  logs: ActivityLog[] = [];
  loading = false;
  errorMsg = '';
  
  // Pagination
  currentPage = 0;
  pageSize = 10;
  totalPages = 0;
  totalElements = 0;
  
  userName = '';

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private http: HttpClient,
    private cdr: ChangeDetectorRef,
    private toastService: ToastService
  ) {}

  ngOnInit() {
    this.loadUserActivityLogs();
    
    // Subscribe to route params changes
    this.route.params.subscribe(params => {
      const newUserId = +params['id'];
      if (newUserId && newUserId !== this.userId) {
        this.userId = newUserId;
        this.currentPage = 0;
        this.logs = [];
        this.loadUserActivityLogs();
      }
    });
  }

  private loadUserIdFromRoute() {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.userId = +id;
    } else {
      this.toastService.error('ID người dùng không hợp lệ');
      this.router.navigate(['/admin/accounts']);
    }
  }

  loadUserActivityLogs() {
    if (!this.userId) {
      this.loadUserIdFromRoute();
    }
    
    if (this.loading || !this.userId) return;
    
    this.loading = true;
    this.errorMsg = '';
    this.cdr.detectChanges();
    
    const apiUrl = `/api/admin/activity-logs-user/${this.userId}?page=${this.currentPage}&size=${this.pageSize}`;
    
    this.http.get<ActivityLogsResponse>(apiUrl).subscribe({
      next: (response: any) => {
        if (response && response.data) {
          this.logs = response.data.content || [];
          this.totalPages = response.data.totalPages || 0;
          this.totalElements = response.data.totalElements || 0;
          this.currentPage = response.data.number || 0;
        } else {
          this.logs = [];
          this.errorMsg = 'Không tìm thấy dữ liệu hoạt động';
        }
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: (error: any) => {
        console.error('Error loading user activity logs:', error);
        
        if (error.status === 0) {
          this.errorMsg = 'Không thể kết nối đến server. Vui lòng kiểm tra kết nối mạng.';
        } else if (error.status === 401) {
          this.errorMsg = 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.';
        } else if (error.status === 403) {
          this.errorMsg = 'Bạn không có quyền truy cập thông tin này.';
        } else if (error.status === 404) {
          this.errorMsg = 'Không tìm thấy dữ liệu hoạt động của người dùng.';
        } else if (error.status === 500) {
          this.errorMsg = 'Lỗi server. Vui lòng thử lại sau.';
        } else {
          this.errorMsg = error?.error?.message || 'Không thể tải dữ liệu hoạt động. Vui lòng thử lại.';
        }
        
        this.loading = false;
        this.logs = [];
        this.cdr.detectChanges();
      }
    });
  }

  goBack() {
    this.router.navigate(['/admin/accounts']);
  }

  nextPage() {
    if (this.currentPage + 1 < this.totalPages) {
      this.currentPage++;
      this.loadUserActivityLogs();
    }
  }

  prevPage() {
    if (this.currentPage > 0) {
      this.currentPage--;
      this.loadUserActivityLogs();
    }
  }

  goToPage(page: number) {
    if (page >= 0 && page < this.totalPages) {
      this.currentPage = page;
      this.loadUserActivityLogs();
    }
  }

  formatDateTime(dateString: string): string {
    if (!dateString) return 'Không xác định';
    try {
      return new Date(dateString).toLocaleString('vi-VN', {
        day: '2-digit',
        month: '2-digit', 
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      });
    } catch {
      return dateString;
    }
  }

  getActionText(action: string): string {
    const actionMap: { [key: string]: string } = {
      'LOGIN': 'Đăng nhập',
      'LOGOUT': 'Đăng xuất',
      'CREATE': 'Tạo mới',
      'UPDATE': 'Cập nhật',
      'DELETE': 'Xóa',
      'VIEW': 'Xem',
      'UPLOAD': 'Tải lên',
      'DOWNLOAD': 'Tải xuống'
    };
    return actionMap[action?.toUpperCase()] || action;
  }

  getActionClass(action: string): string {
    const actionClassMap: { [key: string]: string } = {
      'LOGIN': 'action-login',
      'LOGOUT': 'action-logout', 
      'CREATE': 'action-create',
      'UPDATE': 'action-update',
      'DELETE': 'action-delete',
      'VIEW': 'action-view',
      'UPLOAD': 'action-upload',
      'DOWNLOAD': 'action-download'
    };
    return actionClassMap[action?.toUpperCase()] || 'action-default';
  }

  reloadLogs() {
    this.currentPage = 0;
    this.loadUserActivityLogs();
  }
}
