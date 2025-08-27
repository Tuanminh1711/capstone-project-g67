import { AfterViewInit } from '@angular/core';
import { JwtUserUtilService } from '../../../../auth/jwt-user-util.service';
import { Component, Input, Output, EventEmitter, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, NavigationEnd } from '@angular/router';
import { AuthService } from '../../../../auth/auth.service';
import { Subscription } from 'rxjs';
import { filter } from 'rxjs/operators';
import { AdminAccountService } from '../../account-manager/account-list/admin-account.service';

@Component({
  selector: 'app-admin-top-navigator',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './admin-top-navigator.component.html',
  styleUrls: ['./admin-top-navigator.component.scss']
})
export class AdminTopNavigatorComponent implements OnInit, OnDestroy, AfterViewInit {
  ngAfterViewInit() {
    // Nếu displayName chưa có (do API trả về chậm hoặc lifecycle), gọi lại setDisplayName
    if (!this.displayName) {
      setTimeout(() => this.setDisplayName(), 0);
    }
  }
  @Input() sidebarOpen = true;
  @Output() sidebarToggle = new EventEmitter<void>();

  displayName: string = '';
  currentPageTitle: string = 'Dashboard';
  private routerSubscription?: Subscription;
  currentUserId: string | null = null;

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
  private jwtUserUtil: JwtUserUtilService,
  private accountService: AdminAccountService
) {}

  ngOnInit() {
    this.setDisplayName();
    // Lấy title của trang hiện tại
    this.updatePageTitle(this.router.url);
    // Lắng nghe thay đổi route để cập nhật title và luôn cập nhật displayName
    this.routerSubscription = this.router.events
      .pipe(filter(event => event instanceof NavigationEnd))
      .subscribe((event: NavigationEnd) => {
        this.setDisplayName();
        this.updatePageTitle(event.url);
      });
  }

  private setDisplayName() {
    this.currentUserId = this.authService.getCurrentUserId();
    if (this.currentUserId) {
      const currentUserIdNum = Number(this.currentUserId);
      this.accountService.searchAccounts('').subscribe(accounts => {
        const me = accounts.find(acc => acc.id === currentUserIdNum);
        if (me && me.fullName && me.role) {
          this.displayName = `Chào ${me.role}: ${me.fullName}`;
        } else if (me && me.fullName) {
          this.displayName = `Chào: ${me.fullName}`;
        } else {
          const info = this.jwtUserUtil.getTokenInfo();
          const username = info?.sub || info?.username || 'Admin';
          this.displayName = `Chào: ${username}`;
        }
      }, () => {
        const info = this.jwtUserUtil.getTokenInfo();
        const username = info?.sub || info?.username || 'Admin';
        this.displayName = `Chào: ${username}`;
      });
    } else {
      const info = this.jwtUserUtil.getTokenInfo();
      const username = info?.sub || info?.username || 'Admin';
      this.displayName = `Chào: ${username}`;
    }
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
