import { Component, OnInit, ChangeDetectorRef, AfterViewInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ToastService } from '../../../../shared/toast/toast.service';
import { BaseAdminListComponent } from '../../shared/base-admin-list.component';
import { AuthService } from '../../../../auth/auth.service';
import { UserProfileService, UpdateUserProfileRequest } from '../../../user/profile/view-user-profile/user-profile.service';

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
  showPasswordField: boolean = false;
  // Biến kiểm soát hiển thị/chỉnh sửa
  showOnlyUsernameAndRole: boolean = false;
  canEditRole: boolean = false;
  canEditInfo: boolean = false;
  canEditRoleOfAdmin: boolean = false;
  user: UserDetail | null = null;
  originalUserData: any = null; // Lưu toàn bộ dữ liệu user gốc
  // loading, errorMsg, and successMsg handled by BaseAdminListComponent
  userId: number = 0;
  private dataLoaded = false;
  // Phân quyền chỉnh sửa dựa vào role người đăng nhập
  canEditNone: boolean = false;
  isVip: boolean = false;
  canEditRoleOnly: boolean = false;
  canEditAll: boolean = false;
  canEditEmail: boolean = false; // Flag để kiểm soát việc chỉnh sửa email
  currentUserRole: string = '';
  isSelfEdit: boolean = false; // Flag để xác định có phải đang chỉnh sửa tài khoản của chính mình
  currentUserId: string | null = null;

  private setEditPermissions() {
    // ADMIN, STAFF, EXPERT, VIP có thể chỉnh sửa tất cả
    if (['ADMIN', 'STAFF', 'EXPERT', 'VIP'].includes(this.currentUserRole)) {
      this.canEditAll = true;
      this.canEditEmail = !this.isSelfEdit; // Nếu self-edit thì không cho edit email qua admin endpoint
      this.isVip = this.currentUserRole === 'VIP';
      this.canEditRoleOnly = false;
      this.canEditNone = false;
    } else if (['USER', 'GUEST'].includes(this.currentUserRole)) {
      // USER và GUEST chỉ chỉnh sửa thông tin cơ bản
      this.canEditAll = false;
      this.canEditEmail = false; // User/Guest không được chỉnh sửa email trong admin panel
      this.canEditRoleOnly = true;
      this.canEditNone = false;
      this.isVip = false;
    } else {
      // Không xác định role hoặc không có quyền
      this.canEditAll = false;
      this.canEditEmail = false;
      this.canEditRoleOnly = false;
      this.canEditNone = true;
      this.isVip = false;
    }
  }

  private checkIfSelfEdit() {
    // Kiểm tra xem userId hiện tại có trùng với userId đang chỉnh sửa không
    if (this.currentUserId && this.userId) {
      this.isSelfEdit = (this.currentUserId + '') === (this.userId + '');
      
      // Cập nhật lại permissions sau khi xác định self-edit
      this.setEditPermissions();
    }
  }

  private getRoleId(roleName: string): number {
    // Map role name to role ID
    const roleMap: {[key: string]: number} = {
      'ADMIN': 1,
      'STAFF': 2, 
      'USER': 3,
      'GUEST': 4,
      'EXPERT': 5,
      'VIP': 6
    };
    return roleMap[roleName.toUpperCase()] || 2; // Default to USER
  }

  getRoleText(role: string): string {
    const roleMap: {[key: string]: string} = {
      'ADMIN': 'Quản trị viên',
      'USER': 'Người dùng', 
      'VIP': 'VIP',
      'EXPERT': 'Chuyên gia',
      'STAFF': 'Nhân viên'
    };
    return roleMap[role?.toUpperCase()] || 'Người dùng';
  }

  getStatusText(status: string): string {
    const statusMap: {[key: string]: string} = {
      'ACTIVE': 'Hoạt động',
      'INACTIVE': 'Đã khóa',
      'BANNED': 'Cấm'
    };
    return statusMap[status?.toUpperCase()] || 'Hoạt động';
  }
  
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
  private authService: AuthService,
  private userProfileService: UserProfileService
  ) {
    super();
  }

  ngOnInit() {
    // Lấy role và userId người đăng nhập
    this.currentUserRole = this.authService.getCurrentUserRole()?.toUpperCase() || '';
    this.currentUserId = this.authService.getCurrentUserId();
    this.setEditPermissions();

    // Kiểm tra query params để xác định self-edit
    this.route.queryParams.subscribe(params => {
      this.isSelfEdit = params['selfEdit'] === 'true';
    });

    // Load user detail immediately on component init
    this.loadUserDetailFromRoute();

    // Subscribe to route params changes
    this.route.params.subscribe(params => {
      const newUserId = +params['id'];
      if (newUserId && newUserId !== this.userId) {
        this.userId = newUserId;
        this.dataLoaded = false;
        this.user = null; // Clear previous data
        
        // Kiểm tra lại xem có phải self-edit không
        this.checkIfSelfEdit();
        
        this.loadUserDetail();
      }
    });
  }

  // ...existing code...

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
          this.originalUserData = { ...(response.data || response) };
          this.dataLoaded = true;
          this.populateForm();
          // Hiển thị trường mật khẩu mới nếu đang chỉnh sửa chính mình
          const currentUserId = this.authService.getCurrentUserId();
          this.showPasswordField = !!(currentUserId && this.user && String(this.user.id) === String(currentUserId));
          // Phân quyền hiển thị/chỉnh sửa
          const userRole = this.user && this.user.role ? this.user.role.toUpperCase() : '';
          const currentRole = this.currentUserRole;
          // Nếu là VIP thì không cho phép truy cập
          if (userRole === 'VIP') {
            this.toastService.error('Không được phép chỉnh sửa tài khoản VIP!');
            this.router.navigate(['/admin/accounts']);
            return;
          }
          // Admin hoặc staff vào update của user: chỉ hiện username và vai trò, chỉ chỉnh sửa vai trò
          if ((currentRole === 'ADMIN' || currentRole === 'STAFF') && userRole === 'USER') {
            this.showOnlyUsernameAndRole = true;
            this.canEditRole = true;
            this.canEditInfo = false;
            this.canEditRoleOfAdmin = false;
          }
          // Admin vào update của staff hoặc expert: hiện hết thông tin, chỉ chỉnh sửa vai trò
          else if (currentRole === 'ADMIN' && (userRole === 'STAFF' || userRole === 'EXPERT')) {
            this.showOnlyUsernameAndRole = false;
            this.canEditRole = true;
            this.canEditInfo = false;
            this.canEditRoleOfAdmin = false;
          }
          // Admin vào update của admin: hiện hết thông tin, không chỉnh sửa vai trò
          else if (currentRole === 'ADMIN' && userRole === 'ADMIN') {
            this.showOnlyUsernameAndRole = false;
            this.canEditRole = false;
            this.canEditInfo = true;
            this.canEditRoleOfAdmin = true;
          }
          // Trường hợp còn lại: hiện hết thông tin, cho chỉnh sửa thông tin (ví dụ user tự sửa)
          else {
            this.showOnlyUsernameAndRole = false;
            this.canEditRole = false;
            this.canEditInfo = true;
            this.canEditRoleOfAdmin = false;
          }
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

  goBack() {
    this.router.navigate(['/admin/accounts']);
  }

  updateUser() {
    if (this.updating || !this.user) return;

    const currentUserId = this.authService.getCurrentUserId();
    const isUpdatingSelf = currentUserId && this.userId === Number(currentUserId);

    // Validate form data based on update type

    // Validate họ và tên chỉ chứa ký tự chữ (không số, không ký tự đặc biệt)
    const namePattern = /^[a-zA-ZÀ-ỹ\s]+$/u;
    if (!namePattern.test(this.formData.fullName.trim())) {
      this.toastService.error('Họ và tên chỉ được chứa ký tự chữ, không chứa số hoặc ký tự đặc biệt!');
      return;
    }

    if (isUpdatingSelf || this.isSelfEdit) {
      // Self-edit: chỉ validate thông tin cơ bản (không cần email)
      if (!this.formData.fullName || !this.formData.phoneNumber) {
        this.toastService.error('Vui lòng điền đầy đủ thông tin bắt buộc (Họ tên, Số điện thoại)');
        return;
      }
    } else {
      // Admin-edit: validate tất cả thông tin bắt buộc
      if (!this.formData.email || !this.formData.fullName || !this.formData.phoneNumber) {
        this.toastService.error('Vui lòng điền đầy đủ thông tin bắt buộc (Email, Họ tên, Số điện thoại)');
        return;
      }

      // Validate email format only for admin-edit
      const emailPattern = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,4}$/;
      if (!emailPattern.test(this.formData.email)) {
        this.toastService.error('Email không đúng định dạng');
        return;
      }
    }

    // Validate phone number format (Vietnam) - common for both cases
    const phonePattern = /^(0[3|5|7|8|9])+([0-9]{8})\b/;
    if (!phonePattern.test(this.formData.phoneNumber)) {
      this.toastService.error('Số điện thoại không đúng định dạng');
      return;
    }

    this.updating = true;
    this.setError('');
    this.setSuccess('');
    this.cdr.detectChanges();
    
    // Enhanced validation for self-edit scenarios
    if (isUpdatingSelf || this.isSelfEdit) {
      // Additional validation for self-edit safety
      if (!this.user?.email) {
        this.toastService.error('Không thể xác định email hiện tại của tài khoản. Vui lòng thử lại sau.');
        this.updating = false;
        return;
      }
      
      // Đảm bảo role và status không thay đổi (chỉ hiển thị trong UI, không gửi API)
      this.formData.roleId = this.getRoleId(this.user?.role || 'USER');
      this.formData.status = this.user?.status || 'ACTIVE';
      
      // Bỏ các toast notifications không cần thiết để tránh spam
    }

    // Prepare request data - phân biệt rõ ràng giữa self-edit và admin-edit

    if (isUpdatingSelf || this.isSelfEdit) {
      // Nếu admin update chính mình -> THỬ USER PROFILE SERVICE TRƯỚC, FALLBACK VỀ ADMIN ENDPOINT
      // Giống như user bình thường update profile
      const updateProfileData: UpdateUserProfileRequest = {
        id: this.user.id,
        fullName: this.formData.fullName.trim(),
        phoneNumber: this.formData.phoneNumber.trim(),
        livingEnvironment: this.user?.livingEnvironment?.trim() || 'Không xác định',
        avatar: this.user?.avatarUrl || this.user?.profileImage || '',
        gender: this.formData.gender ? this.formData.gender.toUpperCase() : 'MALE'
      };
      
      // Thử UserProfileService trước, nếu lỗi thì fallback về admin endpoint
      this.userProfileService.updateUserProfile(updateProfileData).subscribe({
        next: (response: any) => {
          // Backend trả về ResponseData wrapper, cần extract data
          let profileData = response;
          if (response && response.data) {
            profileData = response.data;
          }
          
          this.toastService.success('✅ Cập nhật thông tin cá nhân thành công!');
          
          this.updating = false;
          this.cdr.detectChanges();
          
          // Reload user data to show updated info
          setTimeout(() => {
            this.loadUserDetail();
          }, 1000);
        },
        error: (error: any) => {
          // Nếu lỗi 404 (Profile not found) hoặc endpoint không tồn tại, fallback về admin endpoint
          if (error.status === 404 || error.status === 0 || error.status === 500) {
            // Profile endpoint not available or user profile not found, falling back to admin endpoint
            
            this.performFallbackUpdate();
          } else if (error.status === 400) {
            // Lỗi validation từ backend (ví dụ: livingEnvironment không hợp lệ)
            // Backend validation error, falling back to admin endpoint
            
            this.performFallbackUpdate();
          } else {
            // Xử lý lỗi khác từ UserProfileService
            this.handleProfileUpdateError(error);
          }
        }
      });
      
      return; // Exit early for self-edit
    }
    
    // CODE DƯỚI ĐÂY CHỈ CHẠY CHO ADMIN-EDIT (không phải self-edit)
    // Nếu admin update user khác -> SỬ DỤNG ADMIN ENDPOINT
    const updateData = {
      email: this.formData.email,
      fullName: this.formData.fullName,
      phoneNumber: this.formData.phoneNumber,
      gender: this.formData.gender ? this.formData.gender.toLowerCase() : 'male',
      roleId: this.formData.roleId,
      status: this.formData.status,
      livingEnvironment: this.user?.livingEnvironment?.trim() || 'Không xác định'
    };
    const apiUrl = `/api/admin/updateuser/${this.userId}`;
    
    // Xử lý API call cho admin-edit
    
    this.http.put<any>(apiUrl, updateData, { withCredentials: true }).subscribe({
      next: (response: any) => {
        this.toastService.success('✅ Cập nhật thông tin người dùng thành công!');
        
        this.updating = false;
        this.cdr.detectChanges();
        // Reload user data to show updated info
        setTimeout(() => {
          this.loadUserDetail();
        }, 1000);
      },
      error: (error: any) => {
        this.handleUpdateError(error);
      }
    });
  }

  private handleUpdateError(error: any) {
    let errorMessage = '';
    let showRetryOption = false;
    
    // Xử lý lỗi đặc biệt cho self-edit (sử dụng user profile endpoint)
    if (this.isSelfEdit && error.status === 400) {
      errorMessage = 'Không thể cập nhật thông tin. Vui lòng kiểm tra lại dữ liệu nhập vào. ';
    } else if (this.isSelfEdit && error.status === 403) {
      errorMessage = 'Bạn không có quyền cập nhật thông tin này. ';
    } else if (this.isSelfEdit && error.status === 500) {
      errorMessage = 'Lỗi server khi cập nhật profile. Vui lòng thử lại sau. ';
    } else if (error && typeof error.message === 'string' && error.message.trim()) {
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
      errorMessage = error?.error?.message || error?.userMessage || 'Không thể cập nhật thông tin. Vui lòng thử lại.';
    }
    
    this.toastService.error(errorMessage);
    this.updating = false;
    this.cdr.detectChanges();
    
    // Chỉ suggest alternative nếu thực sự cần thiết
    if (this.isSelfEdit && error.status >= 400 && error.status < 500) {
      setTimeout(() => {
        this.toastService.info('💡 Nếu vẫn gặp lỗi, bạn có thể thử chỉnh sửa từ trang Profile cá nhân.', 4000);
      }, 2000);
    }
  }

  private handleProfileUpdateError(error: any) {
    let errorMessage = '';
    
  // ...existing code...
    
    // Xử lý lỗi đặc biệt cho profile update (sử dụng UserProfileService)
    if (error.status === 0) {
      errorMessage = 'Không thể kết nối đến server. Vui lòng kiểm tra kết nối mạng.';
    } else if (error.status === 401) {
      errorMessage = 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.';
    } else if (error.status === 403) {
      errorMessage = 'Bạn không có quyền cập nhật thông tin này.';
    } else if (error.status === 404) {
      // Backend trả về "Profile not found for user ID: X"
      if (error.error && error.error.message) {
        errorMessage = `Không tìm thấy profile: ${error.error.message}`;
      } else {
        errorMessage = 'Không tìm thấy thông tin profile của người dùng.';
      }
    } else if (error.status === 400) {
      if (error.error && error.error.message) {
        errorMessage = `Dữ liệu không hợp lệ: ${error.error.message}`;
      } else {
        errorMessage = 'Dữ liệu không hợp lệ. Vui lòng kiểm tra lại.';
      }
    } else if (error.status === 500) {
      if (error.error && error.error.message) {
        errorMessage = `Lỗi server: ${error.error.message}`;
      } else {
        errorMessage = 'Lỗi server. Vui lòng thử lại sau.';
      }
    } else {
      if (error.error && error.error.message) {
        errorMessage = error.error.message;
      } else if (error.userMessage) {
        errorMessage = error.userMessage;
      } else {
        errorMessage = 'Không thể cập nhật thông tin. Vui lòng thử lại.';
      }
    }
    
    this.toastService.error(errorMessage);
    this.updating = false;
    this.cdr.detectChanges();
    
    // Suggest alternative for profile update errors
    if (error.status >= 400 && error.status < 500) {
      setTimeout(() => {
        this.toastService.info('💡 Nếu vẫn gặp lỗi, bạn có thể thử chỉnh sửa từ trang Profile cá nhân.', 4000);
      }, 2000);
    }
  }

  private performFallbackUpdate() {
    const fallbackData = {
      email: this.user?.email || '',
      fullName: this.formData.fullName.trim(),
      phoneNumber: this.formData.phoneNumber.trim(),
      gender: this.formData.gender ? this.formData.gender.toLowerCase() : 'male',
      roleId: this.getRoleId(this.user?.role || 'USER'),
      status: this.user?.status || 'ACTIVE',
      livingEnvironment: this.user?.livingEnvironment?.trim() || 'Không xác định'
    };
    
    const fallbackUrl = `/api/admin/updateuser/${this.userId}`;
    
    this.http.put<any>(fallbackUrl, fallbackData, { withCredentials: true }).subscribe({
      next: (fallbackResponse: any) => {
        this.toastService.success('✅ Cập nhật thông tin cá nhân thành công!');
        
        this.updating = false;
        this.cdr.detectChanges();
        
        // Reload user data to show updated info
        setTimeout(() => {
          this.loadUserDetail();
        }, 1000);
      },
      error: (fallbackError: any) => {
        this.handleUpdateError(fallbackError);
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
