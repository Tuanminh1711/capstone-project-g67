import { Component, OnInit, ChangeDetectorRef, AfterViewInit } from '@angular/core';
import { AdminPageTitleService } from '../../../shared/admin-page-title.service';
import { ActivatedRoute, Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ToastService } from '../../../shared/toast/toast.service';
import { BaseAdminListComponent } from '../../../shared/base-admin-list.component';

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

interface UpdateUserRequest {
  username?: string; // Optional since username cannot be updated
  email: string;
  password?: string;
  roleId: number;
  fullName: string;
  phoneNumber: string;
  gender: string;
  status: string;
}

@Component({
  selector: 'app-admin-update-user',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './admin-update-user.component.html',
  styleUrls: ['./admin-update-user.component.scss']
})
export class AdminUpdateUserComponent extends BaseAdminListComponent implements OnInit, AfterViewInit {
  user: UserDetail | null = null;
  // loading, errorMsg, and successMsg handled by BaseAdminListComponent
  userId: number = 0;
  private dataLoaded = false;
  
  // Form data
  formData: UpdateUserRequest = {
    username: '',
    email: '',
    password: '',
    roleId: 2, // default: user
    fullName: '',
    phoneNumber: '',
    gender: 'male', // Use lowercase to match backend
    status: 'ACTIVE'
  };
  
  updating = false;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private http: HttpClient,
    private cdr: ChangeDetectorRef,
    private toastService: ToastService,
    private pageTitleService: AdminPageTitleService
  ) {
    super();
  }

  ngOnInit() {
    this.pageTitleService.setTitle('CẬP NHẬT TÀI KHOẢN');
    // Load user detail immediately on component init
    this.loadUserDetailFromRoute();
    // Subscribe to route params changes
    this.route.params.subscribe(params => {
      const newUserId = +params['id'];
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
      this.toastService.error('ID người dùng không hợp lệ');
      this.router.navigate(['/admin/accounts']);
    }
  }

  loadUserDetail() {
    if (this.loading || !this.userId) return; // Prevent multiple simultaneous requests
    
    this.setLoading(true);
    this.setError('');
    this.setSuccess('');
    this.cdr.detectChanges(); // Force UI update immediately
    
    // Use proxy path for consistency
    const apiUrl = `/api/admin/userdetail/${this.userId}`;
    
    this.http.get<any>(apiUrl).subscribe({
      next: (response: any) => {
        if (response && (response.data || response.id)) {
          this.user = response.data || response;
          this.dataLoaded = true;
          this.populateForm();
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

  private populateForm() {
    if (this.user) {
      this.formData = {
        username: this.user.username || '',
        email: this.user.email || '',
        password: '', // Always empty for security
        roleId: this.getRoleId(this.user.role),
        fullName: this.user.fullName || '',
        phoneNumber: this.user.phone || '',
        gender: this.user.gender || 'male', // Keep original lowercase value
        status: this.user.status?.toUpperCase() || 'ACTIVE'
      };
    }
  }

  private getRoleId(role: string): number {
    const roleMap: { [key: string]: number } = {
      'USER': 2,
      'ADMIN': 1,
      'STAFF': 3,
      'EXPERT': 4,
      'VIP': 5
    };
    return roleMap[role?.toUpperCase()] || 2;
  }

  goBack() {
    this.router.navigate(['/admin/accounts']);
  }

  updateUser() {
    if (this.updating || !this.user) return;

    // Validate form (username is readonly, no need to validate)
    if (!this.formData.email || !this.formData.fullName) {
      this.toastService.error('Vui lòng điền đầy đủ thông tin bắt buộc');
      return;
    }

    this.updating = true;
    this.setError('');
    this.setSuccess('');
    this.cdr.detectChanges();

    const updateData = {
      email: this.formData.email,
      password: this.formData.password,
      roleId: this.formData.roleId,
      fullName: this.formData.fullName,
      phoneNumber: this.formData.phoneNumber,
      gender: this.formData.gender,
      status: this.formData.status
    };
    
    // Convert gender to lowercase for backend
    if (updateData.gender) {
      updateData.gender = updateData.gender.toLowerCase();
    }
    
    // Remove password if empty
    if (!updateData.password || updateData.password.trim() === '') {
      delete updateData.password;
    }

    const apiUrl = `/api/admin/updateuser/${this.userId}`;

    this.http.put<any>(apiUrl, updateData).subscribe({
      next: (response: any) => {
        console.log('Update user response:', response);
        this.toastService.success('Cập nhật thông tin người dùng thành công!');
        this.updating = false;
        this.cdr.detectChanges();
        // Reload user data to show updated info
        setTimeout(() => {
          this.loadUserDetail();
        }, 1000);
      },
      error: (error: any) => {
        console.error('Error updating user:', error);
        let errorMessage = '';
        // Ưu tiên hiện err.message nếu có (lỗi CORS, lỗi không phải JSON)
        if (error && typeof error.message === 'string' && error.message.trim()) {
          errorMessage = error.message;
        } else if (error.status === 0) {
          errorMessage = 'Không thể kết nối đến server. Vui lòng kiểm tra kết nối mạng.';
        } else if (error.status === 401) {
          errorMessage = 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.';
        } else if (error.status === 403) {
          errorMessage = 'Bạn không có quyền cập nhật thông tin này.';
        } else if (error.status === 404) {
          errorMessage = 'Không tìm thấy người dùng.';
        } else if (error.status === 400) {
          errorMessage = error?.error?.message || 'Dữ liệu không hợp lệ. Vui lòng kiểm tra lại.';
        } else if (error.status === 500) {
          errorMessage = 'Lỗi server. Vui lòng thử lại sau.';
        } else {
          errorMessage = error?.error?.message || 'Không thể cập nhật thông tin. Vui lòng thử lại.';
        }
        this.toastService.error(errorMessage);
        this.updating = false;
        this.cdr.detectChanges();
      }
    });
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
      'STAFF': 'Nhân viên',
      'EXPERT': 'Chuyên gia',
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
