import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { ToastService } from '../../../../shared/toast/toast.service';

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
    
    const apiUrl = `/api/admin/activity-logs-user/${this.userId}?pageNo=${this.currentPage}&pageSize=${this.pageSize}&_t=${Date.now()}`;
    console.log(`Loading page ${this.currentPage} from:`, apiUrl);
    
    this.http.get<ActivityLogsResponse>(apiUrl, {
      headers: {
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache'
      }
    }).subscribe({
      next: (response: any) => {
        console.log('API Response for page', this.currentPage, ':', response);
        
        if (response && response.data) {
          this.logs = response.data.content || [];
          this.totalPages = response.data.totalPages || 0;
          this.totalElements = response.data.totalElements || 0;
          
          // Bây giờ API sẽ trả về đúng page number
          const apiPageNumber = response.data.number || 0;
          console.log(`Expected page: ${this.currentPage}, API returned page: ${apiPageNumber}`);
          
          // Verify that API returned the correct page
          if (apiPageNumber === this.currentPage) {
            console.log('✅ Pagination working correctly');
          } else {
            console.warn(`⚠️ Page mismatch: expected ${this.currentPage}, got ${apiPageNumber}`);
            // Update currentPage to match API response
            this.currentPage = apiPageNumber;
          }
          
          console.log(`Loaded ${this.logs.length} logs for page ${this.currentPage}`);
          if (this.logs.length > 0) {
            console.log('First log ID:', this.logs[0].id);
            console.log('Last log ID:', this.logs[this.logs.length - 1].id);
          }
          
          // Đảm bảo currentPage không vượt quá bounds
          if (this.currentPage >= this.totalPages && this.totalPages > 0) {
            this.currentPage = this.totalPages - 1;
          }
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
    console.log(`nextPage called: current=${this.currentPage}, total=${this.totalPages}, loading=${this.loading}`);
    if (this.currentPage + 1 < this.totalPages && !this.loading) {
      this.currentPage++;
      console.log(`Moving to next page: ${this.currentPage}`);
      this.loadUserActivityLogs();
    }
  }

  prevPage() {
    console.log(`prevPage called: current=${this.currentPage}, loading=${this.loading}`);
    if (this.currentPage > 0 && !this.loading) {
      this.currentPage--;
      console.log(`Moving to prev page: ${this.currentPage}`);
      this.loadUserActivityLogs();
    }
  }

  goToPage(page: number) {
    console.log(`goToPage called: target=${page}, current=${this.currentPage}, total=${this.totalPages}, loading=${this.loading}`);
    if (page >= 0 && page < this.totalPages && page !== this.currentPage && !this.loading) {
      this.currentPage = page;
      console.log(`Moving to page: ${this.currentPage}`);
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

  // Helper methods for pagination
  getPaginationPages(): number[] {
    const pages: number[] = [];
    const totalPages = this.totalPages;
    const currentPage = this.currentPage;
    
    for (let i = 0; i < totalPages; i++) {
      // Show first, last, and pages around current page
      if (i === 0 || i === totalPages - 1 || Math.abs(i - currentPage) <= 2) {
        pages.push(i);
      } else if (Math.abs(i - currentPage) === 3 && !pages.includes(-1)) {
        pages.push(-1); // Ellipsis marker
      }
    }
    
    return pages;
  }

  isEllipsis(page: number): boolean {
    return page === -1;
  }
}
