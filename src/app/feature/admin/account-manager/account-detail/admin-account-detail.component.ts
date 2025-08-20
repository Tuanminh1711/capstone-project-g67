import { Component, OnInit, ChangeDetectorRef, AfterViewInit } from '@angular/core';
import { inject } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { BaseAdminListComponent } from '../../shared/base-admin-list.component';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../../../auth/auth.service';

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
  showOnlyUsernameAndRole: boolean = false;
  showAllInfo: boolean = false;
  canView: boolean = true;
  user: UserDetail | null = null;
  userId: number = 0;
  private dataLoaded = false;

  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private http = inject(HttpClient);
  private cdr = inject(ChangeDetectorRef);
  private authService = inject(AuthService);

  constructor() {
    super();
  }

  ngOnInit() {
    // Kiểm tra quyền truy cập trước khi load data
    if (!this.checkUserPermissions()) {
      return;
    }

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

  private checkUserPermissions(): boolean {
  // Lấy thông tin user từ token thông qua AuthService
  const currentUserRole = this.authService.getCurrentUserRole();
  const currentUserId = this.authService.getCurrentUserId();

    // Chỉ ADMIN và STAFF mới có thể truy cập trang này
    if (!currentUserRole || (currentUserRole.toUpperCase() !== 'ADMIN' && currentUserRole.toUpperCase() !== 'STAFF')) {
      this.canView = false;
      this.setError('Bạn không có quyền truy cập trang này. Chỉ Admin và Staff mới có thể xem thông tin tài khoản.');
      this.setLoading(false);
      return false;
    }

    return true;
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

  private determineVisibilityPermissions(currentUserRole: string, currentUserId: number, viewedRole: string, viewedUserId: number) {
    // Reset flags
    this.canView = true;
    this.showAllInfo = false;
    this.showOnlyUsernameAndRole = false;

  // ...existing code...

    // Kiểm tra nếu không có thông tin user hiện tại
    if (!currentUserRole || !currentUserId) {
      this.canView = false;
      this.setError('Không thể xác thực thông tin người dùng hiện tại.');
      return;
    }

    // Chỉ ADMIN và STAFF mới có thể xem thông tin tài khoản
    const roleFromToken = currentUserRole.toUpperCase();
    if (roleFromToken !== 'ADMIN' && roleFromToken !== 'STAFF') {
      this.canView = false;
      this.setError('Bạn không có quyền truy cập thông tin này.');
      return;
    }

    // Logic theo yêu cầu - sử dụng trực tiếp currentUserRole từ token:
    const currentRoleFromToken = currentUserRole.toUpperCase();
    if (currentRoleFromToken === 'ADMIN') {
      if (currentUserId === viewedUserId) {
        // Admin xem tài khoản của chính mình -> hiển thị hết thông tin
        this.showAllInfo = true;
        this.showOnlyUsernameAndRole = false;
      } else if (viewedRole === 'STAFF' || viewedRole === 'EXPERT') {
        // Admin xem tài khoản của staff hoặc expert -> hiển thị hết thông tin
        this.showAllInfo = true;
        this.showOnlyUsernameAndRole = false;
      } else if (viewedRole === 'USER' || viewedRole === 'VIP') {
        // Admin xem tài khoản của user hoặc vip -> chỉ hiển thị username và vai trò
        this.showAllInfo = false;
        this.showOnlyUsernameAndRole = true;
      } else {
        // Các trường hợp khác -> chỉ hiển thị username và vai trò
        this.showAllInfo = false;
        this.showOnlyUsernameAndRole = true;
      }
    } else if (currentRoleFromToken === 'STAFF') {
      if (viewedRole === 'USER' || viewedRole === 'VIP') {
        // Staff xem tài khoản của user hoặc vip -> chỉ hiển thị username và vai trò
        this.showAllInfo = false;
        this.showOnlyUsernameAndRole = true;
      } else {
        // Staff xem các vai trò khác (admin, staff, expert) -> hiển thị hết thông tin
        this.showAllInfo = true;
        this.showOnlyUsernameAndRole = false;
      }
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
          // Null safety check
          if (!this.user) {
            this.setError('Không tìm thấy thông tin người dùng');
            this.dataLoaded = false;
            return;
          }
          
          // Lấy thông tin từ viewed user trước
          const viewedUserId = this.user.id;
          const viewedRole = (this.user.role || '').toUpperCase();
          
          // Lấy thông tin user hiện tại từ token thông qua AuthService
          const currentUserRole = this.authService.getCurrentUserRole();
          const currentUserId = this.authService.getCurrentUserId();
          
          // ...existing code...
          
          // Convert currentUserId from string to number for comparison
          const currentUserIdNum = currentUserId ? parseInt(currentUserId, 10) : 0;
          
          this.determineVisibilityPermissions(currentUserRole || '', currentUserIdNum, viewedRole, viewedUserId);
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
  // ...existing code...
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
      'ADMIN': 'QUẢN TRỊ VIÊN',
      'STAFF': 'NHÂN VIÊN',
      'USER': 'NGƯỜI DÙNG',
      'GUEST': 'KHÁCH',
      'EXPERT': 'CHUYÊN GIA',
      'VIP': 'VIP'
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
