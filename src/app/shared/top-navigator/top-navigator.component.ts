import { Component, HostListener, inject } from '@angular/core';
import { RouterModule } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { SendTicketDialogComponent } from '../../user/ticket/send-ticket/send-ticket-dialog';
import { SupportService } from '../../user/ticket/send-ticket/support.service';
import { AuthDialogService } from '../../auth/auth-dialog.service';
// import { SupportDialogService } from '../../support/shared/support-dialog.service';
import { Router } from '@angular/router';
import { AuthService } from '../../auth/auth.service';

@Component({
  selector: 'app-top-navigator',
  standalone: true,
  imports: [RouterModule],
  templateUrl: './top-navigator.html',
  styleUrl: './top-navigator.scss'
})
export class TopNavigatorComponent {
  supportTickets: any[] = [];
  // isSupportDropdownOpen = false; // Đã khai báo phía trên
  private dialog = inject(MatDialog);
  private supportService = inject(SupportService);

  toggleSupportDropdown(event: MouseEvent) {
    event.stopPropagation();
    this.isSupportDropdownOpen = !this.isSupportDropdownOpen;
    if (this.isSupportDropdownOpen) {
      this.loadSupportTickets();
    }
  }

  closeSupportDropdown() {
    this.isSupportDropdownOpen = false;
  }

  openSendTicketDialog() {
    this.closeSupportDropdown();
    this.dialog.open(SendTicketDialogComponent, {
      width: '500px',
      panelClass: 'dialog-panel-bg'
    });
  }

  viewMyTickets() {
    this.closeSupportDropdown();
    this.router.navigate(['/user/my-tickets']);
  }

  loadSupportTickets() {
    this.supportService.getMyTickets().subscribe(tickets => {
      this.supportTickets = tickets;
    });
  }
  showUserMenu = false;
  showGreenSpaceDropdown = false;
  showMobileMenu = false;
  isSupportDropdownOpen = false;

  constructor(
    public router: Router, 
    public authService: AuthService,
    private authDialog: AuthDialogService,
    // private supportDialog: SupportDialogService
  ) {}

  toggleUserMenu(event: MouseEvent) {
    event.stopPropagation();
    this.showUserMenu = !this.showUserMenu;
  }
  closeUserMenu() {
    this.showUserMenu = false;
  }
  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent) {
    const target = event.target as HTMLElement;
    if (!target.closest('.nav-icon.user')) {
      this.showUserMenu = false;
    }
    if (!target.closest('.support-dropdown')) {
      this.isSupportDropdownOpen = false;
    }
    if (!target.closest('.mobile-menu-toggle') && !target.closest('.nav-links')) {
      this.showMobileMenu = false;
    }
  }

  toggleMobileMenu() {
    this.showMobileMenu = !this.showMobileMenu;
  }

  closeMobileMenu() {
    this.showMobileMenu = false;
  }

  openLogin() {
    this.closeUserMenu();
    this.authDialog.openLoginDialog();
  }

  openRegister() {
    this.closeUserMenu();
    this.authDialog.openRegisterDialog();
  }

  // openSupportTicket() {
  //   this.isSupportDropdownOpen = false;
  //   this.supportDialog.openSupportDialog();
  // }

  // toggleSupportDropdown(event: MouseEvent) {
  //   event.stopPropagation();
  //   this.isSupportDropdownOpen = !this.isSupportDropdownOpen;
  //   console.log('Support dropdown state:', this.isSupportDropdownOpen);
  // }

  // viewSupportTickets() {
  //   this.isSupportDropdownOpen = false;
  //   this.router.navigate(['/support/tickets']);
  // }

  // closeSupportDropdown() {
  //   this.isSupportDropdownOpen = false;
  // }

  get isLoggedIn(): boolean {
    return this.authService.isLoggedIn();
  }

  logout() {
    this.authService.logout();
    this.router.navigate(['/home']);
  }
}
