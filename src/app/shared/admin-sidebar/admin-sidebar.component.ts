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
        { label: 'Tạo tài khoản mới', link: '/admin/accounts/create' },
        { label: 'Danh sách tài khoản', link: '/admin/accounts' },
        { label: 'Tìm kiếm tài khoản', link: '/admin/accounts/search' },
        { label: 'Chi tiết tài khoản', link: '/admin/accounts/detail' },
        { label: 'Nhật ký hoạt động', link: '/admin/accounts/log' },
        { label: 'Cập nhật thông tin', link: '/admin/accounts/update' },
        { label: 'Đặt lại mật khẩu', link: '/admin/accounts/reset-password' },
        { label: 'Khóa/Mở khóa tài khoản', link: '/admin/accounts/lock-unlock' }
      ]
    },
    {
      title: 'Quản lý cây',
      open: false,
      items: [
        { label: 'Tạo cây mới', link: '/admin/plants/create' },
        { label: 'Danh sách cây', link: '/admin/plants' },
        { label: 'Tìm kiếm cây', link: '/admin/plants/search' },
        { label: 'Chi tiết cây', link: '/admin/plants/detail' },
        { label: 'Cập nhật thông tin cây', link: '/admin/plants/update' },
        { label: 'Khóa/Mở khóa cây', link: '/admin/plants/lock-unlock' }
      ]
    },
    {
      title: 'Quản lý phản hồi',
      open: false,
      items: [
        { label: 'Danh sách báo cáo', link: '/admin/reports' },
        { label: 'Chi tiết báo cáo', link: '/admin/reports/detail' },
        { label: 'Duyệt/Bỏ qua báo cáo', link: '/admin/reports/approve-reject' },
        { label: 'Danh sách ticket', link: '/admin/tickets' },
        { label: 'Chi tiết ticket', link: '/admin/tickets/detail' },
        { label: 'Gửi phản hồi', link: '/admin/tickets/send-response' }
      ]
    },
    {
      title: 'Thống kê',
      open: false,
      items: [
        { label: 'Tổng số cây đã thêm', link: '/admin/statistics/total-plants' },
        { label: 'Tổng số người dùng đăng ký', link: '/admin/statistics/total-users' },
        { label: 'Tổng số người dùng truy cập', link: '/admin/statistics/total-browse' },
        { label: 'Thống kê cây (lọc)', link: '/admin/statistics/total-plants-filter' }
      ]
    }
  ];

  toggleSection(section: SidebarSection) {
    section.open = !section.open;
  }
}
