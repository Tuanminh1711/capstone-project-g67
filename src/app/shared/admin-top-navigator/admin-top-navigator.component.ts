import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { AuthService } from '../../auth/auth.service';

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

  constructor(
    private router: Router,
    private authService: AuthService
  ) {}

  toggleSidebar() {
    this.sidebarToggle.emit();
  }

  logout() {
    // Sử dụng AuthService để logout đúng cách
    this.authService.logout();
    
    // Chuyển hướng về trang home
    this.router.navigate(['/home']);
  }
}
