import { Component, ChangeDetectorRef } from '@angular/core';
import { AuthService } from '../auth.service';
import { ToastService } from '../../shared/toast/toast.service';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-login-admin-page',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './login-admin-page.html',
  styleUrls: ['./login-admin-page.scss']
})
export class LoginAdminPageComponent {
  showNewPassword = false;

  verifyResetCode() {
    if (this.resetCode.length !== 6) {
      this.toast.error('Mã xác nhận phải đủ 6 số.');
      return;
    }
    this.authService.verifyResetCode(this.forgotEmail, this.resetCode).subscribe({
      next: () => {
        this.toast.success('Mã xác nhận hợp lệ! Nhập mật khẩu mới.');
        this.showNewPassword = true;
        this.cdr.detectChanges();
      },
      error: err => {
        this.toast.error(err.error?.message || 'Mã xác nhận không hợp lệ hoặc đã hết hạn.');
        this.showNewPassword = false;
        this.cdr.detectChanges();
      }
    });
  }
  pinDigits = Array(6).fill(0);
  pinCode: string[] = ['', '', '', '', '', ''];

  // Xử lý nhập mã pin từng ô
  onPinInput(event: any, idx: number) {
    const input = event.target;
    const val = input.value.replace(/[^0-9]/g, '');
    this.pinCode[idx] = val;
    if (val && idx < this.pinDigits.length - 1) {
      const next = input.parentElement.querySelectorAll('.pin-input')[idx + 1];
      if (next) next.focus();
    }
    this.resetCode = this.pinCode.join('');
  }

  onPinKeydown(event: KeyboardEvent, idx: number) {
    const input = event.target as HTMLInputElement;
    if (event.key === 'Backspace' && !input.value && idx > 0) {
      const prev = input.parentElement!.querySelectorAll('.pin-input')[idx - 1];
      if (prev) (prev as HTMLInputElement).focus();
    }
  }
  // Dịch các message lỗi phổ biến sang tiếng Việt
  showForgotPassword = false;
  forgotEmail = '';
  resetCode = '';
  newPassword = '';
  forgotStep = 1;
  forgotMsg = '';

  sendResetCode() {
    if (!this.forgotEmail) {
      this.forgotMsg = 'Vui lòng nhập email.';
      return;
    }
    this.forgotMsg = '';
    this.authService.forgotPassword(this.forgotEmail).subscribe({
      next: () => {
        this.forgotMsg = 'Đã gửi mã xác nhận tới email! Vui lòng nhập mã xác nhận.';
        this.forgotStep = 2;
        this.cdr.detectChanges();
      },
      error: err => {
        this.forgotMsg = err.error?.message || 'Gửi mã thất bại';
      }
    });
  }

  resetPassword() {
    if (!this.forgotEmail || !this.resetCode || !this.newPassword) {
      this.toast.error('Vui lòng nhập đủ thông tin.');
      return;
    }
    this.authService.resetPassword(this.forgotEmail, this.resetCode, this.newPassword).subscribe({
      next: () => {
        this.toast.success('Đặt lại mật khẩu thành công!');
        this.forgotStep = 1;
        this.showForgotPassword = false;
        this.showNewPassword = false;
        this.newPassword = '';
        this.pinCode = ['', '', '', '', '', ''];
        this.router.navigate(['/login-admin']);
      },
      error: err => {
        this.toast.error(err.error?.message || 'Đặt lại mật khẩu thất bại');
      }
    });
  }
  // Thêm hàm gọi verify-reset-code API
  // (đã dùng ở trên)

  private translateErrorMessage(msg: string): string {
    if (!msg) return '';
    const map: { [key: string]: string } = {
      'password must be at least 6 characters': 'Mật khẩu phải có ít nhất 6 ký tự',
      'passwords do not match': 'Mật khẩu xác nhận không khớp',
      'username already exists': 'Tên đăng nhập đã tồn tại',
      'email already exists': 'Email đã được sử dụng',
      'invalid email format': 'Định dạng email không hợp lệ',
      'invalid payload': 'Dữ liệu gửi lên không hợp lệ',
      'user not found': 'Không tìm thấy người dùng',
      'invalid username or password': 'Tên đăng nhập hoặc mật khẩu không đúng',
      'account is not verified': 'Tài khoản chưa được xác thực',
      'account is locked': 'Tài khoản đã bị khóa',
      'phone number already exists': 'Số điện thoại đã được sử dụng',
      'password wrong!': 'Mật khẩu không đúng!',
      'username wrong!': 'Tên đăng nhập không đúng!',
      // Thêm các lỗi khác nếu cần
    };
    const msgNorm = msg.trim().toLowerCase();
    if (map[msgNorm]) return map[msgNorm];
    for (const key of Object.keys(map)) {
      if (msgNorm.includes(key)) return map[key];
    }
    return msg;
  }
  username = '';
  password = '';
  successMsg = '';
  loading = false;

  constructor(
    private authService: AuthService,
    private toast: ToastService,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {}

  onSubmit() {
    if (!this.username || !this.password) {
      this.toast.error('Vui lòng nhập đầy đủ thông tin');
      return;
    }
    this.loading = true;
    this.successMsg = '';
    this.authService.loginAdmin({
      username: this.username,
      password: this.password
    }).subscribe({
      next: (res: any) => {
        this.loading = false;
        // Nếu backend trả về token, lưu vào cookie bảo mật
        if (res.token) {
          import('../../auth/cookie.service').then(({ CookieService }) => {
            const cookieService = new CookieService();
            cookieService.setAuthToken(res.token, 7);
            // Đảm bảo token đã set xong mới chuyển trang
            setTimeout(() => {
              this.successMsg = res.message || 'Đăng nhập thành công!';
              // Debug: log role, res và userId từ token
              console.log('[DEBUG] Login response:', res);
              let role = '';
              if (res.role) {
                role = res.role.toLowerCase();
              } else if (res.user && res.user.role) {
                role = res.user.role.toLowerCase();
              }
              import('../../auth/jwt-user-util.service').then(({ JwtUserUtilService }) => {
                const jwtUtil = new JwtUserUtilService(cookieService);
                const userIdFromToken = jwtUtil.getUserIdFromToken();
                console.log('[DEBUG] userId from token:', userIdFromToken);
              });
              console.log('[DEBUG] Role:', role);
              this.cdr.detectChanges();
              this.toast.success(this.successMsg);
              this.loading = false;
              this.cdr.detectChanges();
              
              // Kiểm tra role để chuyển hướng đến trang welcome tương ứng
              if (role === 'expert' ) {
                this.router.navigate(['/expert/welcome']);
              } else if (role === 'admin'|| role === 'staff') {
                this.router.navigate(['/admin']);
              } else {
                // Default fallback cho các role khác
                this.router.navigate(['/admin']);
              }
            }, 150);
          });
        } else {
          this.successMsg = res.message || 'Đăng nhập thành công!';
          this.cdr.detectChanges();
          this.toast.success(this.successMsg);
          this.loading = false;
          this.cdr.detectChanges();
          
          // Kiểm tra role từ response để chuyển hướng
          let role = '';
          if (res.role) {
            role = res.role.toLowerCase();
          } else if (res.user && res.user.role) {
            role = res.user.role.toLowerCase();
          }
          
          if (role === 'expert' || role === 'staff') {
            this.router.navigate(['/expert/welcome']);
          } else if (role === 'admin') {
            this.router.navigate(['/admin']);
          } else {
            this.router.navigate(['/admin']);
          }
        }
      },
      error: (err: any) => {
        this.loading = false;
        this.successMsg = '';
        this.cdr.detectChanges();
        let msg = '';
        if (err && err.error && err.error.message) {
          msg = err.error.message;
        } else if (err && err.error && typeof err.error === 'string') {
          msg = err.error;
        }
        if (!msg && err && typeof err.message === 'string' && err.message.trim()) {
          msg = err.message;
        }
        this.toast.error(this.translateErrorMessage(msg || 'Đăng nhập thất bại!'));
      }
    });
  }
}
