import { Component, OnInit } from '@angular/core';
import { AuthService } from '../auth/auth.service';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-vip-payment-success',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './vip-payment-success.component.html',
  styleUrls: ['./vip-payment-success.component.scss'],
})
export class VipPaymentSuccessComponent implements OnInit {
  message = 'Đang xác thực thanh toán...';
  username = '';
  newRole = '';
  userId = '';
  loading = true;

  subscriptionType = '';
  durationMonths = 0;
  redirectTo = '';

  constructor(
    private route: ActivatedRoute,
    private http: HttpClient,
    private router: Router,
    private auth: AuthService
  ) {}

  ngOnInit() {
    this.route.queryParams.subscribe((params) => {
      this.http.get('/api/payment/vnpay-return', { params }).subscribe(
        (res: any) => {
          this.loading = false;
          this.message = res.message || 'Thanh toán thành công!';
          this.username = res.username || '';
          this.newRole = res.newRole || '';
          this.userId = res.userId || '';

          this.subscriptionType = res.subscriptionType || '';
          this.durationMonths = res.durationMonths || 0;
          this.redirectTo = res.redirectTo || '/home';

          if (res.success) {
            alert('Bạn đã nâng cấp VIP thành công. Vui lòng đăng xuất và đăng nhập lại để cập nhật quyền!');
            this.auth.logout(true);
            // Sau khi logout, sẽ chuyển hướng về trang chủ (đã có trong logout)
          }
        },
        (error) => {
          this.loading = false;
          this.message = 'Thanh toán thất bại hoặc bị hủy';
          alert('Thanh toán thất bại hoặc bị hủy');
        }
      );
    });
  }
}
