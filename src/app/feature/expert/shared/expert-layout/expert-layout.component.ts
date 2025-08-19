import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { AuthService } from '../../../../auth/auth.service';
import { ToastService } from '../../../../shared/toast/toast.service';
import { ExpertSidebarComponent } from '../expert-sidebar/expert-sidebar.component';
import { ExpertFooterComponent } from '../expert-footer/expert-footer.component';

@Component({
  selector: 'app-expert-layout',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    ExpertSidebarComponent,
    ExpertFooterComponent
  ],
  template: `
    @if (isExpertRole) {
      <div class="expert-layout">
        <app-expert-sidebar></app-expert-sidebar>
        
        <div class="expert-main-content">
          <main class="expert-content">
            <router-outlet></router-outlet>
          </main>
          
          <app-expert-footer></app-expert-footer>
        </div>
      </div>
    }
    
    <!-- Hiển thị access denied nếu không có quyền -->
    @if (!isExpertRole && !isLoading) {
      <div class="access-denied">
        <div class="access-denied-content">
          <i class="fas fa-lock"></i>
          <h2>Truy cập bị từ chối</h2>
          <p>Bạn không có quyền truy cập vào khu vực Expert.</p>
          <button class="btn-redirect" (click)="redirectToHome()">Về trang chủ</button>
        </div>
      </div>
    }
  `,
  styleUrls: ['./expert-layout.component.scss']
})
export class ExpertLayoutComponent implements OnInit {
  isExpertRole = false;
  isLoading = true;

  constructor(
    private authService: AuthService,
    private router: Router,
    private toast: ToastService
  ) {}

  ngOnInit() {
    this.checkExpertAccess();
  }

  private checkExpertAccess() {
    const userRole = this.authService.getCurrentUserRole();
    
    if (userRole === 'EXPERT') {
      this.isExpertRole = true;
    } else {
      this.isExpertRole = false;
      this.toast.error('Bạn không có quyền truy cập khu vực Expert!');
      
      // Tự động chuyển hướng sau 2 giây
      setTimeout(() => {
        this.redirectBasedOnRole(userRole);
      }, 2000);
    }
    
    this.isLoading = false;
  }

  private redirectBasedOnRole(role: string | null) {
    switch (role) {
      case 'ADMIN':
        this.router.navigate(['/admin']);
        break;
      case 'VIP':
        this.router.navigate(['/vip/welcome']);
        break;
      case 'USER':
        this.router.navigate(['/']);
        break;
      default:
        this.router.navigate(['/login-admin']);
    }
  }

  redirectToHome() {
    const userRole = this.authService.getCurrentUserRole();
    this.redirectBasedOnRole(userRole);
  }
}
