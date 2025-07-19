import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { TopNavigatorComponent } from '../../shared/top-navigator/index';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { UserProfileService } from '../view-user-profile/user-profile.service';
import { JwtUserUtilService } from '../../auth/jwt-user-util.service';
import { AuthDialogService } from '../../auth/auth-dialog.service';
import { ToastService } from '../../shared/toast/toast.service';
import { catchError, finalize, tap } from 'rxjs/operators';
import { of } from 'rxjs';

@Component({
  selector: 'app-change-password',
  standalone: true,
  imports: [TopNavigatorComponent, FormsModule, CommonModule],
  templateUrl: './change-password.html',
  styleUrl: './change-password.scss'
})
export class ChangePasswordComponent implements OnInit {
  oldPassword = '';
  newPassword = '';
  confirmPassword = '';
  loading = false;
  message = '';
  error = '';
  showOldPassword = false;
  showNewPassword = false;
  showConfirmPassword = false;

  constructor(
    private router: Router,
    private userProfileService: UserProfileService,
    private jwtUserUtil: JwtUserUtilService,
    private authDialogService: AuthDialogService,
    private toastService: ToastService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit() {
    // Không tự động hiển thị login dialog
    // Chỉ kiểm tra authentication khi user thực sự thực hiện action
    console.log('Change password component initialized');
  }

  private showLoginDialog() {
    console.log('Opening login dialog');
    this.authDialogService.openLoginDialog();
    
    // Không tự động redirect, để user quyết định
    // Nếu user đăng nhập thành công, họ có thể tiếp tục sử dụng trang này
    console.log('Login dialog opened, waiting for user action');
  }

  togglePasswordVisibility(field: 'old' | 'new' | 'confirm') {
    switch (field) {
      case 'old':
        this.showOldPassword = !this.showOldPassword;
        break;
      case 'new':
        this.showNewPassword = !this.showNewPassword;
        break;
      case 'confirm':
        this.showConfirmPassword = !this.showConfirmPassword;
        break;
    }
  }

  // Real-time validation for password matching
  get passwordsMatch(): boolean {
    return this.newPassword === this.confirmPassword || this.confirmPassword === '';
  }

  // Check if new password is different from old password
  get passwordsDifferent(): boolean {
    return this.oldPassword !== this.newPassword || this.newPassword === '';
  }

  validatePasswords(): boolean {
    // Clear previous errors
    this.error = '';

    if (!this.oldPassword || !this.newPassword || !this.confirmPassword) {
      this.error = 'Vui lòng điền đầy đủ tất cả các trường';
      this.toastService.error('Vui lòng điền đầy đủ tất cả các trường');
      setTimeout(() => this.cdr.detectChanges(), 0);
      return false;
    }

    if (this.newPassword.length < 6) {
      this.error = 'Mật khẩu mới phải có ít nhất 6 ký tự';
      this.toastService.error('Mật khẩu mới phải có ít nhất 6 ký tự');
      setTimeout(() => this.cdr.detectChanges(), 0);
      return false;
    }

    if (this.newPassword !== this.confirmPassword) {
      this.error = 'Mật khẩu mới và xác nhận mật khẩu không khớp';
      this.toastService.error('Mật khẩu mới và xác nhận mật khẩu không khớp');
      setTimeout(() => this.cdr.detectChanges(), 0);
      return false;
    }

    if (this.oldPassword === this.newPassword) {
      this.error = 'Mật khẩu mới phải khác mật khẩu cũ';
      this.toastService.error('Mật khẩu mới phải khác mật khẩu cũ');
      setTimeout(() => this.cdr.detectChanges(), 0);
      return false;
    }

    return true;
  }

  changePassword() {
    this.error = '';
    this.message = '';

    if (!this.validatePasswords()) {
      return;
    }

    // Kiểm tra JWT token trước khi gửi request
    const token = this.jwtUserUtil.getTokenInfo();
    if (!token) {
      this.error = 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.';
      this.toastService.error('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.');
      setTimeout(() => this.cdr.detectChanges(), 0);
      this.showLoginDialog();
      return;
    }

    this.loading = true;

    // Format JSON đúng theo yêu cầu backend
    const passwordData = {
      currentPassword: this.oldPassword,
      newPassword: this.newPassword,
      confirmPassword: this.confirmPassword
    };

    this.userProfileService.changePassword(passwordData).pipe(
      tap(response => {
        this.toastService.success('Đổi mật khẩu thành công!');
        
        // Clear form and navigate after success
        setTimeout(() => {
          this.clearForm();
          this.router.navigate(['/profile/edit']);
        }, 1500);
        
        // Trigger change detection ngay lập tức
        setTimeout(() => this.cdr.detectChanges(), 0);
      }),
      catchError(error => {
        let errorMessage = 'Có lỗi xảy ra khi đổi mật khẩu. Vui lòng thử lại.';
        
        // Xử lý lỗi theo status code
        if (error.status === 400) {
          errorMessage = 'Mật khẩu hiện tại không đúng.';
        } else if (error.status === 401) {
          errorMessage = 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.';
          this.showLoginDialog();
        } else if (error.status === 403) {
          errorMessage = 'Bạn không có quyền thực hiện hành động này.';
        } else if (error.status === 0) {
          errorMessage = 'Không thể kết nối đến server. Vui lòng kiểm tra kết nối mạng.';
        } else if (error.status === 500) {
          errorMessage = 'Lỗi server. Vui lòng thử lại sau.';
        } else if (error.userMessage) {
          errorMessage = error.userMessage;
        }
        
        this.toastService.error(errorMessage);
        this.error = errorMessage;
        // Trigger change detection ngay lập tức
        setTimeout(() => this.cdr.detectChanges(), 0);
        return of(null);
      }),
      finalize(() => {
        this.loading = false;
        // Trigger change detection ngay lập tức
        setTimeout(() => this.cdr.detectChanges(), 0);
      })
    ).subscribe();
  }

  clearForm() {
    this.oldPassword = '';
    this.newPassword = '';
    this.confirmPassword = '';
    this.message = '';
    this.error = '';
  }

  goBack() {
    this.router.navigate(['/profile/edit']);
  }
}
