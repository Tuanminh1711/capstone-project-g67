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
  sidebarSections: SidebarSection[] = [
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
      title: 'Chat & Hỗ trợ',
      open: false,
      items: [
        { label: '💬 Chat với VIP Users', link: '/admin/expert-chat' }
      ]
    },
    {
      title: 'Thống kê',
      open: false,
      items: [
        { label: 'Tổng số cây đã thêm', link: '/admin/statistics/total-plants' },
        { label: 'Tổng số người dùng đăng ký', link: '/admin/statistics/total-users' },
        { label: 'Tổng số người dùng truy cập', link: '/admin/statistics/total-browse-users' }
        // Nếu có route cho thống kê lọc, thêm vào đây
      ]
    }
  ];

  toggleSection(section: SidebarSection) {
    section.open = !section.open;
  }
}
