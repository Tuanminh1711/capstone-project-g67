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
  // Dịch các message lỗi phổ biến sang tiếng Việt
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
