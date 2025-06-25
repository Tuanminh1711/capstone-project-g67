import { Component, Optional, ChangeDetectorRef } from '@angular/core';
import { MatDialogRef } from '@angular/material/dialog';
import { AuthService } from '../auth.service';
import { FormsModule } from '@angular/forms';
import { NgIf } from '@angular/common';
import { AuthDialogService } from '../auth-dialog.service';
import { JwtUserUtilService } from '../jwt-user-util.service';
import { jwtDecode } from 'jwt-decode';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [FormsModule, NgIf],
  styleUrl: './login.scss',
  templateUrl: './login-dialog.html',
})
export class LoginComponent {
  username = '';
  password = '';
  rememberMe = false;
  loading = false;
  errorMsg = '';
  successMsg = '';

  constructor(
    private auth: AuthService,
    private cdRef: ChangeDetectorRef,
    private authDialogService: AuthDialogService,
    private jwtUserUtil: JwtUserUtilService,
    @Optional() private dialogRef?: MatDialogRef<LoginComponent>
  ) {}

  close() {
    if (this.dialogRef) {
      this.dialogRef.close();
    }
  }

  onSubmit() {
    this.errorMsg = '';
    this.successMsg = '';
    if (!this.username || !this.password) {
      this.errorMsg = 'Vui lòng nhập đầy đủ thông tin.';
      this.loading = false;
      this.cdRef.detectChanges();
      return;
    }
    this.loading = true;
    this.cdRef.detectChanges();
    this.auth.login({ username: this.username, password: this.password }).subscribe({
      next: (res) => {
        this.successMsg = 'Đăng nhập thành công!';
        // AuthService đã tự động lưu token vào cookie rồi, không cần lưu thủ công
        this.loading = false;
        this.cdRef.detectChanges();
        setTimeout(() => {
          // Lấy role từ token để điều hướng
          const role = this.jwtUserUtil.getRoleFromToken();
          
          if (role && role.toLowerCase() === 'admin') {
            window.location.href = '/admin';
          } else {
            if (this.dialogRef) {
              this.dialogRef.close();
              window.location.reload();
            } else {
              window.location.href = '/home';
            }
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
          this.errorMsg = `Đăng nhập thất bại (status: ${err.status})`;
        } else {
          this.errorMsg = 'Đăng nhập thất bại!';
        }
        this.cdRef.detectChanges();
      }
    });
  }

  openForgotPasswordDialog() {
    if (this.dialogRef) {
      this.dialogRef.afterClosed().subscribe(() => {
        this.authDialogService.openForgotPasswordDialog();
      });
      this.dialogRef.close();
    } else {
      this.authDialogService.openForgotPasswordDialog();
    }
  }

  openRegisterDialog() {
    if (this.dialogRef) {
      this.dialogRef.afterClosed().subscribe(() => {
        this.authDialogService.openRegisterDialog();
      });
      this.dialogRef.close();
    } else {
      this.authDialogService.openRegisterDialog();
    }
  }
}
