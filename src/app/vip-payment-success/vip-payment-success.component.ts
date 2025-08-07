

import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-vip-payment-success',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './vip-payment-success.component.html',
  styleUrls: ['./vip-payment-success.component.scss']
})
export class VipPaymentSuccessComponent implements OnInit {
  message = 'Đang xác thực thanh toán...';
  username = '';
  newRole = '';
  userId = '';
  loading = true;

  constructor(
    private route: ActivatedRoute,
    private http: HttpClient,
    private router: Router
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
          if (res.success) {
            alert(res.message);
            if (res.redirectTo) {
              this.router.navigateByUrl(res.redirectTo);
            }
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
