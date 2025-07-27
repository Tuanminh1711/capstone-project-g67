import { Component } from '@angular/core';
import { TopNavigatorComponent } from '../../shared/top-navigator/index';
import { RouterModule } from '@angular/router';
import { Router } from '@angular/router';
import { JwtUserUtilService } from '../../auth/jwt-user-util.service';

@Component({
  selector: 'app-care-expert',
  standalone: true,
// TopNavigatorComponent is used in the template via <app-top-navigator>
  imports: [TopNavigatorComponent, RouterModule],
  templateUrl: './care-expert.component.html',
  styleUrls: ['./care-expert.component.scss']
})
export class CareExpertComponent {
  constructor(private router: Router, private jwtUtil: JwtUserUtilService) {}

  goToVipPayment() {
    const role = this.jwtUtil.getRoleFromToken();
    if (role && role.toUpperCase() === 'VIP') {
      this.router.navigate(['/vip/welcome']);
    } else {
      this.router.navigate(['/care-expert']);
    }
  }
}
