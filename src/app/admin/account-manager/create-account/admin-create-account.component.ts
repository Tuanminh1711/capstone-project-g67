import { Component, ChangeDetectorRef } from '@angular/core';
import { BaseAdminListComponent } from '../../shared/base-admin-list.component';
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
  isSubmitting = false;

  private translateErrorMessage(msg: string): string {
    const map: { [key: string]: string } = {
      'fullname must not contain numbers or special characters': 'Họ và tên không được chứa số hoặc ký tự đặc biệt.',
      'username must be not blank': 'Tên đăng nhập không được để trống.',
      'email invalid format! please try again': 'Email không đúng định dạng, vui lòng thử lại.',
      'password must be at least 8 characters': 'Mật khẩu phải có ít nhất 8 ký tự.',
      'password must contain at least 8 characters, including uppercase, lowercase, number and special character': 'Mật khẩu phải có ít nhất 8 ký tự, bao gồm chữ hoa, chữ thường, số và ký tự đặc biệt.',
      'fullName must not be blank': 'Họ và tên không được để trống.',
      'fullName must not contain numbers or special characters': 'Họ và tên không được chứa số hoặc ký tự đặc biệt.',
      'phone invalid format! please try again': 'Số điện thoại không đúng định dạng, vui lòng thử lại.',
      'roleId must not be null': 'Bạn phải chọn vai trò cho tài khoản.',
      'username already exists': 'Tên đăng nhập đã tồn tại.',
      'email already exists': 'Email đã được sử dụng.',
      'invalid email format': 'Định dạng email không hợp lệ.',
      'invalid payload': 'Dữ liệu gửi lên không hợp lệ.',
      'user not found': 'Không tìm thấy người dùng.',
      'invalid username or password': 'Tên đăng nhập hoặc mật khẩu không đúng.',
      'account is not verified': 'Tài khoản chưa được xác thực.',
      'account is locked': 'Tài khoản đã bị khóa.',
      'phone number already exists': 'Số điện thoại đã được sử dụng.',
      'password wrong!': 'Mật khẩu không đúng!',
      'username wrong!': 'Tên đăng nhập không đúng!'
    };
    const msgNorm = msg.trim().toLowerCase();
    return map[msgNorm] || msg;
  }
  showPassword = false;
  username = '';
  password = '';
  fullName = '';
  email = '';
  phoneNumber = '';
  gender: 'male' | 'female' | 'other' = 'male';
  roleId: number = 2; // Staff mặc định (vì dropdown chỉ có Staff và Expert)
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
    if (!this.username || !this.password || !this.fullName || !this.email || !this.phoneNumber || !this.gender || !this.roleId) {
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
    if (this.isSubmitting) return;
    
    this.isSubmitting = true;
    this.setLoading(true); // Set loading state
    this.setError('');
    this.setSuccess('');
    const errMsg = this.validateForm();
    if (errMsg) {
      this.toastService.error(this.translateErrorMessage(errMsg));
      this.isSubmitting = false;
      this.setLoading(false); // Reset loading state
      return;
    }
    const body = {
      username: this.username,
      password: this.password,
      fullName: this.fullName,
      email: this.email,
      phoneNumber: this.phoneNumber,
      gender: this.gender,
      roleId: this.roleId
    };
    this.createAccountService.addUser(body).subscribe({
      next: (res) => {
        console.log('Create account response:', res);
        
        // Kiểm tra response từ backend
        // Nếu status/code không phải 200/201 hoặc có message lỗi thì hiển thị toast lỗi
        const status = res?.status ?? res?.code;
        const message = res?.message || '';
        
        // Kiểm tra nếu có lỗi từ backend (status lỗi hoặc có message lỗi)
        if (status !== 200 && status !== 201) {
          let errorMsg = message || 'Tạo tài khoản thất bại!';
          const msgNorm = typeof errorMsg === 'string' ? errorMsg.trim().toLowerCase() : '';
          
          // Reset trạng thái trước khi hiển thị lỗi
          this.isSubmitting = false;
          this.setLoading(false);
          this.setError(this.translateErrorMessage(msgNorm));
          
          // Hiển thị toast lỗi
          this.toastService.error(this.translateErrorMessage(msgNorm));
          this.cdr.detectChanges();
          return;
        }
        
        // Kiểm tra nếu có message lỗi mặc dù status có thể là 200
        if (message && typeof message === 'string' && 
            (message.toLowerCase().includes('error') || 
             message.toLowerCase().includes('fail') || 
             message.toLowerCase().includes('thất bại') ||
             message.toLowerCase().includes('lỗi') ||
             message.toLowerCase().includes('already exists') ||
             message.toLowerCase().includes('invalid') ||
             message.toLowerCase().includes('not found') ||
             message.toLowerCase().includes('unauthorized') ||
             message.toLowerCase().includes('forbidden'))) {
          const msgNorm = message.trim().toLowerCase();
          
          // Reset trạng thái trước khi hiển thị lỗi
          this.isSubmitting = false;
          this.setLoading(false);
          this.setError(this.translateErrorMessage(msgNorm));
          
          // Hiển thị toast lỗi
          this.toastService.error(this.translateErrorMessage(msgNorm));
          this.cdr.detectChanges();
          return;
        }
        
        // Thành công - chỉ khi không có lỗi nào
        this.isSubmitting = false;
        this.setLoading(false);
        this.toastService.success('Tạo tài khoản thành công!');
        this.setSuccess('Tạo tài khoản thành công!');
        this.setError('');
        this.username = '';
        this.password = '';
        this.fullName = '';
        this.email = '';
        this.phoneNumber = '';
        this.gender = 'male';
        this.roleId = 2; // Reset về Staff
        this.cdr.detectChanges();
        setTimeout(() => {
          this.router.navigate(['/admin/accounts']);
        }, 800);
      },
      error: (err) => {
        this.isSubmitting = false;
        this.setLoading(false); // Reset loading state
        console.error('Create account error:', err);
        
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
        const msgNorm = typeof msg === 'string' ? msg.trim().toLowerCase() : '';
        this.toastService.error(this.translateErrorMessage(msgNorm));
        this.setError(this.translateErrorMessage(msgNorm));
        this.cdr.detectChanges();
      }
    });
  }
}
