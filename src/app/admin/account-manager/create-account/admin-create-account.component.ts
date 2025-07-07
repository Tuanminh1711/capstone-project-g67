import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AdminCreateAccountService } from './admin-create-account.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-admin-create-account',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './admin-create-account.component.html',
  styleUrls: ['./admin-create-account.component.scss']
})
export class AdminCreateAccountComponent {
  username = '';
  password = '';
  confirmPassword = '';
  fullName = '';
  email = '';
  phoneNumber = '';
  livingEnvironment = '';
  gender: 'male' | 'female' | 'other' = 'male';
  roleId: number = 3; // USER mặc định
  errorMsg = '';
  successMsg = '';

  constructor(private createAccountService: AdminCreateAccountService, private router: Router) {}

  onSubmit() {
    this.errorMsg = '';
    this.successMsg = '';
    if (!this.username || !this.password || !this.confirmPassword || !this.fullName || !this.email || !this.phoneNumber || !this.livingEnvironment || !this.gender || !this.roleId) {
      this.errorMsg = 'Vui lòng nhập đầy đủ thông tin.';
      return;
    }
    if (this.password.length < 6) {
      this.errorMsg = 'Mật khẩu phải có ít nhất 6 ký tự.';
      return;
    }
    if (this.password !== this.confirmPassword) {
      this.errorMsg = 'Mật khẩu nhập lại không khớp.';
      return;
    }
    const data = {
      username: this.username,
      password: this.password,
      fullName: this.fullName,
      email: this.email,
      phoneNumber: this.phoneNumber,
      livingEnvironment: this.livingEnvironment,
      gender: this.gender,
      roleId: this.roleId
    };
    this.createAccountService.addUser(data).subscribe({
      next: (res) => {
        this.successMsg = 'Tạo tài khoản thành công!';
        this.errorMsg = '';
        setTimeout(() => {
          this.router.navigate(['/admin/accounts'], { queryParams: { successMsg: this.successMsg } });
        }, 800);
      },
      error: (err) => {
        if (err && err.error && err.error.message) {
          this.errorMsg = err.error.message;
        } else if (err && err.error && typeof err.error === 'string') {
          this.errorMsg = err.error;
        } else if (err && err.status) {
          this.errorMsg = `Tạo tài khoản thất bại (status: ${err.status})`;
        } else {
          this.errorMsg = 'Tạo tài khoản thất bại!';
        }
      }
    });
  }
}
