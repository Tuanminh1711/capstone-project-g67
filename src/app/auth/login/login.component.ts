import { Component, Optional, ChangeDetectorRef } from '@angular/core';
import { MatDialogRef } from '@angular/material/dialog';
import { AuthService } from '../auth.service';
import { FormsModule } from '@angular/forms';
import { NgIf } from '@angular/common';

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
        localStorage.setItem('token', res.token);
        this.loading = false;
        this.cdRef.detectChanges();
        setTimeout(() => {
          if (this.dialogRef) {
            this.dialogRef.close();
          } else {
            window.location.href = '/home';
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
}
