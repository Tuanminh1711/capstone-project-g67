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
  imports: [FormsModule, CommonModule],
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
  // Lỗi từ backend logic
  'username already exists': 'Tên đăng nhập đã tồn tại.',
  'email already exists': 'Email đã được sử dụng.',
  'password and confirm password do not match': 'Mật khẩu và xác nhận mật khẩu không khớp.',
  'default role not found': 'Không tìm thấy vai trò mặc định.',
  'failed to create user profile': 'Tạo hồ sơ người dùng thất bại.',
  'đăng ký thành công. vui lòng kiểm tra emailđể xác thực tài khoản':
    'Đăng ký thành công. Vui lòng kiểm tra email để xác thực tài khoản.',
  'error registering user': 'Đăng ký thất bại. Vui lòng thử lại.',

  // Lỗi validation từ DTO
  'Username is required': 'Vui lòng nhập tên đăng nhập.',
  'Username must be between 3 and 50 characters': 'Tên đăng nhập phải từ 3 đến 50 ký tự.',
  'Password is required': 'Vui lòng nhập mật khẩu.',
  'password must be at least 8 characters': 'Mật khẩu phải có ít nhất 8 ký tự.',
  'Password must contain at least 8 characters, including uppercase, lowercase, number and special character':
    'Mật khẩu phải bao gồm ít nhất 8 ký tự, có chữ hoa, chữ thường, số và ký tự đặc biệt.',
  'Confirm password is required': 'Vui lòng nhập xác nhận mật khẩu.',
  'Full name is required': 'Vui lòng nhập họ và tên.',
  'Full name must not exceed 100 characters': 'Họ và tên không được vượt quá 100 ký tự.',
  'phone invalid format': 'Số điện thoại không đúng định dạng.',
  'email invalid format': 'Email không đúng định dạng.'
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
    // Validate required
    if (!this.username || !this.fullName || !this.phone || !this.email || !this.password || !this.confirmPassword) {
      this.toast.error('Vui lòng nhập đầy đủ thông tin.');
      this.loading = false;
      this.cdRef.detectChanges();
      return;
    }
    // Validate username: không chứa dấu cách
    if (this.username.includes(' ')) {
      this.toast.error('Tên đăng nhập không được chứa dấu cách!');
      this.loading = false;
      this.cdRef.detectChanges();
      return;
    }
    // Validate phone: chỉ chứa số
    if (!/^\d{9,15}$/.test(this.phone)) {
      this.toast.error('Số điện thoại chỉ được chứa số và từ 9-15 ký tự!');
      this.loading = false;
      this.cdRef.detectChanges();
      return;
    }
    // Validate fullName: chỉ chứa ký tự chữ và khoảng trắng
    if (!/^[a-zA-ZÀ-ỹ\s]+$/u.test(this.fullName.trim())) {
      this.toast.error('Họ và tên chỉ được chứa ký tự chữ, không chứa số hoặc ký tự đặc biệt!');
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
