import { Component } from '@angular/core';
import { BaseAdminListComponent } from '../../../shared/base-admin-list.component';
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
export class AdminCreateAccountComponent extends BaseAdminListComponent {
  username = '';
  password = '';
  confirmPassword = '';
  fullName = '';
  email = '';
  phoneNumber = '';
  livingEnvironment = '';
  gender: 'male' | 'female' | 'other' = 'male';
  roleId: number = 3; // USER mặc định
  // errorMsg and successMsg handled by BaseAdminListComponent

  constructor(private createAccountService: AdminCreateAccountService, private router: Router) {
    super();
  }

  onSubmit() {
    this.setError('');
    this.setSuccess('');
    if (!this.username || !this.password || !this.confirmPassword || !this.fullName || !this.email || !this.phoneNumber || !this.livingEnvironment || !this.gender || !this.roleId) {
      this.setError('Vui lòng nhập đầy đủ thông tin.');
      return;
    }
    if (this.password.length < 6) {
      this.setError('Mật khẩu phải có ít nhất 6 ký tự.');
      return;
    }
    if (this.password !== this.confirmPassword) {
      this.setError('Mật khẩu nhập lại không khớp.');
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
        this.setSuccess('Tạo tài khoản thành công!');
        this.setError('');
        setTimeout(() => {
          this.router.navigate(['/admin/accounts'], { queryParams: { successMsg: this.successMsg } });
        }, 800);
      },
      error: (err) => {
        if (err && err.error && err.error.message) {
          this.setError(err.error.message);
        } else if (err && err.error && typeof err.error === 'string') {
          this.setError(err.error);
        } else if (err && err.status) {
          this.setError(`Tạo tài khoản thất bại (status: ${err.status})`);
        } else {
          this.setError('Tạo tài khoản thất bại!');
        }
      }
    });
  }
}
