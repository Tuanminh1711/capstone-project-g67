import { Component, ChangeDetectorRef } from '@angular/core';
import { BaseAdminListComponent } from '../../../shared/base-admin-list.component';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AdminCreateAccountService } from './admin-create-account.service';
import { Router } from '@angular/router';
import { ToastService } from '../../../shared/toast/toast.service';

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
  gender: 'male' | 'female' | 'other' = 'male';
  roleId: number = 3; // USER mặc định, cho phép chọn
  roles = [
    { id: 1, name: 'ADMIN' },
    { id: 2, name: 'STAFF' },
    { id: 3, name: 'USER' },
    { id: 4, name: 'GUEST' },
    { id: 5, name: 'EXPERT' }
  ];
  // errorMsg and successMsg handled by BaseAdminListComponent

  constructor(
    private createAccountService: AdminCreateAccountService,
    private router: Router,
    private toastService: ToastService,
    private cdr: ChangeDetectorRef
  ) {
    super();
  }

  onSubmit() {
    this.setError('');
    this.setSuccess('');
    if (!this.username || !this.password || !this.confirmPassword || !this.fullName || !this.email || !this.phoneNumber || !this.gender || !this.roleId) {
      this.toastService.error('Vui lòng nhập đầy đủ thông tin.');
      return;
    }
    if (this.roleId === 4) {
      this.toastService.error('Không thể tạo tài khoản Guest!');
      return;
    }
    if (this.password.length < 6) {
      this.toastService.error('Mật khẩu phải có ít nhất 6 ký tự.');
      return;
    }
    if (this.password !== this.confirmPassword) {
      this.toastService.error('Mật khẩu nhập lại không khớp.');
      return;
    }
    const body = {
      username: this.username,
      password: this.password,
      confirmPassword: this.confirmPassword,
      fullName: this.fullName,
      email: this.email,
      phoneNumber: this.phoneNumber,
      gender: this.gender,
      roleId: this.roleId
    };
    this.createAccountService.addUser(body).subscribe({
      next: (res) => {
        this.toastService.success('Tạo tài khoản thành công!');
        this.setSuccess('Tạo tài khoản thành công!');
        this.setError('');
        // Sau khi tạo thành công, cập nhật lại data hoặc reload danh sách
        this.username = '';
        this.password = '';
        this.confirmPassword = '';
        this.fullName = '';
        this.email = '';
        this.phoneNumber = '';
        this.gender = 'male';
        this.roleId = 3;
        this.cdr.detectChanges();
        setTimeout(() => {
          this.router.navigate(['/admin/accounts'], { queryParams: { successMsg: this.successMsg } });
        }, 800);
      },
      error: (err) => {
        let msg = 'Tạo tài khoản thất bại!';
        if (err?.error?.message) {
          msg += ' ' + err.error.message;
        } else if (err?.error && typeof err.error === 'string') {
          msg += ' ' + err.error;
        } else if (err?.status) {
          msg += ` (status: ${err.status})`;
        }
        this.toastService.error(msg);
      }
    });
  }
}
