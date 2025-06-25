import { Component, HostListener, inject } from '@angular/core';
import { NgIf } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AuthDialogService } from '../../auth/auth-dialog.service';
import { Router } from '@angular/router';
import { AuthService } from '../../auth/auth.service';

@Component({
  selector: 'app-top-navigator',
  standalone: true,
  imports: [NgIf, RouterModule],
  templateUrl: './top-navigator.html',
  styleUrl: './top-navigator.scss'
})
export class TopNavigatorComponent {
  showUserMenu = false;
  showGreenSpaceDropdown = false;
  private authDialog = inject(AuthDialogService);

  constructor(public router: Router, public authService: AuthService) {}

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
  }

  openLogin() {
    this.closeUserMenu();
    this.authDialog.openLoginDialog();
  }

  openRegister() {
    this.closeUserMenu();
    this.authDialog.openRegisterDialog();
  }

  get isLoggedIn(): boolean {
    return this.authService.isLoggedIn();
  }

  logout() {
    this.authService.logout();
    this.router.navigate(['/home']);
  }
}
