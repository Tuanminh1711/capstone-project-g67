import { JwtUserUtilService } from '../../../../auth/jwt-user-util.service';
import { Component, Input, Output, EventEmitter, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, NavigationEnd } from '@angular/router';
import { AuthService } from '../../../../auth/auth.service';
import { Subscription } from 'rxjs';
import { filter } from 'rxjs/operators';

@Component({
  selector: 'app-admin-top-navigator',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './admin-top-navigator.component.html',
  styleUrls: ['./admin-top-navigator.component.scss']
})
export class AdminTopNavigatorComponent implements OnInit, OnDestroy {
  @Input() sidebarOpen = true;
  @Output() sidebarToggle = new EventEmitter<void>();

  username: string = '';
  currentPageTitle: string = 'Dashboard';
  private routerSubscription?: Subscription;

  // Map các route với title tương ứng (chỉ exact match, không có ID)
  private routeTitleMap: { [key: string]: string } = {
    '/admin': 'Dashboard',
    '/admin/dashboard': 'Dashboard', 
    '/admin/home': 'Trang chủ',
    '/admin/support': 'Hỗ trợ khách hàng',
    '/admin/support/tickets': 'Danh sách ticket',
    '/admin/accounts': 'Danh sách tài khoản',
    '/admin/accounts/create': 'Tạo tài khoản mới',
    '/admin/plants': 'Danh sách cây trồng',
    '/admin/plants/create': 'Tạo cây mới',
    '/admin/reports': 'Danh sách báo cáo',
    '/admin/statistics': 'Thống kê'
  };

  constructor(
    private router: Router,
    private authService: AuthService,
    private jwtUserUtil: JwtUserUtilService
  ) {}

  ngOnInit() {
    const info = this.jwtUserUtil.getTokenInfo();
    this.username = info?.sub || info?.username || 'Admin';
    
    // Lấy title của trang hiện tại
    this.updatePageTitle(this.router.url);
    
    // Lắng nghe thay đổi route để cập nhật title
    this.routerSubscription = this.router.events
      .pipe(filter(event => event instanceof NavigationEnd))
      .subscribe((event: NavigationEnd) => {
        this.updatePageTitle(event.url);
      });
  }

  ngOnDestroy() {
    if (this.routerSubscription) {
      this.routerSubscription.unsubscribe();
    }
  }

  private updatePageTitle(url: string): void {
    // Loại bỏ query parameters và fragments
    const cleanUrl = url.split('?')[0].split('#')[0];
    
    // Tìm exact match trước
    if (this.routeTitleMap[cleanUrl]) {
      this.currentPageTitle = this.routeTitleMap[cleanUrl];
      return;
    }
    
    // Xử lý các trường hợp đặc biệt với ID TRƯỚC (ưu tiên cao)
    if (cleanUrl.includes('/admin/support/tickets/') && cleanUrl !== '/admin/support/tickets') {
      this.currentPageTitle = 'Chi tiết ticket';
      return;
    }
    
    if (cleanUrl.includes('/admin/plants/view/')) {
      this.currentPageTitle = 'Chi tiết cây';
      return;
    }
    
    if (cleanUrl.includes('/admin/plants/edit/') || cleanUrl.includes('/admin/plants/update/')) {
      this.currentPageTitle = 'Chỉnh sửa cây';
      return;
    }
    
    if (cleanUrl.includes('/admin/accounts/detail/')) {
      this.currentPageTitle = 'Chi tiết tài khoản';
      return;
    }
    
    if (cleanUrl.includes('/admin/accounts/update/')) {
      this.currentPageTitle = 'Chỉnh sửa tài khoản';
      return;
    }
    
    if (cleanUrl.includes('/admin/accounts/activity-logs/')) {
      this.currentPageTitle = 'Nhật ký hoạt động';
      return;
    }
    
    if (cleanUrl.includes('/admin/reports/detail/')) {
      this.currentPageTitle = 'Chi tiết báo cáo';
      return;
    }
    
    if (cleanUrl.includes('/admin/reports/review/')) {
      this.currentPageTitle = 'Duyệt báo cáo';
      return;
    }
    
    if (cleanUrl.includes('/admin/response-manager/approve-report/')) {
      this.currentPageTitle = 'Phê duyệt báo cáo';
      return;
    }
    
    // Tìm partial match cho các route không có ID (ưu tiên thấp hơn)
    for (const route in this.routeTitleMap) {
      if (cleanUrl.startsWith(route) && route !== '/admin') {
        this.currentPageTitle = this.routeTitleMap[route];
        return;
      }
    }
    
    // Fallback
    this.currentPageTitle = 'Dashboard';
  }

  toggleSidebar() {
    this.sidebarToggle.emit();
  }

  logout() {
    // Sử dụng AuthService logout dành riêng cho admin
    this.authService.logoutAdmin();
  }
}
