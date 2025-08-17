import { Component, Inject } from '@angular/core';
import { JwtUserUtilService } from '../../../auth/jwt-user-util.service';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { AuthService } from '../../../auth/auth.service';
import { environment } from '../../../../environments/environment';


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

  // Subscription logic
  selectedSubscriptionType: 'MONTHLY' | 'YEARLY' = 'MONTHLY';
  subscriptionDetails = {
    MONTHLY: {
      name: 'Gói tháng',
      price: 100000,
      duration: '1 tháng',
      features: [
        'Truy cập không giới hạn AI nhận diện cây',
        'Phát hiện và điều trị bệnh cây',
        'Chat VIP cộng đồng với chuyên gia',
        'Lưu trữ lịch sử không giới hạn',
        'Hỗ trợ kỹ thuật ưu tiên',
        'Không quảng cáo và giới hạn sử dụng'
      ]
    },
    YEARLY: {
      name: 'Gói năm',
      price: 900000,
      originalPrice: 1200000,
      duration: '12 tháng',
      features: [
        'Truy cập không giới hạn AI nhận diện cây',
        'Phát hiện và điều trị bệnh cây',
        'Chat VIP cộng đồng với chuyên gia',
        'Lưu trữ lịch sử không giới hạn',
        'Hỗ trợ kỹ thuật ưu tiên',
        'Không quảng cáo và giới hạn sử dụng',
        'Tặng thêm 1 tháng miễn phí',
        'Cập nhật tính năng mới sớm nhất'
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
    const subscriptionType = this.selectedSubscriptionType;
    // Tạo returnUrl: chuyển về trang home sau khi thanh toán
    const returnUrl = encodeURIComponent(window.location.origin + '/home');
    const params = `userId=${encodeURIComponent(userId)}&amount=${encodeURIComponent(amount)}&subscriptionType=${encodeURIComponent(subscriptionType)}&returnUrl=${returnUrl}`;
    const apiUrl = environment.apiUrl;
    const paymentUrl = `${apiUrl}/payment/vnpay/create?${params}`;
    this.http.post<any>(
      paymentUrl,
      {}
    ).subscribe({
      next: (res) => {
        if (res && res.paymentUrl) {
          // Hiện toast báo trước khi chuyển hướng
          this.showToast('Đang chuyển đến trang thanh toán. Sau khi thanh toán thành công, bạn sẽ được chuyển về trang chủ.');
          setTimeout(() => {
            window.location.href = res.paymentUrl;
          }, 1200);
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

  showToast(message: string) {
    // Sử dụng toast đơn giản bằng alert, có thể thay bằng thư viện toast nếu cần
    alert(message);
  }
}
