// ...existing code...
import { Component, Optional, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogRef } from '@angular/material/dialog';
import { FormsModule } from '@angular/forms';
import { NgIf } from '@angular/common';
import { AuthService, RegisterRequest, RegisterResponse } from '../auth.service';
import { AuthDialogService } from '../auth-dialog.service';
import { ToastService } from '../../shared/toast/toast.service';

@Component({
  selector: 'app-register-dialog',
  standalone: true,
  imports: [FormsModule, CommonModule, NgIf],
  templateUrl: './register-dialog.html',
  styleUrls: ['./register.scss']
})
export class RegisterDialogComponent {
  showPassword = false;
  showConfirmPassword = false;

  username = '';
  email = '';
  password = '';
  confirmPassword = '';
  fullName = '';
  phone = '';
  loading = false;
  errorMsg = '';
  successMsg = '';

  // Dịch các message lỗi phổ biến sang tiếng Việt
 private translateErrorMessage(msg: string): string {
  if (!msg) return '';

  const map: { [key: string]: string } = {
    'username already exists': 'Tên đăng nhập đã tồn tại.',
    'email already exists': 'Email đã được sử dụng.',
    'password and confirm password do not match': 'Mật khẩu và xác nhận mật khẩu không khớp.',
    'default role not found': 'Không tìm thấy vai trò mặc định.',
    'failed to create user profile': 'Tạo hồ sơ người dùng thất bại.',
    'đăng ký thành công. vui lòng kiểm tra emailđể xác thực tài khoản':
      'Đăng ký thành công. Vui lòng kiểm tra email để xác thực tài khoản.',
    'error registering user': 'Đăng ký thất bại. Vui lòng thử lại.',
  };

  const msgNorm = msg.trim().toLowerCase();

  // Khớp tuyệt đối
  if (map[msgNorm]) return map[msgNorm];

  // Khớp một phần
  for (const key of Object.keys(map)) {
    if (msgNorm.includes(key)) return map[key];
  }

  return msg; // Không khớp thì trả nguyên bản
}

  constructor(
    private authService: AuthService,
    private cdRef: ChangeDetectorRef,
    private authDialogService: AuthDialogService,
    private toast: ToastService,
    @Optional() private dialogRef?: MatDialogRef<RegisterDialogComponent>
  ) {}

  close() {
    if (this.dialogRef) {
      this.dialogRef.close();
    }
  }

  onSubmit() {
    this.errorMsg = '';
    this.successMsg = '';
    if (!this.username || !this.fullName || !this.phone || !this.email || !this.password || !this.confirmPassword) {
      this.toast.error('Vui lòng nhập đầy đủ thông tin.');
      this.loading = false;
      this.cdRef.detectChanges();
      return;
    }
    this.loading = true;
    this.cdRef.detectChanges();
    const registerData: RegisterRequest = {
      username: this.username,
      fullName: this.fullName,
      phone: this.phone,
      email: this.email,
      password: this.password,
      confirmPassword: this.confirmPassword
    };
    this.authService.register(registerData).subscribe({
      next: (res) => {
        this.toast.success(res.message || 'Đăng ký thành công! Vui lòng kiểm tra email để xác thực tài khoản.');
        this.loading = false;
        this.cdRef.detectChanges();
        if (this.dialogRef) {
          this.dialogRef.afterClosed().subscribe(() => {
            this.authDialogService.openVerifyEmailDialog(this.email);
          });
          this.dialogRef.close();
        } else {
          this.authDialogService.openVerifyEmailDialog(this.email);
        }
      },
      error: (err) => {
        this.loading = false;
        // Lấy message chi tiết nhất từ err.error hoặc err.message
        let apiMsg = '';
        if (err && err.error) {
          if (typeof err.error === 'string') {
            apiMsg = err.error;
          } else if (typeof err.error === 'object') {
            apiMsg = err.error.message || err.error.error || err.error.detail || '';
            if (!apiMsg) {
              for (const key of Object.keys(err.error)) {
                if (typeof err.error[key] === 'string') {
                  apiMsg = err.error[key];
                  break;
                }
              }
            }
            if (!apiMsg) {
              apiMsg = JSON.stringify(err.error);
            }
          }
        }
        // Nếu vẫn chưa có, lấy err.message nếu là string và khác rỗng
        if (!apiMsg && err && typeof err.message === 'string' && err.message.trim()) {
          apiMsg = err.message;
        }
        if (apiMsg) {
          this.toast.error(this.translateErrorMessage(apiMsg));
        } else if (err && err.status) {
          this.toast.error('Đăng ký thất bại (mã lỗi: ' + err.status + ')');
        } else {
          this.toast.error('Đăng ký thất bại!');
        }
        this.cdRef.detectChanges();
      }
    });
  }

  openLoginDialog() {
    if (this.dialogRef) {
      this.dialogRef.afterClosed().subscribe(() => {
        this.authDialogService.openLoginDialog();
      });
      this.dialogRef.close();
    } else {
      this.authDialogService.openLoginDialog();
    }
  }
}
