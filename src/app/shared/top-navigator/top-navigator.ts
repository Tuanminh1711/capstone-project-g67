import { Component, HostListener } from '@angular/core';
import { NgIf } from '@angular/common';

@Component({
  selector: 'app-top-navigator',
  imports: [NgIf],
  templateUrl: './top-navigator.html',
  styleUrl: './top-navigator.css'
})
export class TopNavigator {
  showUserMenu = false;

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

  logout() {
    // TODO: Add logout logic here (e.g., clear token, redirect to login)
    alert('Logged out!');
  }
}
