import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';

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

  constructor(private router: Router) {}

  toggleSidebar() {
    this.sidebarToggle.emit();
  }

  logout() {
    // Xóa token ở localStorage/cookie
    localStorage.removeItem('token');
    document.cookie = 'token=; Max-Age=0; path=/;';
    // Chuyển hướng về trang login
    this.router.navigate(['/home']);
  }
}
