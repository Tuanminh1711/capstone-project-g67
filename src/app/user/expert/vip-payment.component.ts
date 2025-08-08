import { Component, Inject } from '@angular/core';
import { JwtUserUtilService } from '../../auth/jwt-user-util.service';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { AuthService } from '../../auth/auth.service';
import { environment } from '../../../environments/environment';
import { TopNavigatorComponent } from '../../shared/top-navigator/top-navigator.component';

@Component({
  selector: 'app-vip-payment',
  standalone: true,
  imports: [CommonModule, TopNavigatorComponent],
  templateUrl: './vip-payment.component.html',
  styleUrls: ['./vip-payment.component.scss']
})
export class VipPaymentComponent {
  user: any = {};
  paymentUrl: string = '';
  loading = true;
  error = '';

  // Subscription logic
  selectedSubscriptionType: 'MONTHLY' | 'YEARLY' = 'MONTHLY';
  subscriptionDetails = {
    MONTHLY: {
      name: 'Gói tháng',
      price: 100000,
      duration: '1 tháng',
      features: [
        'Tư vấn chuyên gia không giới hạn',
        'Ưu tiên hỗ trợ',
        'Truy cập tài liệu VIP'
      ]
    },
    YEARLY: {
      name: 'Gói năm',
      price: 900000,
      originalPrice: 1200000,
      duration: '12 tháng',
      features: [
        'Tư vấn chuyên gia không giới hạn',
        'Ưu tiên hỗ trợ',
        'Truy cập tài liệu VIP',
        'Tặng thêm 1 tháng miễn phí'
      ]
    }
  };

  constructor(
    private authService: AuthService,
    private http: HttpClient,
    private jwtUtil: JwtUserUtilService
  ) {
    this.loadUserInfo();
  }

  selectSubscriptionType(type: 'MONTHLY' | 'YEARLY') {
    this.selectedSubscriptionType = type;
  }

  getSavingsPercentage(type: 'YEARLY' | 'MONTHLY'): number {
    if (type === 'YEARLY') {
      const yearly = this.subscriptionDetails.YEARLY;
      return Math.round(100 - (yearly.price / yearly.originalPrice) * 100);
    }
    return 0;
  }

  getSavings(type: 'YEARLY' | 'MONTHLY'): number {
    if (type === 'YEARLY') {
      const yearly = this.subscriptionDetails.YEARLY;
      return yearly.originalPrice - yearly.price;
    }
    return 0;
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
    const amount = this.subscriptionDetails[this.selectedSubscriptionType].price;
    const params = `userId=${encodeURIComponent(userId)}&amount=${encodeURIComponent(amount)}`;
    const apiUrl = environment.apiUrl;
    const paymentUrl = `${apiUrl}/payment/vnpay/create?${params}`;
    this.http.post<any>(
      paymentUrl,
      {}
    ).subscribe({
      next: (res) => {
        if (res && res.paymentUrl) {
          window.location.href = res.paymentUrl;
        } else {
          this.error = 'Không lấy được link thanh toán.';
        }
        this.loading = false;
      },
      error: (err) => {
        this.error = 'Lỗi khi tạo thanh toán. Vui lòng thử lại.';
        this.loading = false;
      }
    });
  }
}
