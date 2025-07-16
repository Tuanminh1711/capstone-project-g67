import { Injectable, Inject, PLATFORM_ID } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { isPlatformBrowser } from '@angular/common';
import { Subject, Observable } from 'rxjs';
import { LoginDialogComponent } from '../auth/login/login-dialog';
import { RegisterDialogComponent } from '../auth/register/register-dialog';
import { ForgotPasswordDialogComponent } from '../auth/forgot-password/forgot-password-dialog';
import { VerifyEmailDialogComponent } from '../auth/verify-email/verify-email-dialog';
// import { CreateSupportTicketComponent } from '../support/create-ticket/create-support-ticket.component';

@Injectable({ providedIn: 'root' })
export class AuthDialogService {
  private dialogOpened = false;
  private loginSuccessSubject = new Subject<void>();
  
  // Observable để các component khác có thể subscribe
  public loginSuccess$ = this.loginSuccessSubject.asObservable();

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
      panelClass: ['dialog-panel-bg', 'high-z-index'],
      backdropClass: 'high-z-backdrop'
    });
    dialogRef.afterClosed().subscribe((result) => {
      this.dialogOpened = false;
      // Nếu đăng nhập thành công, emit event
      if (result === 'success') {
        this.loginSuccessSubject.next();
      }
    });
  }

  // Method để emit login success từ login component
  notifyLoginSuccess(): void {
    this.loginSuccessSubject.next();
  }

  openRegisterDialog(): void {
    if (this.dialogOpened) return;
    this.dialogOpened = true;
    const dialogRef = this.dialog.open(RegisterDialogComponent, {
      width: '420px',
      disableClose: true,
      panelClass: ['dialog-panel-bg', 'high-z-index'],
      backdropClass: 'high-z-backdrop'
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
      panelClass: ['dialog-panel-bg', 'high-z-index'],
      backdropClass: 'high-z-backdrop'
    });
    dialogRef.afterClosed().subscribe(() => {
      this.dialogOpened = false;
    });
  }

  openVerifyEmailDialog(email: string): void {
    this.dialogOpened = true;
    const dialogRef = this.dialog.open(VerifyEmailDialogComponent, {
      width: '500px',
      disableClose: true,
      panelClass: ['dialog-panel-bg', 'high-z-index'],
      backdropClass: 'high-z-backdrop'
    });
    
    // Set email for the component
    const componentInstance = dialogRef.componentInstance;
    componentInstance.setEmail(email);
    
    dialogRef.afterClosed().subscribe(() => {
      this.dialogOpened = false;
    });
  }

  // openSupportTicketDialog(): void {
  //   if (this.dialogOpened) return;
  //   this.dialogOpened = true;
  //   const dialogRef = this.dialog.open(CreateSupportTicketComponent, {
  //     width: '500px',
  //     disableClose: true,
  //     panelClass: ['dialog-panel-bg', 'high-z-index'],
  //     backdropClass: 'high-z-backdrop'
  //   });
  //   
  //   dialogRef.afterClosed().subscribe(() => {
  //     this.dialogOpened = false;
  //   });
  // }
}
