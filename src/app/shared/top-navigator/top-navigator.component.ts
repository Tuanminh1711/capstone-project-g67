import { Component, HostListener, inject } from '@angular/core';
import { RouterModule } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { SendTicketDialogComponent } from '../../user/ticket/send-ticket/send-ticket-dialog';
import { SupportService } from '../../user/ticket/send-ticket/support.service';
import { AuthDialogService } from '../../auth/auth-dialog.service';
// import { SupportDialogService } from '../../support/shared/support-dialog.service';
import { Router } from '@angular/router';
import { AuthService } from '../../auth/auth.service';
import { JwtUserUtilService } from '../../auth/jwt-user-util.service';

@Component({
  selector: 'app-top-navigator',
  standalone: true,
  imports: [RouterModule],
  templateUrl: './top-navigator.html',
  styleUrl: './top-navigator.scss'
})
export class TopNavigatorComponent {
  supportTickets: any[] = [];
  showUserMenu = false;
  showGreenSpaceDropdown = false;
  showMobileMenu = false;
  isSupportDropdownOpen = false;

  private dialog = inject(MatDialog);
  private supportService = inject(SupportService);

  constructor(
    public router: Router,
    public authService: AuthService,
    private authDialog: AuthDialogService,
    private jwtUserUtil: JwtUserUtilService
  ) {}

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
  };

  openRegister = (): void => {
    this.closeUserMenu();
    this.authDialog.openRegisterDialog();
  };

  get isLoggedIn(): boolean {
    return this.authService.isLoggedIn();
  }

  get isVipUser(): boolean {
    return this.jwtUserUtil.getRoleFromToken() === 'VIP';
  }

  logout = (): void => {
    this.authService.logout();
    this.router.navigate(['/home']);
  };
}
