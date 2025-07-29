
import { Component } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { DialogManager } from '../../shared/dialog-manager.service';
import { LoginDialogComponent } from '../../auth/login/login-dialog';
import { RegisterDialogComponent } from '../../auth/register/register-dialog';
import { JwtUserUtilService } from '../../auth/jwt-user-util.service';
import { NgFor, NgIf, NgOptimizedImage } from '@angular/common';
import { TopNavigatorComponent } from '../../shared/top-navigator/index';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [TopNavigatorComponent, NgOptimizedImage],
  templateUrl: './home.html',
  styleUrl: './home.scss'
})
export class HomeComponent {

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private dialogManager: DialogManager,
    public jwtUserUtil: JwtUserUtilService
  ) {}

  onConnectExpertClick() {
    if (this.jwtUserUtil.isLoggedIn()) {
      this.router.navigate(['/community']);
    } else {
      this.dialogManager.open(LoginDialogComponent);
    }
  }

  goToCareExpert() {
    const role = this.jwtUserUtil.getRoleFromToken();
    if (role && role.toLowerCase() === 'vip') {
      this.router.navigate(['/vip/welcome-vip']);
    } else {
      this.router.navigate(['/care-expert']);
    }
  }
}
