import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

interface SidebarSection {
  title: string;
  open: boolean;
  items: { label: string; link: string }[];
}

@Component({
  selector: 'app-admin-sidebar',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './admin-sidebar.component.html',
  styleUrls: ['./admin-sidebar.component.scss']
})
export class AdminSidebarComponent {
  @Input() collapsed = false;
  sidebarSections: SidebarSection[] = [];

  constructor() {
    // Lấy role từ JWT (nếu có)
    let role = '';
    try {
      const token = document.cookie.split('; ').find(row => row.startsWith('auth_token='))?.split('=')[1];
      if (token) {
        const payload = JSON.parse(atob(token.split('.')[1]));
        role = (payload.role || '').toUpperCase();
      }
    } catch {}

    if (role === 'STAFF') {
      this.sidebarSections = [
        {
          title: 'Quản lý cây',
          open: false,
          items: [
            { label: 'Danh sách cây', link: '/admin/plants' },
            { label: 'Tạo cây mới', link: '/admin/plants/create' }
          ]
        },
        {
          title: 'Quản lý phản hồi',
          open: false,
          items: [
            { label: 'Danh sách báo cáo', link: '/admin/reports' },
            { label: 'Danh sách ticket', link: '/admin/support/tickets' }
          ]
        }
      ];
    } else {
      this.sidebarSections = [
        {
          title: 'Quản lý tài khoản',
          open: false,
          items: [
            { label: 'Danh sách tài khoản', link: '/admin/accounts' },
            { label: 'Tạo tài khoản mới', link: '/admin/accounts/create' }
          ]
        },
        {
          title: 'Quản lý cây',
          open: false,
          items: [
            { label: 'Danh sách cây', link: '/admin/plants' },
            { label: 'Tạo cây mới', link: '/admin/plants/create' }
          ]
        },
        {
          title: 'Quản lý phản hồi',
          open: false,
          items: [
            { label: 'Danh sách báo cáo', link: '/admin/reports' },
            { label: 'Danh sách ticket', link: '/admin/support/tickets' }
          ]
        },
        {
          title: 'Thống kê',
          open: false,
          items: [
            { label: 'Tổng hợp thống kê', link: '/admin/statistics/overview' }
          ]
        }
      ];
    }
  }

  toggleSection(section: SidebarSection) {
    section.open = !section.open;
  }
}
