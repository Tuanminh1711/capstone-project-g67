import { Component, Inject } from '@angular/core';
import { ToastService } from 'app/shared/toast/toast.service';
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
  private toastService: ToastService,
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
    // Thêm returnUrl FE để VNPAY redirect về FE sau thanh toán
    const returnUrl = encodeURIComponent(window.location.origin + '/vip-payment-success');
    const params = `userId=${encodeURIComponent(userId)}&amount=${encodeURIComponent(amount)}&returnUrl=${returnUrl}`;
    const apiUrl = environment.apiUrl;
    const paymentUrl = `${apiUrl}/payment/vnpay/create?${params}`;
    this.http.post<any>(
      paymentUrl,
      {}
    ).subscribe({
      next: (res) => {
        if (res && res.paymentUrl) {
          // Thêm thông báo cho user về việc chuyển hướng
          console.log('Redirecting to VNPay payment gateway...');
          window.location.href = res.paymentUrl;
        } else {
          this.error = 'Không lấy được link thanh toán.';
        }
        this.loading = false;
      },
      error: (err) => {
        // Nếu BE trả về lỗi xác nhận thành công (ví dụ sau khi redirect về FE và xác nhận xong)
        if (err?.error?.success) {
          this.toastService.success('Thanh toán thành công! Vui lòng đăng nhập lại để xác nhận.');
          setTimeout(() => {
            this.authService.logout(true);
          }, 2000);
        } else {
          console.error('Payment creation error:', err);
          this.error = 'Lỗi khi tạo thanh toán. Vui lòng thử lại.';
        }
        this.loading = false;
      }
    });
  }
}
