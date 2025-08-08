import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../../auth/auth.service';

@Component({
  selector: 'app-expert-sidebar',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="expert-sidebar">
      <div class="sidebar-header">
        <div class="logo">
          <img src="assets/image/logo.png" alt="Logo" class="logo-img">
          <div class="logo-text">
            <span class="main-text">Plant Care</span>
            <span class="sub-text">Expert</span>
          </div>
        </div>
      </div>

      <nav class="sidebar-nav">
        <ul class="nav-list">
          <li class="nav-item">
            <a [routerLink]="['/expert/welcome']" class="nav-link" routerLinkActive="active">
              <span class="nav-icon">🏠</span>
              <span class="nav-text">Trang chủ</span>
            </a>
          </li>
          
          <li class="nav-item">
            <a [routerLink]="['/expert/chat']" class="nav-link" routerLinkActive="active">
              <span class="nav-icon">💬</span>
              <span class="nav-text">Phòng Chat</span>
            </a>
          </li>
          
          <li class="nav-item">
            <a [routerLink]="['/expert/private-chat']" class="nav-link" routerLinkActive="active">
              <span class="nav-icon">🔒</span>
              <span class="nav-text">Tin nhắn riêng tư</span>
            </a>
          </li>
          
          <li class="nav-item">
            <a [routerLink]="['/expert/consultation']" class="nav-link" routerLinkActive="active">
              <span class="nav-icon">📋</span>
              <span class="nav-text">Tư vấn</span>
            </a>
          </li>
          
          <li class="nav-item">
            <a [routerLink]="['/expert/knowledge']" class="nav-link" routerLinkActive="active">
              <span class="nav-icon">📚</span>
              <span class="nav-text">Kiến thức</span>
            </a>
          </li>
          
          <li class="nav-item">
            <a [routerLink]="['/expert/schedule']" class="nav-link" routerLinkActive="active">
              <span class="nav-icon">📅</span>
              <span class="nav-text">Lịch làm việc</span>
            </a>
          </li>
        </ul>
      </nav>
    </div>
  `,
  styleUrls: ['./expert-sidebar.component.scss']
})
export class ExpertSidebarComponent {
  constructor(
    private router: Router,
    private authService: AuthService
  ) {}
}
