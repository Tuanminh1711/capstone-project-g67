import { Component, OnInit } from '@angular/core';
import { AuthService } from '../auth/auth.service';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { ToastService } from '../shared/toast/toast.service';

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
    private auth: AuthService,
    private toast: ToastService
  ) {}

  ngOnInit() {
    this.route.queryParams.subscribe((params) => {
      this.http.get('/api/payment/vnpay-return', { params }).subscribe({
        next: (res: any) => {
          this.toast.success('Thanh toán VIP thành công! Vui lòng đăng xuất và đăng nhập lại để cập nhật quyền.');
          this.router.navigate(['/home']);
        },
        error: (error) => {
          this.toast.error('Thanh toán thất bại hoặc bị hủy');
          this.router.navigate(['/home']);
        }
      });
    });
  }

  confirmLogout() {
    this.auth.logout(true);
  }
}
