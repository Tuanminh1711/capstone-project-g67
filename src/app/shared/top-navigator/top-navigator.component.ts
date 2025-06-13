import { Component, HostListener, inject } from '@angular/core';
import { NgIf } from '@angular/common';
import { AuthDialogService } from '../../auth/auth-dialog.service';

@Component({
  selector: 'app-top-navigator',
  imports: [NgIf],
  templateUrl: './top-navigator.html',
  styleUrl: './top-navigator.scss'
})
export class TopNavigatorComponent {
  showUserMenu = false;
  private authDialog = inject(AuthDialogService);

  toggleUserMenu(event: MouseEvent) {
    event.stopPropagation();
    this.showUserMenu = !this.showUserMenu;
  }

  closeUserMenu() {
    this.showUserMenu = false;
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent) {
    this.showUserMenu = false;
  }

  openLogin() {
    this.closeUserMenu();
    this.authDialog.openLoginDialog();
  }

  openRegister() {
    this.closeUserMenu();
    this.authDialog.openRegisterDialog();
  }

  logout() {
    alert('Logged out!');
  }
}
