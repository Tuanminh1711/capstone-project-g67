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
  // Forgot password logic
  showForgotPassword = false;
  forgotStep = 1;
  forgotEmail = '';
  pinDigits = [0,1,2,3,4,5];
  pinCode: string[] = ['', '', '', '', '', ''];
  newPassword = '';
  showNewPassword = false;
  resetCode = '';

  sendResetCode() {}
  resetPassword() {}
  verifyResetCode() {}
  onPinInput(event: any, i: number) {}
  onPinKeydown(event: any, i: number) {}
  // Dịch các message lỗi phổ biến sang tiếng Việt
  private translateErrorMessage(msg: string): string {
    if (!msg) return '';
   const loginErrorMap: { [key: string]: string } = {
  'username wrong!': 'Tên đăng nhập không đúng.',
  'password wrong!': 'Mật khẩu không đúng.',
  'password wrong': 'Mật khẩu không đúng.',
  'tài khoản của bạn đã bị khóa vĩnh viễn do vi phạm chính sách.':
    'Tài khoản của bạn đã bị khóa vĩnh viễn do vi phạm chính sách.',
  'tài khoản đã bị khóa vĩnh viễn do vi phạm chính sách.':
    'Tài khoản đã bị khóa vĩnh viễn do vi phạm chính sách.',
  'chỉ tài khoản người dùng (user, vip) mới được phép đăng nhập ở đây.':
    'Chỉ tài khoản người dùng (USER, VIP) mới được phép đăng nhập tại đây.',
  'chỉ tài khoản admin hoặc staff mới được phép đăng nhập ở đây.':
    'Chỉ tài khoản ADMIN hoặc STAFF mới được phép đăng nhập tại đây.',
  'chỉ tài khoản expert hoặc staff mới được phép đăng nhập ở đây.':
    'Chỉ tài khoản EXPERT hoặc STAFF mới được phép đăng nhập tại đây.',
  'tài khoản của bạn chưa xác thực, vui lòng kiểm tra email hoặc gửi lại mã xác minh.':
    'Tài khoản của bạn chưa xác thực. Vui lòng kiểm tra email hoặc gửi lại mã xác minh.',
};

    const msgNorm = msg.trim().toLowerCase();
    if (loginErrorMap[msgNorm]) return loginErrorMap[msgNorm];
    for (const key of Object.keys(loginErrorMap)) {
      if (msgNorm.includes(key)) return loginErrorMap[key];
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
              if (role === 'expert') {
                this.router.navigate(['/expert/welcome']);
              } else if (role === 'admin' || role === 'staff') {
                this.router.navigate(['/admin']);
              } else {
                // Không cho phép đăng nhập nếu không có role hợp lệ
                this.toast.error('Tài khoản không có quyền truy cập!');
                this.authService.logout(false);
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
          
          if (role === 'expert') {
            this.router.navigate(['/expert/welcome']);
          } else if (role === 'admin' || role === 'staff') {
            this.router.navigate(['/admin']);
          } else {
            // Không cho phép đăng nhập nếu không có role hợp lệ
            this.toast.error('Tài khoản không có quyền truy cập!');
            this.authService.logout(false);
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
