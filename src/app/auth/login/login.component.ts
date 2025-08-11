import { Component, Optional, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ToastService } from '../../shared/toast/toast.service';
import { MatDialogRef } from '@angular/material/dialog';
import { AuthService } from '../auth.service';
import { FormsModule } from '@angular/forms';
import { AuthDialogService } from '../auth-dialog.service';
import { JwtUserUtilService } from '../jwt-user-util.service';
import { jwtDecode } from 'jwt-decode';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [FormsModule, CommonModule],
  styleUrl: './login.scss',
  templateUrl: './login-dialog.html',
})
export class LoginComponent {
  showPassword = false;
  // Dịch các message lỗi phổ biến sang tiếng Việt
  private translateErrorMessage(msg: string): string {
    if (!msg) return '';
   const loginErrorMap: { [key: string]: string } = {
  'username wrong!': 'Tên đăng nhập không đúng.',
  'password wrong!': 'Mật khẩu không đúng.',
  'password wrong': 'Mật khẩu không đúng.',
  'tài khoản của bạn đã bị khóa vĩnh viễn do vi phạm chính sách.':
    'Tài khoản của bạn đã bị khóa vĩnh viễn do vi phạm chính sách.',
  'tài khoản đã bị khóa vĩnh viễn do vi phạm chính sách.':
    'Tài khoản đã bị khóa vĩnh viễn do vi phạm chính sách.',
  'chỉ tài khoản người dùng (user, vip) mới được phép đăng nhập ở đây.':
    'Chỉ tài khoản người dùng (USER, VIP) mới được phép đăng nhập tại đây.',
  'chỉ tài khoản admin hoặc staff mới được phép đăng nhập ở đây.':
    'Chỉ tài khoản ADMIN hoặc STAFF mới được phép đăng nhập tại đây.',
  'chỉ tài khoản expert hoặc staff mới được phép đăng nhập ở đây.':
    'Chỉ tài khoản EXPERT hoặc STAFF mới được phép đăng nhập tại đây.',
  'tài khoản của bạn chưa xác thực, vui lòng kiểm tra email hoặc gửi lại mã xác minh.':
    'Tài khoản của bạn chưa xác thực. Vui lòng kiểm tra email hoặc gửi lại mã xác minh.',
};
    const msgNorm = msg.trim().toLowerCase();
    // Tìm lỗi khớp tuyệt đối
    if (loginErrorMap[msgNorm]) return loginErrorMap[msgNorm];
    // Tìm lỗi khớp một phần (chứa chuỗi, không phân biệt hoa thường)
    for (const key of Object.keys(loginErrorMap)) {
      if (msgNorm.includes(key)) return loginErrorMap[key];
    }
    return msg;
  }
  username = '';
  password = '';
  rememberMe = false;
  loading = false;
  // errorMsg = '';
  // successMsg = '';

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
    // this.errorMsg = '';
    // this.successMsg = '';
    if (!this.username || !this.password) {
      this.toast.error(this.capitalizeFirstLetter('Vui lòng nhập đầy đủ thông tin.'));
      this.loading = false;
      this.cdRef.detectChanges();
      return;
    }
    this.loading = true;
    this.cdRef.detectChanges();
    this.auth.login({ username: this.username, password: this.password }).subscribe({
      next: (res) => {
        this.loading = false;
        const token = res?.accessToken || res?.token;
        if (token) {
          // Nếu có message lỗi, ưu tiên báo lỗi
          if (res.message && res.message.toLowerCase().includes('error')) {
            this.toast.error(this.translateErrorMessage(res.message));
            this.cdRef.detectChanges();
            return;
          }
          // Kiểm tra role, không cho phép staff, admin, expert đăng nhập qua login thường
          const role = this.jwtUserUtil.getRoleFromToken();
          if (role && ['admin', 'staff', 'expert'].includes(role.toLowerCase())) {
            this.toast.error('Tài khoản này không được phép đăng nhập tại đây.');
            this.auth.logout();
            this.cdRef.detectChanges();
            return;
          }
          this.toast.success('Đăng nhập thành công!');
          this.cdRef.detectChanges();
          setTimeout(() => {
            if (this.dialogRef) {
              this.dialogRef.close();
              window.location.reload();
            } else {
              window.location.href = '/home';
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
              this.toast.error('Không thể gửi lại mã xác thực. Vui lòng thử lại sau.');
              this.cdRef.detectChanges();
            }
          });
        } else {
          // Nếu có message lỗi khác
          if (res && res.message) {
            this.toast.error(res.message);
          }
          this.cdRef.detectChanges();
        }
      },
      error: (err) => {
        this.loading = false;
        // Nếu tài khoản chưa xác thực, mở dialog xác thực lại email và hiện toast lỗi
        if (err && err.status === 401 && err.error && err.error.requiresVerification && err.error.email) {
          const originalMsg = (err.error && err.error.message) ? err.error.message : 'Tài khoản chưa xác thực, vui lòng kiểm tra email để xác thực!';
          this.toast.error(this.translateErrorMessage(originalMsg));
          if (this.dialogRef) {
            this.dialogRef.close();
          }
          this.authDialogService.openVerifyEmailDialog(err.error.email);
        } else {
          let msg = '';
          if (err && err.error && err.error.message) {
            msg = err.error.message;
          } else if (err && err.error && typeof err.error === 'string') {
            msg = err.error;
          }
          // Nếu vẫn chưa có, lấy err.message nếu là string và khác rỗng
          if (!msg && err && typeof err.message === 'string' && err.message.trim()) {
            msg = err.message;
          }
          if (msg) {
            this.toast.error(this.translateErrorMessage(msg));
          } else {
            this.toast.error('Tên tài khoản hoặc mật khẩu không đúng!');
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
  // Chỉ viết hoa chữ cái đầu cho message lỗi từ API

  private capitalizeFirstLetter(str: string): string {
    if (!str) return '';
    return str.charAt(0).toUpperCase() + str.slice(1);
  }

  togglePassword(input: HTMLInputElement) {
  input.type = input.type === 'password' ? 'text' : 'password';
}

}
