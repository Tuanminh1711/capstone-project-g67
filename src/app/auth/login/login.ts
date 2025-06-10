import { Component, Optional } from '@angular/core';
import { MatDialogRef } from '@angular/material/dialog';
import { AuthService, LoginRequest } from '../auth.service';
import { FormsModule } from '@angular/forms';
import { NgIf } from '@angular/common';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [FormsModule, NgIf],
  templateUrl: './login.html',
  styleUrl: './login.css'
})
export class Login {
  username = '';
  password = '';
  loading = false;
  errorMsg = '';

  constructor(
    private auth: AuthService,
    @Optional() private dialogRef?: MatDialogRef<Login>
  ) {}

  close() {
    if (this.dialogRef) {
      this.dialogRef.close();
    }
  }

  onSubmit() {
    this.errorMsg = '';
    if (!this.username || !this.password) {
      this.errorMsg = 'Vui lòng nhập đầy đủ thông tin.';
      return;
    }
    this.loading = true;
    const data: LoginRequest = { username: this.username, password: this.password };
    this.auth.login(data).subscribe({
      next: (res) => {
        // Lưu token, đóng dialog, chuyển trang nếu cần
        localStorage.setItem('token', res.token);
        this.close();
      },
      error: (err) => {
        this.errorMsg = 'Đăng nhập thất bại!';
        this.loading = false;
      },
      complete: () => {
        this.loading = false;
      }
    });
  }
}
