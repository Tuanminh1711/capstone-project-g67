import { Component, HostListener, inject, OnInit, ChangeDetectorRef } from '@angular/core';
import { RouterModule } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { SendTicketDialogComponent } from '../../user/ticket/send-ticket/send-ticket-dialog';
import { SupportService } from '../../user/ticket/send-ticket/support.service';
import { AuthDialogService } from '../../auth/auth-dialog.service';
// import { SupportDialogService } from '../../support/shared/support-dialog.service';
import { Router } from '@angular/router';
import { AuthService } from '../../auth/auth.service';
import { JwtUserUtilService } from '../../auth/jwt-user-util.service';
import { ToastService } from '../toast/toast.service';

@Component({
  selector: 'app-top-navigator',
  standalone: true,
  imports: [RouterModule],
  templateUrl: './top-navigator.html',
  styleUrl: './top-navigator.scss'
})
export class TopNavigatorComponent implements OnInit {
  userAvatarFilename: string | null = null;
  supportTickets: any[] = [];
  showUserMenu = false;
  showGreenSpaceDropdown = false;
  showMobileMenu = false;
  isSupportDropdownOpen = false;

 viewActivityLogs(): void {
    this.closeUserMenu();
    this.router.navigate(['/user/activity-logs']);
  }
  private dialog = inject(MatDialog);
  private supportService = inject(SupportService);

  private cdr = inject(ChangeDetectorRef);

  constructor(
    public router: Router,
    public authService: AuthService,
    private authDialog: AuthDialogService,
    private jwtUtil: JwtUserUtilService,
    private toast: ToastService
  ) {}

  ngOnInit(): void {
    // Luôn load avatar khi component khởi tạo (kể cả khi đã đăng nhập từ trước)
    if (this.isLoggedIn) {
      this.loadUserAvatar();
    }
    // Nếu AuthService có sự kiện đăng nhập thành công thì lắng nghe để reload avatar
    if ((this.authService as any).userLoggedIn$) {
      (this.authService as any).userLoggedIn$.subscribe(() => {
        this.loadUserAvatar();
      });
    }
  }

  loadUserAvatar(): void {
    this.authService.getProfile().subscribe({
      next: (user: any) => {
        this.userAvatarFilename = user?.avatar || null;
        this.cdr.markForCheck();
      },
      error: () => {
        this.userAvatarFilename = null;
        this.cdr.markForCheck();
      }
    });
  }

  getUserAvatarUrl(): string {
    if (this.userAvatarFilename) {
      // Nếu là base64 hoặc đã là URL, trả về trực tiếp
      if (
        this.userAvatarFilename.startsWith('data:image') ||
        this.userAvatarFilename.startsWith('http') ||
        this.userAvatarFilename.startsWith('/api/avatars/')
      ) {
        // Nếu là /api/avatars/... thì cần thêm host từ environment
        if (this.userAvatarFilename.startsWith('/api/avatars/')) {
          return `${this.authService['apiUrl'].replace(/\/api$/, '')}${this.userAvatarFilename}`;
        }
        return this.userAvatarFilename;
      }
      // Nếu là tên file, trả về endpoint backend đúng
      return `${this.authService['apiUrl'].replace(/\/api$/, '')}/api/user/avatars/${encodeURIComponent(this.userAvatarFilename)}`;
    }
    // Không có avatar hoặc lỗi thì trả về chuỗi rỗng để hiện icon user
    return '';
  }
  goToCareExpert(): void {
    if (!this.isLoggedIn) {
      this.authDialog.openLoginDialog();
      this.toast.error('Vui lòng đăng nhập để sử dụng tính năng này!');
      return;
    }
    this.authService.getProfile().subscribe({
      next: (user: any) => {
        const role = user?.role || this.jwtUtil.getRoleFromToken();
        if (role && role.toUpperCase() === 'VIP') {
          this.router.navigate(['/vip/welcome']);
        } else {
          this.router.navigate(['/care-expert']);
        }
      },
      error: () => {
        // fallback nếu lỗi thì dùng token cũ
        const role = this.jwtUtil.getRoleFromToken();
        if (role && role.toUpperCase() === 'VIP') {
          this.router.navigate(['/vip/welcome']);
        } else {
          this.router.navigate(['/care-expert']);
        }
      }
    });
  }

  toggleSupportDropdown = (event: MouseEvent): void => {
    event.stopPropagation();
    this.isSupportDropdownOpen = !this.isSupportDropdownOpen;
    if (this.isSupportDropdownOpen) {
      this.loadSupportTickets();
    }
  };

  closeSupportDropdown = (): void => {
    this.isSupportDropdownOpen = false;
  };

  openSendTicketDialog = (): void => {
    this.closeSupportDropdown();
    this.dialog.open(SendTicketDialogComponent, {
      width: '500px',
      panelClass: 'dialog-panel-bg'
    });
  };

  viewMyTickets = (): void => {
    this.closeSupportDropdown();
    this.router.navigate(['/user/my-tickets']);
  };

  loadSupportTickets = (): void => {
    this.supportService.getMyTickets().subscribe(tickets => {
      this.supportTickets = tickets;
    });
  };

  toggleUserMenu = (event: MouseEvent): void => {
    event.stopPropagation();
    this.showUserMenu = !this.showUserMenu;
    if (this.showUserMenu && this.isLoggedIn) {
      this.loadUserAvatar();
    }
  };

  closeUserMenu = (): void => {
    this.showUserMenu = false;
  };

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    const target = event.target as HTMLElement;
    if (!target.closest('.nav-icon.user')) this.showUserMenu = false;
    if (!target.closest('.support-dropdown')) this.isSupportDropdownOpen = false;
    if (!target.closest('.mobile-menu-toggle') && !target.closest('.nav-links')) this.showMobileMenu = false;
  }

  toggleMobileMenu = (): void => {
    this.showMobileMenu = !this.showMobileMenu;
  };

  closeMobileMenu = (): void => {
    this.showMobileMenu = false;
  };

  openLogin = (): void => {
    this.closeUserMenu();
    this.authDialog.openLoginDialog();
    setTimeout(() => this.loadUserAvatar(), 500);
  };

  openRegister = (): void => {
    this.closeUserMenu();
    this.authDialog.openRegisterDialog();
    setTimeout(() => this.loadUserAvatar(), 500);
  };

  get isLoggedIn(): boolean {
    return this.authService.isLoggedIn();
  }

  logout = (): void => {
    this.authService.logout();
    this.router.navigate(['/home']);
  };
}
