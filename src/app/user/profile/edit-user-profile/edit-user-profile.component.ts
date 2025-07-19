import { Component, OnInit, ChangeDetectorRef, Inject, PLATFORM_ID, AfterViewInit } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { UserProfileService, UserProfile, UpdateUserProfileRequest } from '../view-user-profile/user-profile.service';
import { HttpClient } from '@angular/common/http';
import { JwtUserUtilService } from '../../../auth/jwt-user-util.service';
import { AuthDialogService } from '../../../auth/auth-dialog.service';
import { ToastService } from '../../../shared/toast/toast.service';
import { Router } from '@angular/router';
import { of } from 'rxjs';
import { catchError, finalize, tap } from 'rxjs/operators';
import { TopNavigatorComponent } from '../../../shared/top-navigator/index';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-edit-user-profile',
  standalone: true,
  imports: [FormsModule, TopNavigatorComponent, CommonModule],
  templateUrl: './edit-user-profile.html',
  styleUrls: ['./edit-user-profile.scss']
})
export class EditUserProfileComponent implements OnInit, AfterViewInit {
  user: Partial<UserProfile> = {};
  avatarPreview: string | null = null;
  selectedAvatarFile: File | null = null;
  loading = true;
  saving = false;
  saveMessage = '';
  saveError = '';
  avatarUploading = false;

  constructor(
    private userProfileService: UserProfileService,
    private jwtUserUtil: JwtUserUtilService,
    private authDialogService: AuthDialogService,
    private toastService: ToastService,
    private router: Router,
    private cdr: ChangeDetectorRef,
    private http: HttpClient,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {}

  ngOnInit() {
    // Load profile immediately on component init
    this.loadUserProfile();
  }

  ngAfterViewInit() {
    // Force load again after view init for SSR hydration
    if (isPlatformBrowser(this.platformId)) {
      setTimeout(() => {
        if (!this.user.email) {
          this.loadUserProfile();
        }
      }, 100);
    }
  }

  loadUserProfile() {
    this.loading = true;
    this.saveError = '';
    
    // Kiểm tra xem có token không
    const token = this.jwtUserUtil.getTokenInfo();
    if (!token) {
      this.saveError = 'Vui lòng đăng nhập để chỉnh sửa hồ sơ.';
      this.loading = false;
      // Không tự động hiển thị login dialog, để user tự quyết định
      return;
    }

    this.userProfileService.getUserProfile().subscribe({
      next: (profile) => {
        this.user = { ...profile };
        this.avatarPreview = profile.avatar;
        this.loading = false;
        // Force change detection
        this.cdr.markForCheck();
      },
      error: (error) => {
        if (error.status === 401) {
          this.saveError = 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.';
          this.toastService.error('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.');
          this.showLoginDialog();
        } else if (error.status === 403) {
          this.saveError = 'Không có quyền truy cập thông tin này.';
          this.toastService.error('Không có quyền truy cập thông tin này.');
        } else if (error.status === 404) {
          this.saveError = 'Không tìm thấy thông tin người dùng.';
          this.toastService.error('Không tìm thấy thông tin người dùng.');
        } else {
          this.saveError = 'Có lỗi xảy ra khi tải thông tin. Vui lòng thử lại.';
          this.toastService.error('Có lỗi xảy ra khi tải thông tin. Vui lòng thử lại.');
        }
        this.loading = false;
        this.cdr.markForCheck();
      }
    });
  }



  onAvatarChange(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      const file = input.files[0];
      if (file.size > 5 * 1024 * 1024) {
        this.toastService.error('Kích thước file quá lớn. Vui lòng chọn file nhỏ hơn 5MB.');
        this.selectedAvatarFile = null;
        return;
      }
      if (!file.type.match(/^image\/(jpeg|jpg|png|gif)$/)) {
        this.toastService.error('Định dạng file không hỗ trợ. Vui lòng chọn file JPG, PNG hoặc GIF.');
        this.selectedAvatarFile = null;
        return;
      }
      this.selectedAvatarFile = file;
      const reader = new FileReader();
      reader.onload = (e: any) => {
        this.avatarPreview = e.target.result;
        this.cdr.markForCheck();
      };
      reader.readAsDataURL(file);
    }
  }

  uploadAvatar() {
    if (!this.selectedAvatarFile) {
      this.toastService.error('Vui lòng chọn ảnh trước khi cập nhật.');
      return;
    }
    this.avatarUploading = true;
    const formData = new FormData();
    formData.append('avatar', this.selectedAvatarFile);
    this.http.post('http://localhost:8080/api/user/update-avatar', formData, { withCredentials: true }).subscribe({
      next: (response: any) => {
        this.toastService.success('Cập nhật ảnh đại diện thành công!');
        this.loadUserProfile();
        this.avatarUploading = false;
        this.cdr.markForCheck();
      },
      error: (error) => {
        let errorMessage = 'Có lỗi xảy ra khi cập nhật ảnh đại diện.';
        if (error.status === 401) {
          errorMessage = 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.';
          this.showLoginDialog();
        } else if (error.status === 403) {
          errorMessage = 'Không có quyền cập nhật ảnh đại diện.';
        } else if (error.error?.message) {
          errorMessage = error.error.message;
        }
        this.toastService.error(errorMessage);
        this.avatarUploading = false;
        this.cdr.markForCheck();
      }
    });
  }

  save() {
    // Clear previous messages
    this.saveError = '';
    this.saveMessage = '';

    // Validate required fields
    if (!this.user.id || !this.user.fullName || !this.user.phoneNumber) {
      this.saveError = 'Vui lòng điền đầy đủ thông tin bắt buộc (Họ tên, Số điện thoại)';
      this.toastService.error('Vui lòng điền đầy đủ thông tin bắt buộc (Họ tên, Số điện thoại)');
      this.cdr.markForCheck();
      this.cdr.detectChanges();
      return;
    }

    // Validate full name length
    if (this.user.fullName.trim().length < 2) {
      this.saveError = 'Họ tên phải có ít nhất 2 ký tự';
      this.toastService.error('Họ tên phải có ít nhất 2 ký tự');
      this.cdr.markForCheck();
      this.cdr.detectChanges();
      return;
    }

    // Validate phone number format
    const phoneRegex = /^[0-9]{10,11}$/;
    if (!phoneRegex.test(this.user.phoneNumber.trim())) {
      this.saveError = 'Số điện thoại không hợp lệ (10-11 chữ số)';
      this.toastService.error('Số điện thoại không hợp lệ (10-11 chữ số)');
      this.cdr.markForCheck();
      this.cdr.detectChanges();
      return;
    }

    // Validate gender
    const validGenders = ['MALE', 'FEMALE', 'OTHER'];
    let gender = this.user.gender;
    if (!gender || !validGenders.includes(gender)) {
      gender = 'MALE'; // Default value
    }

    this.saving = true;

    const updateData: UpdateUserProfileRequest = {
      id: this.user.id,
      fullName: this.user.fullName.trim(),
      phoneNumber: this.user.phoneNumber.trim(),
      livingEnvironment: this.user.livingEnvironment?.trim() || '',
      avatar: this.user.avatar || '',
      gender: gender
    };

    this.userProfileService.updateUserProfile(updateData).pipe(
      tap(response => {
        // Show toast success trước
        this.toastService.success('Cập nhật thông tin thành công!');
        
        // Cập nhật thông tin user từ response
        if (response && response.id) {
          this.user = { 
            ...this.user, 
            ...response 
          };
          this.avatarPreview = response.avatar;
          this.saveMessage = 'Cập nhật thông tin thành công!';
        }
        
        // Force change detection immediately
        this.cdr.markForCheck();
      }),
      catchError(error => {
        this.saveError = 'Có lỗi xảy ra khi cập nhật thông tin. Vui lòng thử lại.';
        
        if (error.status === 0) {
          this.saveError = 'Không thể kết nối đến server. Vui lòng kiểm tra kết nối mạng.';
        } else if (error.status === 401) {
          this.saveError = 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.';
          this.showLoginDialog();
        } else if (error.status === 403) {
          this.saveError = 'Không có quyền truy cập. Vui lòng kiểm tra quyền hạn.';
        } else if (error.status === 404) {
          this.saveError = 'API không tồn tại. Vui lòng liên hệ admin.';
        } else if (error.status >= 500) {
          this.saveError = 'Lỗi server. Vui lòng thử lại sau.';
        } else if (error.error?.message) {
          this.saveError = error.error.message;
        }
        
        this.toastService.error(this.saveError);
        // Force change detection immediately
        this.cdr.markForCheck();
        return of(null);
      }),
      finalize(() => {
        this.saving = false;
        // Force change detection immediately
        this.cdr.markForCheck();
      })
    ).subscribe();
  }

  // Real-time validation methods
  validateFullName() {
    if (this.user.fullName && this.user.fullName.trim().length > 0 && this.user.fullName.trim().length < 2) {
      this.toastService.warning('Họ tên phải có ít nhất 2 ký tự');
      this.cdr.markForCheck();
    }
  }

  validatePhoneNumber() {
    if (this.user.phoneNumber && this.user.phoneNumber.length > 0) {
      const phoneRegex = /^[0-9]{10,11}$/;
      if (!phoneRegex.test(this.user.phoneNumber)) {
        this.toastService.warning('Số điện thoại phải có 10-11 chữ số');
        this.cdr.markForCheck();
      }
    }
  }

  showLoginDialog() {
    this.authDialogService.openLoginDialog();
  }

  goToChangePassword() {
    this.router.navigate(['/profile/change-password']);
  }
}
