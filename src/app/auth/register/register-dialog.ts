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
      'Password must be at least 6 characters': 'Mật khẩu phải có ít nhất 6 ký tự',
      'Passwords do not match': 'Mật khẩu xác nhận không khớp',
      'Username already exists': 'Tên đăng nhập đã tồn tại',
      'Email already exists': 'Email đã được sử dụng',
      'Invalid email format': 'Định dạng email không hợp lệ',
      'Invalid Payload': 'Dữ liệu gửi lên không hợp lệ',
      'User not found': 'Không tìm thấy người dùng',
      'Invalid username or password': 'Tên đăng nhập hoặc mật khẩu không đúng',
      'Account is not verified': 'Tài khoản chưa được xác thực',
      'Account is locked': 'Tài khoản đã bị khóa',
      'Phone number already exists': 'Số điện thoại đã được sử dụng',
      // Thêm các lỗi khác nếu cần
    };
    // Tìm lỗi khớp tuyệt đối
    if (map[msg]) return map[msg];
    // Tìm lỗi khớp một phần (chứa chuỗi)
    for (const key of Object.keys(map)) {
      if (msg.includes(key)) return map[key];
    }
    return msg;
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
