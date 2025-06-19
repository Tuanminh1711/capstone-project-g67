import { Injectable, Inject, PLATFORM_ID } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { isPlatformBrowser } from '@angular/common';
import { LoginDialogComponent } from '../auth/login/login-dialog';
import { RegisterDialogComponent } from '../auth/register/register-dialog';
import { ForgotPasswordDialogComponent } from '../auth/forgot-password/forgot-password-dialog';

@Injectable({ providedIn: 'root' })
export class AuthDialogService {
  private dialogOpened = false;

  constructor(
    private dialog: MatDialog,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {}

  openLoginDialog(): void {
    if (this.dialogOpened) return;
    this.dialogOpened = true;
    const dialogRef = this.dialog.open(LoginDialogComponent, {
      width: '420px',
      disableClose: true,
      panelClass: 'dialog-panel-bg'
    });
    dialogRef.afterClosed().subscribe(() => {
      this.dialogOpened = false;
    });
  }

  openRegisterDialog(): void {
    if (this.dialogOpened) return;
    this.dialogOpened = true;
    const dialogRef = this.dialog.open(RegisterDialogComponent, {
      width: '420px',
      disableClose: true,
      panelClass: 'dialog-panel-bg'
    });
    dialogRef.afterClosed().subscribe(() => {
      this.dialogOpened = false;
    });
  }

  openForgotPasswordDialog(): void {
    if (this.dialogOpened) return;
    this.dialogOpened = true;
    const dialogRef = this.dialog.open(ForgotPasswordDialogComponent, {
      width: '420px',
      disableClose: true,
      panelClass: 'dialog-panel-bg'
    });
    dialogRef.afterClosed().subscribe(() => {
      this.dialogOpened = false;
    });
  }
}
