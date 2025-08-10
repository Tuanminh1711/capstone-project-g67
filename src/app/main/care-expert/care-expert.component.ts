
import { Component, inject, OnInit } from '@angular/core';
import { TopNavigatorComponent } from '../../shared/top-navigator/index';
import { RouterModule } from '@angular/router';
import { Router } from '@angular/router';
import { JwtUserUtilService } from '../../auth/jwt-user-util.service';
import { AuthDialogService } from '../../auth/auth-dialog.service';

@Component({
  selector: 'app-care-expert',
  standalone: true,
// TopNavigatorComponent is used in the template via <app-top-navigator>
  imports: [TopNavigatorComponent, RouterModule],
  templateUrl: './care-expert.component.html',
  styleUrls: ['./care-expert.component.scss']
})
export class CareExpertComponent implements OnInit {
  private authDialogService = inject(AuthDialogService);

  constructor(private router: Router, private jwtUtil: JwtUserUtilService) {}

  ngOnInit() {
    // Cho phép tất cả users truy cập trang này
    // Chỉ kiểm tra VIP để chuyển hướng nếu cần
    if (this.jwtUtil.isLoggedIn()) {
      const info = this.jwtUtil.getTokenInfo();
      if (info && info.role === 'VIP') {
  this.router.navigate(['/vip/welcome']);
        return;
      }
    }
  }

  goToVipPayment() {
    // Kiểm tra đăng nhập khi click nút nâng cấp VIP
    if (!this.jwtUtil.isLoggedIn()) {
      this.authDialogService.openLoginDialog();
      return;
    }
    
  // User đã đăng nhập -> chuyển đến trang payment
  this.router.navigate(['/user/create-payment/vip-payment']);
  }
}
