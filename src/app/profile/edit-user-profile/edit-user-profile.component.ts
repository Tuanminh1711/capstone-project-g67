import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { TopNavigatorComponent } from '../../shared/top-navigator/index';
import { FormsModule } from '@angular/forms';
import { UserProfileService, UserProfile, UpdateUserProfileRequest } from '../view-user-profile/user-profile.service';
import { JwtUserUtilService } from '../../auth/jwt-user-util.service';
import { AuthDialogService } from '../../auth/auth-dialog.service';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { of, throwError } from 'rxjs';
import { catchError, finalize, tap } from 'rxjs/operators';

@Component({
  selector: 'app-edit-user-profile',
  standalone: true,
  imports: [TopNavigatorComponent, FormsModule, CommonModule],
  templateUrl: './edit-user-profile.html',
  styleUrl: './edit-user-profile.scss'
})
export class EditUserProfileComponent implements OnInit {
  user: Partial<UserProfile> = {};
  avatarPreview: string | null = null;
  loading = true;
  saving = false;
  saveMessage = '';
  saveError = '';
  avatarUploading = false;

  constructor(
    private userProfileService: UserProfileService,
    private jwtUserUtil: JwtUserUtilService,
    private authDialogService: AuthDialogService,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit() {
    this.loadUserProfile();
  }

  loadUserProfile() {
    this.loading = true;
    this.saveError = '';
    
    const userId = this.jwtUserUtil.getUserIdFromToken();
    
    if (!userId) {
      this.saveError = 'Vui lòng đăng nhập để chỉnh sửa hồ sơ.';
      this.loading = false;
      // Không tự động hiển thị login dialog, để user tự quyết định
      return;
    }

    this.userProfileService.getUserProfile(Number(userId)).subscribe({
      next: (profile) => {
        this.user = { ...profile };
        this.avatarPreview = profile.avatar;
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: (error) => {
        if (error.status === 401) {
          this.saveError = 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.';
          this.showLoginDialog();
        } else if (error.status === 403) {
          this.saveError = 'Không có quyền truy cập thông tin này.';
        } else if (error.status === 404) {
          this.saveError = 'Không tìm thấy thông tin người dùng.';
        } else {
          this.saveError = 'Có lỗi xảy ra khi tải thông tin. Vui lòng thử lại.';
        }
        this.loading = false;
        this.cdr.detectChanges();
      }
    });
  }

  onAvatarChange(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      const file = input.files[0];
      
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        this.saveError = 'Kích thước file quá lớn. Vui lòng chọn file nhỏ hơn 5MB.';
        return;
      }
      
      // Validate file type
      if (!file.type.match(/^image\/(jpeg|jpg|png|gif)$/)) {
        this.saveError = 'Định dạng file không hỗ trợ. Vui lòng chọn file JPG, PNG hoặc GIF.';
        return;
      }
      
      this.avatarUploading = true;
      this.saveError = '';
      
      const reader = new FileReader();
      reader.onload = (e: any) => {
        this.avatarPreview = e.target.result;
        this.user.avatar = e.target.result;
        this.avatarUploading = false;
        this.cdr.detectChanges();
      };
      reader.onerror = () => {
        this.saveError = 'Có lỗi khi đọc file ảnh. Vui lòng thử lại.';
        this.avatarUploading = false;
        this.cdr.detectChanges();
      };
      reader.readAsDataURL(file);
    }
  }

  save() {
    if (!this.user.id || !this.user.fullName || !this.user.phoneNumber) {
      this.saveError = 'Vui lòng điền đầy đủ thông tin bắt buộc (Họ tên, Số điện thoại)';
      this.saveMessage = '';
      return;
    }

    // Validate gender
    const validGenders = ['MALE', 'FEMALE', 'OTHER'];
    let gender = this.user.gender;
    if (!gender || !validGenders.includes(gender)) {
      gender = 'MALE'; // Default value
    }

    this.saving = true;
    this.saveError = '';
    this.saveMessage = '';

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
        console.log('Update profile successful:', response);
        
        // Cập nhật thông tin user từ response
        if (response && response.id) {
          this.user = { 
            ...this.user, 
            ...response 
          };
          this.avatarPreview = response.avatar;
          this.saveMessage = 'Cập nhật thông tin thành công!';
        }
      }),
      catchError(error => {
        console.error('Error updating profile:', error);
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
        
        this.cdr.detectChanges();
        return of(null);
      }),
      finalize(() => {
        this.saving = false;
        this.cdr.detectChanges();
      })
    ).subscribe();
  }

  showLoginDialog() {
    console.log('Opening login dialog for edit profile');
    this.authDialogService.openLoginDialog();
    console.log('Login dialog opened, waiting for user action');
  }

  goToChangePassword() {
    this.router.navigate(['/profile/change-password']);
  }
}
