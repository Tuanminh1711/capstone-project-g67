import { Component, Inject } from '@angular/core';
import { JwtUserUtilService } from '../../auth/jwt-user-util.service';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { AuthService } from '../../auth/auth.service';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-vip-payment',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './vip-payment.component.html',
  styleUrls: ['./vip-payment.component.scss']
})
export class VipPaymentComponent {
  user: any = {};
  paymentUrl: string = '';
  loading = true;
  error = '';

  constructor(
    private authService: AuthService,
    private http: HttpClient,
    private jwtUtil: JwtUserUtilService
  ) {
    this.loadUserInfo();
  }

  loadUserInfo() {
    this.loading = true;
    this.authService.getProfile().subscribe({
      next: (profile) => {
        this.user = profile;
        this.loading = false;
      },
      error: (err) => {
        this.error = err?.error?.message || 'Không thể tải thông tin người dùng.';
        this.loading = false;
      }
    });
  }

  payVip() {
    this.loading = true;
    const userId = this.jwtUtil.getUserIdFromToken() || 1;
    const amount = 100000;
    const params = `userId=${encodeURIComponent(userId)}&amount=${encodeURIComponent(amount)}`;
    // Sử dụng environment để lấy baseUrl phù hợp môi trường
    const apiUrl = environment.apiUrl;
    const paymentUrl = `${apiUrl}/payment/vnpay/create?${params}`;
    this.http.post<any>(
      paymentUrl,
      {}
    ).subscribe({
      next: (res) => {
        if (res && res.paymentUrl) {
          // Chuyển hướng sang trang thanh toán, sau khi thanh toán thành công sẽ về /vip/welcome
          window.location.href = res.paymentUrl;
        } else {
          this.error = 'Không lấy được link thanh toán.';
        }
        this.loading = false;
      },
      error: () => {
        this.error = 'Lỗi khi tạo thanh toán.';
        this.loading = false;
      }
    });
  }
}
