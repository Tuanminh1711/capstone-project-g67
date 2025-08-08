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
  styleUrls: ['./vip-payment.component.scss'],
})
export class VipPaymentComponent {
  user: any = {};
  paymentUrl: string = '';
  loading = true;
  error = '';

  selectedSubscriptionType: 'MONTHLY' | 'YEARLY' = 'MONTHLY';
  subscriptionAmounts = {
    MONTHLY: 99000,
    YEARLY: 990000,
  };

  subscriptionDetails = {
    MONTHLY: {
      name: 'Gói Tháng',
      price: 99000,
      originalPrice: 99000,
      duration: '1 tháng',
      features: [
        'Truy cập AI Chat không giới hạn',
        'Phát hiện bệnh cây nâng cao',
        'Hỗ trợ chuyên gia ưu tiên',
        'Truy cập tất cả tính năng VIP',
      ],
      popular: false,
    },
    YEARLY: {
      name: 'Gói Năm',
      price: 990000,
      originalPrice: 1188000, // Giá gốc nếu mua 12 tháng riêng lẻ
      duration: '12 tháng',
      features: [
        'Tất cả tính năng gói tháng',
        'Ưu đãi đặc biệt',
        'Hỗ trợ 24/7',
        'Tiết kiệm 20% so với mua từng tháng',
      ],
      popular: true,
    },
  };

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
        this.error =
          err?.error?.message || 'Không thể tải thông tin người dùng.';
        this.loading = false;
      },
    });
  }

  payVip() {
  this.loading = true;
  const userId = this.jwtUtil.getUserIdFromToken() || 1;
  const amount = this.subscriptionAmounts[this.selectedSubscriptionType]; // Sử dụng amount từ selected type
  const returnUrl = encodeURIComponent(window.location.origin + '/vip-payment-success');
  

  const params = `userId=${encodeURIComponent(userId)}&amount=${encodeURIComponent(amount)}&subscriptionType=${encodeURIComponent(this.selectedSubscriptionType)}&returnUrl=${returnUrl}`;
  
  const apiUrl = environment.apiUrl;
  const paymentUrl = `${apiUrl}/payment/vnpay/create?${params}`;
  
  this.http.post<any>(paymentUrl, {}).subscribe({
    next: (res) => {
      if (res && res.paymentUrl) {
        console.log('Redirecting to VNPay payment gateway...');
        window.location.href = res.paymentUrl;
      } else {
        this.error = 'Không lấy được link thanh toán.';
      }
      this.loading = false;
    },
    error: (err) => {
      console.error('Payment creation error:', err);
      this.error = 'Lỗi khi tạo thanh toán. Vui lòng thử lại.';
      this.loading = false;
    }
  });
}
  
  selectSubscriptionType(type: 'MONTHLY' | 'YEARLY') {
    this.selectedSubscriptionType = type;
  }
  getSavings(type: 'MONTHLY' | 'YEARLY'): number {
    if (type === 'YEARLY') {
      return (
        this.subscriptionDetails.YEARLY.originalPrice -
        this.subscriptionDetails.YEARLY.price
      );
    }
    return 0;
  }

  getSavingsPercentage(type: 'MONTHLY' | 'YEARLY'): number {
    if (type === 'YEARLY') {
      return Math.round(
        (this.getSavings(type) /
          this.subscriptionDetails.YEARLY.originalPrice) *
          100
      );
    }
    return 0;
  }
}
