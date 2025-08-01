
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
  isBlocked = false;

  constructor(private router: Router, private jwtUtil: JwtUserUtilService) {}

  ngOnInit() {
    // Nếu chưa đăng nhập thì show popup và chặn thao tác
    if (!this.jwtUtil.isLoggedIn()) {
      this.isBlocked = true;
      setTimeout(() => this.authDialogService.openLoginDialog(), 200);
      return;
    }
    // Nếu là VIP thì chuyển thẳng sang welcome-vip
    const info = this.jwtUtil.getTokenInfo();
    if (info && info.role === 'VIP') {
      this.router.navigate(['/vip/welcome-vip']);
      return;
    }
  }

  goToVipPayment() {
    if (this.isBlocked) return;
    this.router.navigate(['/user/exper/vip-payment']);
  }
}
