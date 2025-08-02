import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { AuthService } from '../../../auth/auth.service';

@Component({
  selector: 'app-expert-top-navigator',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="expert-top-nav">
      <div class="nav-left">
        <h2 class="page-title">{{ pageTitle }}</h2>
        <div class="breadcrumb">
          <span class="breadcrumb-item">Expert</span>
          <span class="breadcrumb-separator">></span>
          <span class="breadcrumb-current">{{ currentPage }}</span>
        </div>
      </div>
      
      <div class="nav-right">
        <div class="notifications">
          <button class="notification-btn">
            <span class="notification-icon">🔔</span>
            @if (notificationCount > 0) {
              <span class="notification-badge">{{ notificationCount }}</span>
            }
          </button>
        </div>
        
        <div class="user-profile">
          <div class="user-avatar">
            <img [src]="userAvatar" [alt]="userName" />
          </div>
          <div class="user-info">
            <div class="user-name">{{ userName }}</div>
            <div class="user-role">Chuyên gia</div>
          </div>
          <button class="logout-btn" title="Đăng xuất" (click)="logout()">
            <svg width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
              <path d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a2 2 0 01-2 2H7a2 2 0 01-2-2V7a2 2 0 012-2h4a2 2 0 012 2v1"/>
            </svg>
          </button>
        </div>
      </div>
    </div>
  `,
  styleUrls: ['./expert-top-navigator.component.scss']
})
export class ExpertTopNavigatorComponent implements OnInit {
  pageTitle = 'Hệ thống Chuyên gia';
  currentPage = 'Trang chủ';
  notificationCount = 3;
  userName = '';
  userAvatar = 'assets/image/default-avatar.png';

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    // Get user info from auth service
    const userId = this.authService.getCurrentUserId();
    if (userId) {
      this.userName = `Expert ${userId}`;
    }
    
    // Update page info based on current route
    this.updatePageInfo();
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/login-admin']);
  }

  private updatePageInfo(): void {
    const url = window.location.pathname;
    if (url.includes('/expert/chat')) {
      this.pageTitle = 'Phòng Chat Chuyên gia';
      this.currentPage = 'Chat';
    } else if (url.includes('/expert/consultation')) {
      this.pageTitle = 'Quản lý Tư vấn';
      this.currentPage = 'Tư vấn';
    } else if (url.includes('/expert/knowledge')) {
      this.pageTitle = 'Kiến thức Chuyên môn';
      this.currentPage = 'Kiến thức';
    } else if (url.includes('/expert/schedule')) {
      this.pageTitle = 'Lịch Làm việc';
      this.currentPage = 'Lịch';
    } else {
      this.pageTitle = 'Hệ thống Chuyên gia';
      this.currentPage = 'Trang chủ';
    }
  }
}
