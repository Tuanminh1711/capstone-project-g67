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
  private translateErrorMessage(msg: string): string {
    const map: { [key: string]: string } = {
      'password must be at least 8 characters': 'Mật khẩu phải có ít nhất 8 ký tự',
      'password must be at least 6 characters': 'Mật khẩu phải có ít nhất 6 ký tự',
      'passwords do not match': 'Mật khẩu xác nhận không khớp',
      'username already exists': 'Tên đăng nhập đã tồn tại',
      'email already exists': 'Email đã được sử dụng',
      'invalid email format': 'Định dạng email không hợp lệ',
      'invalid payload': 'Dữ liệu gửi lên không hợp lệ',
      'user not found': 'Không tìm thấy người dùng',
      'invalid username or password': 'Tên đăng nhập hoặc mật khẩu không đúng',
      'account is not verified': 'Tài khoản chưa được xác thực',
      'account is locked': 'Tài khoản đã bị khóa',
      'phone number already exists': 'Số điện thoại đã được sử dụng',
      'password wrong!': 'Mật khẩu không đúng!',
      'username wrong!': 'Tên đăng nhập không đúng!',
      'password must contain at least 8 characters, including uppercase, lowercase, number and special character': 'Mật khẩu phải có ít nhất 8 ký tự, bao gồm chữ hoa, chữ thường, số và ký tự đặc biệt'
    };
    const msgNorm = msg.trim().toLowerCase();
    return map[msgNorm] || msg;
  }
  showPassword = false;
  showConfirmPassword = false;
  username = '';
  password = '';
  confirmPassword = '';
  passwordsMatch = true;

  checkPasswordsMatch() {
    this.passwordsMatch = this.password === this.confirmPassword;
  }
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

  validateForm(): string | null {
    if (!this.username || !this.password || !this.confirmPassword || !this.fullName || !this.email || !this.phoneNumber || !this.gender || !this.roleId) {
      return 'Vui lòng nhập đầy đủ thông tin.';
    }
    if (!/^[a-zA-Z0-9_]{4,32}$/.test(this.username)) {
      return 'Tên đăng nhập chỉ gồm chữ, số, gạch dưới và từ 4-32 ký tự.';
    }
    if (!/^.{8,}$/.test(this.password)) {
      return 'Mật khẩu phải có ít nhất 8 ký tự.';
    }
    if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^a-zA-Z0-9]).{8,}/.test(this.password)) {
      return 'Mật khẩu phải có chữ hoa, chữ thường, số và ký tự đặc biệt.';
    }

    if (!/^\S+@\S+\.\S+$/.test(this.email)) {
      return 'Email không hợp lệ.';
    }
    if (!/^\d{10}$/.test(this.phoneNumber)) {
      return 'Số điện thoại phải có 10 số.';
    }
    if (!this.fullName.trim()) {
      return 'Họ tên không được để trống.';
    }
    return null;
  }

  onSubmit() {
    this.setError('');
    this.setSuccess('');
    const errMsg = this.validateForm();
    if (errMsg) {
      this.toastService.error(this.translateErrorMessage(errMsg));
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
        // Nếu có message từ backend thì coi là lỗi, không có message thì coi là thành công
        if (res && res.message) {
          let msg = res.message || 'Tạo tài khoản thất bại!';
          this.toastService.error(this.translateErrorMessage(msg));
        } else {
          this.toastService.success('Tạo tài khoản thành công!');
          this.setSuccess('Tạo tài khoản thành công!');
          this.setError('');
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
        }
      },
      error: (err) => {
        let msg = '';
        // Ưu tiên lấy message từ backend
        if (err?.error?.message) {
          msg = err.error.message;
        } else if (err?.error && typeof err.error === 'string') {
          msg = err.error;
        } else if (err?.message) {
          msg = err.message;
        } else {
          msg = 'Tạo tài khoản thất bại!';
        }
        this.toastService.error(this.translateErrorMessage(msg));
      }
    });
  }
}
