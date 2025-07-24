import { Component, OnInit, ChangeDetectorRef, AfterViewInit } from '@angular/core';
import { inject } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { BaseAdminListComponent } from '../../../shared/base-admin-list.component';
import { FormsModule } from '@angular/forms';

interface UserDetail {
  id: number;
  username: string;
  fullName: string;
  email: string;
  phone: string;
  role: string;
  status: string;
  createdAt: string;
  updatedAt?: string;
  profileImage?: string;
  avatarUrl?: string;
  address?: string;
  birthDate?: string;
  lastLoginAt?: string;
  gender?: string;
  livingEnvironment?: string;
}

@Component({
  selector: 'app-admin-account-detail',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './admin-account-detail.component.html',
  styleUrls: ['./admin-account-detail.component.scss']
})
export class AdminAccountDetailComponent extends BaseAdminListComponent implements OnInit, AfterViewInit {
  user: UserDetail | null = null;
  userId: number = 0;
  private dataLoaded = false;

  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private http = inject(HttpClient);
  private cdr = inject(ChangeDetectorRef);

  constructor() {
    super();
  }

  ngOnInit() {
    // Load user detail immediately on component init
    this.loadUserDetailFromRoute();
    
    // Subscribe to route params changes
    this.route.params.subscribe(params => {
      const newUserId = +(params as any)['id'];
      if (newUserId && newUserId !== this.userId) {
        this.userId = newUserId;
        this.dataLoaded = false;
        this.user = null; // Clear previous data
        this.loadUserDetail();
      }
    });
  }

  ngAfterViewInit() {
    // Force load again after view init for better UX
    setTimeout(() => {
      if (!this.user && this.userId && !this.dataLoaded) {
        this.loadUserDetail();
      }
    }, 100);
  }

  private loadUserDetailFromRoute() {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.userId = +id;
      this.loadUserDetail();
    } else {
      this.setError('ID người dùng không hợp lệ');
    }
  }

  loadUserDetail() {
    if (this.loading || !this.userId) return; // Prevent multiple simultaneous requests
    
    this.setLoading(true);
    this.setError('');
    this.cdr.detectChanges(); // Force UI update immediately
    
    // Use proxy path for consistency
    const apiUrl = `/api/admin/userdetail/${this.userId}`;
    
    this.http.get<any>(apiUrl).subscribe({
      next: (response) => {
        if (response && (response.data || response.id)) {
          this.user = response.data || response;
          this.dataLoaded = true;
        } else {
          this.setError('Không tìm thấy thông tin người dùng');
          this.dataLoaded = false;
        }
        this.setLoading(false);
        // Force change detection
        this.cdr.markForCheck();
        this.cdr.detectChanges();
      },
      error: (error: any) => {
        console.error('Error loading user detail:', error);
        // Handle different error types like user profile component
        if (error.status === 0) {
          this.setError('Không thể kết nối đến server. Vui lòng kiểm tra kết nối mạng.');
        } else if (error.status === 401) {
          this.setError('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.');
        } else if (error.status === 403) {
          this.setError('Bạn không có quyền truy cập thông tin này.');
        } else if (error.status === 404) {
          this.setError('Không tìm thấy thông tin người dùng.');
        } else if (error.status === 500) {
          this.setError('Lỗi server. Vui lòng thử lại sau.');
        } else {
          this.setError(error?.error?.message || 'Không thể tải thông tin người dùng. Vui lòng thử lại.');
        }
        this.setLoading(false);
        this.dataLoaded = false;
        this.user = null;
        // Force change detection immediately
        this.cdr.markForCheck();
        this.cdr.detectChanges();
      }
    });
  }

  goBack() {
    this.router.navigate(['/admin/accounts']);
  }

  editUser() {
    if (this.userId) {
      this.router.navigate(['/admin/accounts/update', this.userId]);
    }
  }

  viewActivityLogs() {
    if (this.userId) {
      this.router.navigate(['/admin/accounts/activity-logs', this.userId]);
    }
  }

  formatDate(dateString: string | null): string {
    if (!dateString) return 'Chưa có thông tin';
    try {
      return new Date(dateString).toLocaleString('vi-VN', {
        day: '2-digit', month: '2-digit', year: 'numeric',
        hour: '2-digit', minute: '2-digit', second: '2-digit'
      });
    } catch {
      return dateString;
    }
  }

  getStatusClass(status: string): string {
    return status === 'ACTIVE' ? 'status-active' : 'status-inactive';
  }

  getStatusText(status: string): string {
    const statusMap: { [key: string]: string } = {
      'ACTIVE': 'Hoạt động',
      'INACTIVE': 'Đã khóa',
      'BANNED': 'Cấm'
    };
    return statusMap[status?.toUpperCase()] || status;
  }

  getRoleText(role: string): string {
    const roleMap: { [key: string]: string } = {
      'USER': 'Người dùng',
      'ADMIN': 'Quản trị viên',
      'MANAGER': 'Quản lý'
    };
    return roleMap[role?.toUpperCase()] || role;
  }

  getGenderText(gender: string): string {
    const genderMap: { [key: string]: string } = {
      'MALE': 'Nam',
      'FEMALE': 'Nữ',
      'OTHER': 'Khác',
      'male': 'Nam',
      'female': 'Nữ',
      'other': 'Khác'
    };
    return genderMap[gender] || gender || 'Chưa có thông tin';
  }

  getLivingEnvironmentText(environment: string): string {
    const environmentMap: { [key: string]: string } = {
      'INDOOR': 'Trong nhà',
      'OUTDOOR': 'Ngoài trời',
      'BOTH': 'Cả hai',
      'APARTMENT': 'Chung cư',
      'HOUSE': 'Nhà riêng',
      'GARDEN': 'Có vườn',
      'BALCONY': 'Ban công'
    };
    return environmentMap[environment?.toUpperCase()] || environment || 'Chưa có thông tin';
  }

  getUserAvatarSrc(): string {
    if (this.user?.avatarUrl) {
      return this.user.avatarUrl;
    }
    if (this.user?.profileImage) {
      return this.user.profileImage;
    }
    return '';
  }

  hasUserAvatar(): boolean {
    return !!(this.user?.avatarUrl || this.user?.profileImage);
  }

  onAvatarError(event: any): void {
    if (event.target) {
      event.target.style.display = 'none';
      const placeholder = event.target.nextElementSibling;
      if (placeholder) {
        placeholder.style.display = 'flex';
      }
    }
  }
}
