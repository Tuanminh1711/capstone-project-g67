import { Component } from '@angular/core';
import { AuthService } from '../auth.service';
import { ToastService } from '../../shared/toast.service';
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
  username = '';
  password = '';
  errorMsg = '';
  successMsg = '';
  loading = false;

  constructor(
    private authService: AuthService,
    private toast: ToastService,
    private router: Router
  ) {}

  onSubmit() {
    if (!this.username || !this.password) {
      this.errorMsg = 'Vui lòng nhập đầy đủ thông tin';
      return;
    }
    this.loading = true;
    this.errorMsg = '';
    this.successMsg = '';
    this.authService.loginAdmin({
      username: this.username,
      password: this.password
    }).subscribe({
      next: (res: any) => {
        this.loading = false;
        // Nếu backend trả về token, lưu vào cookie bảo mật
        if (res.token) {
          // Lưu JWT vào cookie (7 ngày, SameSite=Lax, không Secure ở dev)
          // Đảm bảo CookieService đã được import đúng
          import('../../auth/cookie.service').then(({ CookieService }) => {
            const cookieService = new CookieService();
            cookieService.setAuthToken(res.token, 7);
          });
        }
        this.successMsg = res.message || 'Đăng nhập thành công!';
        this.toast.success(this.successMsg);
        this.router.navigate(['/admin']);
      },
      error: (err: any) => {
        this.loading = false;
        this.errorMsg = err?.error?.message || 'Đăng nhập thất bại!';
        this.toast.error(this.errorMsg);
      }
    });
  }
}
