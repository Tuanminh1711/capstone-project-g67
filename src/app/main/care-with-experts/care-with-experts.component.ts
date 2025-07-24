import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { TopNavigatorComponent } from '../../shared/top-navigator/top-navigator.component';
import { JwtUserUtilService } from '../../auth/jwt-user-util.service';
import { AuthService } from '../../auth/auth.service';

@Component({
  selector: 'app-care-with-experts',
  standalone: true,
  imports: [CommonModule, RouterModule, TopNavigatorComponent],
  templateUrl: './care-with-experts.component.html',
  styleUrls: ['./care-with-experts.component.scss']
})
export class CareWithExpertsComponent {
  constructor(
    private jwtUserUtil: JwtUserUtilService,
    private authService: AuthService,
    private router: Router
  ) {}

  get isLoggedIn(): boolean {
    return this.authService.isLoggedIn();
  }

  get isVipUser(): boolean {
    return this.jwtUserUtil.getRoleFromToken() === 'VIP';
  }

  get userRole(): string | null {
    return this.jwtUserUtil.getRoleFromToken();
  }

  goToVipChat(): void {
    this.router.navigate(['/user/vip-chat']);
  }
} 