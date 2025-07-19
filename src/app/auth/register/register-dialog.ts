import { Component, Optional, ChangeDetectorRef } from '@angular/core';
import { MatDialogRef } from '@angular/material/dialog';
import { FormsModule } from '@angular/forms';
import { NgIf } from '@angular/common';
import { AuthService, RegisterRequest, RegisterResponse } from '../auth.service';
import { AuthDialogService } from '../auth-dialog.service';
import { ToastService } from '../../shared/toast/toast.service';

@Component({
  selector: 'app-register-dialog',
  standalone: true,
  imports: [FormsModule, NgIf],
  templateUrl: './register-dialog.html',
  styleUrls: ['./register.scss']
})
export class RegisterDialogComponent {
  username = '';
  email = '';
  password = '';
  confirmPassword = '';
  fullName = '';
  phone = '';
  loading = false;
  errorMsg = '';
  successMsg = '';

  constructor(
    private authService: AuthService,
    private cdRef: ChangeDetectorRef,
    private authDialogService: AuthDialogService,
    private toast: ToastService,
    @Optional() private dialogRef?: MatDialogRef<RegisterDialogComponent>
  ) {}

  close() {
    if (this.dialogRef) {
      this.dialogRef.close();
    }
  }

  onSubmit() {
    this.errorMsg = '';
    this.successMsg = '';
    if (!this.username || !this.fullName || !this.phone || !this.email || !this.password || !this.confirmPassword) {
      this.toast.error('Vui lòng nhập đầy đủ thông tin.');
      this.loading = false;
      this.cdRef.detectChanges();
      return;
    }
    this.loading = true;
    this.cdRef.detectChanges();
    const registerData: RegisterRequest = {
      username: this.username,
      fullName: this.fullName,
      phone: this.phone,
      email: this.email,
      password: this.password,
      confirmPassword: this.confirmPassword
    };
    this.authService.register(registerData).subscribe({
      next: (res) => {
        this.toast.success(res.message || 'Đăng ký thành công! Vui lòng kiểm tra email để xác thực tài khoản.');
        this.loading = false;
        this.cdRef.detectChanges();
        if (this.dialogRef) {
          this.dialogRef.afterClosed().subscribe(() => {
            this.authDialogService.openVerifyEmailDialog(this.email);
          });
          this.dialogRef.close();
        } else {
          this.authDialogService.openVerifyEmailDialog(this.email);
        }
      },
      error: (err) => {
        this.loading = false;
        console.error('API Register Error:', err);
        if (err && err.error && err.error.message) {
          this.toast.error(err.error.message);
        } else if (err && err.error && typeof err.error === 'string') {
          this.toast.error(err.error);
        } else if (err && err.status) {
          this.toast.error(`Đăng ký thất bại (status: ${err.status})`);
        } else {
          this.toast.error('Đăng ký thất bại!');
        }
        this.cdRef.detectChanges();
      }
    });
  }

  openLoginDialog() {
    if (this.dialogRef) {
      this.dialogRef.afterClosed().subscribe(() => {
        this.authDialogService.openLoginDialog();
      });
      this.dialogRef.close();
    } else {
      this.authDialogService.openLoginDialog();
    }
  }
}
