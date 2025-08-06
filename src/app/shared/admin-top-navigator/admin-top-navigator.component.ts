import { JwtUserUtilService } from '../../auth/jwt-user-util.service';
import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { CookieService } from '../../auth/cookie.service';

@Component({
  selector: 'app-admin-top-navigator',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './admin-top-navigator.component.html',
  styleUrls: ['./admin-top-navigator.component.scss']
})
export class AdminTopNavigatorComponent {
  @Input() sidebarOpen = true;
  @Output() sidebarToggle = new EventEmitter<void>();

  username: string = '';

  constructor(
    private router: Router,
    private jwtUserUtil: JwtUserUtilService,
    private http: HttpClient,
    private cookieService: CookieService
  ) {}
  ngOnInit() {
    const info = this.jwtUserUtil.getTokenInfo();
    this.username = info?.sub || info?.username || 'Admin';
  }

  toggleSidebar() {
    this.sidebarToggle.emit();
  }

  logout() {
    // Gọi API logout và chuyển về /login-admin, không phụ thuộc AuthService
    const token = this.cookieService.getCookie('auth_token');
    if (token) {
      this.http.post('/api/auth/logout', {}, {
        headers: { Authorization: `Bearer ${token}` }
      }).subscribe({
        next: () => {
          this.cookieService.removeAuthToken();
          window.location.href = '/login-admin';
        },
        error: () => {
          this.cookieService.removeAuthToken();
          window.location.href = '/login-admin';
        }
      });
    } else {
      this.cookieService.removeAuthToken();
      window.location.href = '/login-admin';
    }
  }
}
