import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { TopNavigatorComponent } from '../../../../shared/top-navigator/index';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
// import { UserProfileService } from '../view-user-profile/user-profile.service';
import { HttpClient } from '@angular/common/http';
import { JwtUserUtilService } from '../../../../auth/jwt-user-util.service';
import { AuthDialogService } from '../../../../auth/auth-dialog.service';
import { ToastService } from '../../../../shared/toast/toast.service';
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
    private jwtUserUtil: JwtUserUtilService,
    private authDialogService: AuthDialogService,
    private toastService: ToastService,
    private cdr: ChangeDetectorRef,
    private http: HttpClient
  ) {}


  private translateErrorMessage(msg: string): string {
  if (!msg) return '';

  const map: { [key: string]: string } = {
    'user not found': 'Không tìm thấy người dùng.',
    'current password is incorrect': 'Mật khẩu hiện tại không đúng.',
    'current password is incorrect. please try again.': 'Mật khẩu hiện tại không đúng.',
    'new password and confirm password do not match': 'Mật khẩu mới và xác nhận mật khẩu không khớp.',
    'new password must be different from current password': 'Mật khẩu mới phải khác mật khẩu cũ.',
    'password strength validation failed': 'Mật khẩu mới không đủ mạnh.',
    'password changed successfully': 'Đổi mật khẩu thành công.',
    'error changing password': 'Có lỗi xảy ra khi đổi mật khẩu.',
  'rate limit exceeded. please try again later.': 'Bạn đã thay đổi quá nhiều lần trong 5 phút, vui lòng đợi sau 5 phút rồi thử lại.',
  };

  const msgNorm = msg.trim().toLowerCase();

  // Khớp tuyệt đối
  if (map[msgNorm]) return map[msgNorm];

  // Khớp một phần
  for (const key of Object.keys(map)) {
    if (msgNorm.includes(key)) return map[key];
  }

  return msg; // Trả về nguyên bản nếu không khớp
}


  ngOnInit() {
    // Không tự động hiển thị login dialog
    // Chỉ kiểm tra authentication khi user thực sự thực hiện action
  }

  private showLoginDialog() {
    this.authDialogService.openLoginDialog();
    
    // Không tự động redirect, để user quyết định
    // Nếu user đăng nhập thành công, họ có thể tiếp tục sử dụng trang này
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

    // Validate password strength: tối thiểu 8 ký tự, có hoa, thường, số, ký tự đặc biệt, không khoảng trắng
    const passwordRegex = /^(?=.*[0-9])(?=.*[a-z])(?=.*[A-Z])(?=.*[@#$%^&+=!])(?=\S+$).{8,}$/;
    if (!passwordRegex.test(this.newPassword)) {
      this.error = 'Mật khẩu mới phải có ít nhất 8 ký tự, bao gồm chữ hoa, chữ thường, số, ký tự đặc biệt và không chứa khoảng trắng';
      this.toastService.error('Mật khẩu mới phải có ít nhất 8 ký tự, bao gồm chữ hoa, chữ thường, số, ký tự đặc biệt và không chứa khoảng trắng');
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

    // Format JSON đúng theo yêu cầu backend (không truyền userId)
    const passwordData = {
      currentPassword: this.oldPassword,
      newPassword: this.newPassword,
      confirmPassword: this.confirmPassword
    };

  const authToken = this.jwtUserUtil.getAuthToken();
    this.http.post('/api/auth/change-password', passwordData, {
      withCredentials: true,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': authToken ? `Bearer ${authToken}` : ''
      }
    }).pipe(
      tap(response => {
        this.toastService.success('Đổi mật khẩu thành công!');
        // Clear form and navigate after success
        setTimeout(() => {
          this.clearForm();
          this.router.navigate(['/view-user-profile']);
        }, 1500);
        // Trigger change detection ngay lập tức
        setTimeout(() => this.cdr.detectChanges(), 0);
      }),
     catchError(error => {
      let errorMessage = '';

      // Ưu tiên lấy message từ error.error.message (HttpErrorResponse), nếu không có thì lấy error.message (Error object từ interceptor)
      if (error?.error?.message) {
        errorMessage = this.translateErrorMessage(error.error.message);
      } else if (error?.message) {
        errorMessage = this.translateErrorMessage(error.message);
      } else if (error.status === 0) {
        errorMessage = 'Không thể kết nối đến server. Vui lòng kiểm tra kết nối mạng.';
      } else {
        errorMessage = 'Có lỗi xảy ra khi đổi mật khẩu.';
      }

      if (error.status === 401) {
        errorMessage = 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.';
        this.showLoginDialog();
      }

  this.toastService.error(errorMessage);
  // Không set this.error để không hiện lỗi dưới chân
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
  this.router.navigate(['/view-user-profile']);
  }
}
