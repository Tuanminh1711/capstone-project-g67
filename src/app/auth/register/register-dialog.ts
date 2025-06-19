import { Component, Optional, ChangeDetectorRef } from '@angular/core';
import { MatDialogRef } from '@angular/material/dialog';
import { FormsModule } from '@angular/forms';
import { NgIf } from '@angular/common';
import { AuthService, RegisterRequest, RegisterResponse } from '../auth.service';
import { AuthDialogService } from '../auth-dialog.service';

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
      this.errorMsg = 'Vui lòng nhập đầy đủ thông tin.';
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
        this.successMsg = res.message || 'Đăng ký thành công!';
        this.loading = false;
        this.cdRef.detectChanges();
        setTimeout(() => {
          if (this.dialogRef) {
            this.dialogRef.close();
          } else {
            window.location.href = '/login';
          }
        }, 600);
      },
      error: (err) => {
        this.loading = false;
        if (err && err.error && err.error.message) {
          this.errorMsg = err.error.message;
        } else if (err && err.error && typeof err.error === 'string') {
          this.errorMsg = err.error;
        } else if (err && err.status) {
          this.errorMsg = `Đăng ký thất bại (status: ${err.status})`;
        } else {
          this.errorMsg = 'Đăng ký thất bại!';
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
