import { Component, Optional, ChangeDetectorRef } from '@angular/core';
import { ToastService } from '../../shared/toast.service';
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
    private toast: ToastService,
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
        this.loading = false;
        if (res && res.token) {
          this.successMsg = 'Đăng nhập thành công!';
          this.cdRef.detectChanges();
          setTimeout(() => {
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
        } else if (res && res.requiresVerification && res.email) {
          // Nếu chưa xác thực, gọi resend-verification rồi mở dialog xác thực email
          this.auth.resendVerificationEmail(res.email).subscribe({
            next: () => {
              if (res && res.message) {
                this.toast.error(res.message);
              } else {
                this.toast.error('Tài khoản chưa xác thực, vui lòng kiểm tra email để xác thực!');
              }
              if (this.dialogRef) {
                this.dialogRef.close();
              }
              this.authDialogService.openVerifyEmailDialog(res.email as string);
            },
            error: () => {
              this.errorMsg = 'Không thể gửi lại mã xác thực. Vui lòng thử lại sau.';
              this.cdRef.detectChanges();
            }
          });
        } else {
          // Nếu có message lỗi khác
          this.errorMsg = res && res.message ? res.message : 'Đăng nhập thất bại!';
          this.cdRef.detectChanges();
        }
      },
      error: (err) => {
        this.loading = false;
        // Nếu tài khoản chưa xác thực, mở dialog xác thực lại email và hiện toast lỗi
        if (err && err.status === 401 && err.error && err.error.requiresVerification && err.error.email) {
          this.toast.error(
            (err.error && err.error.message) ? err.error.message : 'Tài khoản chưa xác thực, vui lòng kiểm tra email để xác thực!'
          );
          if (this.dialogRef) {
            this.dialogRef.close();
          }
          this.authDialogService.openVerifyEmailDialog(err.error.email);
        } else {
          if (err && err.error && err.error.message) {
            this.errorMsg = err.error.message;
          } else if (err && err.error && typeof err.error === 'string') {
            this.errorMsg = err.error;
          } else if (err && err.status) {
            this.errorMsg = `Đăng nhập thất bại (status: ${err.status})`;
          } else {
            this.errorMsg = 'Đăng nhập thất bại!';
          }
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
