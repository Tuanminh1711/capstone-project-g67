import { Component, Optional, OnInit, ChangeDetectorRef } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { CommonModule } from '@angular/common';
import { AuthDialogService } from '../auth-dialog.service';
import { ToastService } from '../../shared/toast/toast.service';

@Component({
  selector: 'app-forgot-password-dialog',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, MatDialogModule],
  templateUrl: './forgot-password-dialog.html',
  styleUrls: ['../login/login.scss']
})
export class ForgotPasswordDialogComponent implements OnInit {
  get codeInputLength(): number {
    return this.codeInputs.map(i => i.value).join('').length;
  }
  
  forgotPasswordForm: FormGroup;
  codeForm: FormGroup;
  passwordForm: FormGroup;
  codeInputs: { value: string }[] = [
    { value: '' }, { value: '' }, { value: '' }, { value: '' }, { value: '' }, { value: '' }
  ];
  successMessage: string = '';
  errorMessage: string = '';
  step: 'email' | 'code' | 'password' = 'email';
  emailSent: string = '';
  isLoading: boolean = false;

  constructor(
    private fb: FormBuilder,
    private authDialogService: AuthDialogService,
    private toast: ToastService,
    private cdr: ChangeDetectorRef,
    @Optional() private dialogRef?: MatDialogRef<ForgotPasswordDialogComponent>
  ) {
    this.forgotPasswordForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]]
    });
    this.codeForm = this.fb.group({
      code: ['', [Validators.required, Validators.minLength(6), Validators.maxLength(6)]]
    });
    this.passwordForm = this.fb.group({
      newPassword: ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: ['', [Validators.required]]
    }, { validators: this.passwordMatchValidator });
  }

  ngOnInit() {
    // Component initialization
  }

  // Custom validator để kiểm tra mật khẩu khớp nhau
  private passwordMatchValidator(form: FormGroup) {
    const newPassword = form.get('newPassword')?.value;
    const confirmPassword = form.get('confirmPassword')?.value;
    
    return newPassword === confirmPassword ? null : { passwordMismatch: true };
  }

  close() {
    if (this.dialogRef) {
      this.dialogRef.close();
    }
  }

  goToLogin() {
    if (this.dialogRef) {
      const sub = this.dialogRef.afterClosed().subscribe(() => {
        this.authDialogService.openLoginDialog();
        sub.unsubscribe();
      });
      this.dialogRef.close();
    } else {
      setTimeout(() => this.authDialogService.openLoginDialog(), 100);
    }
  }

  onSubmit() {
    if (this.forgotPasswordForm.valid) {
      this.isLoading = true;
      this.errorMessage = '';
      const email = this.forgotPasswordForm.value.email;
      
      this.authDialogService.authService.forgotPassword(email).subscribe({
        next: () => {
          this.toast?.success('Đã gửi mã xác nhận tới email của bạn!');
          this.emailSent = email;
          this.step = 'code';
          this.forgotPasswordForm.reset();
          this.isLoading = false;
          this.cdr.detectChanges();
        },
        error: (err: any) => {
          this.errorMessage = err?.error?.message || 'Gửi email thất bại!';
          this.toast?.error(this.errorMessage);
          this.isLoading = false;
          this.cdr.detectChanges();
        }
      });
    }
  }

  onVerifyCode() {
    const code = this.codeInputs.map(i => i.value).join('');
    
    if (code.length === 6 && this.emailSent) {
      this.isLoading = true;
      this.errorMessage = '';
      
      this.authDialogService.authService.verifyResetCode(this.emailSent, code).subscribe({
        next: (response) => {
          this.toast?.success('Mã xác nhận hợp lệ! Bạn có thể đặt lại mật khẩu.');
          
          // Chuyển sang bước nhập mật khẩu mới
          this.step = 'password';
          this.isLoading = false;
          
          // Reset form mật khẩu
          this.passwordForm.reset();
          
          // Force change detection để UI cập nhật
          this.cdr.detectChanges();
        },
        error: (err: any) => {
          this.errorMessage = err?.error?.message || 'Mã xác nhận không đúng hoặc đã hết hạn!';
          this.toast?.error(this.errorMessage);
          this.isLoading = false;
          this.cdr.detectChanges();
        }
      });
    } else {
      this.errorMessage = 'Vui lòng nhập đủ 6 chữ số';
      this.toast?.error(this.errorMessage);
    }
  }

  onDigitInput(event: KeyboardEvent, index: number) {
    const input = event.key;
    const target = event.target as HTMLInputElement;
    
    if (/^[0-9]$/.test(input)) {
      this.codeInputs[index].value = input;
      target.value = input;
      
      // Chuyển focus đến ô tiếp theo
      const next = document.getElementById('code-digit-' + (index + 1));
      if (next) (next as HTMLInputElement).focus();
      event.preventDefault();
    } else if (input === 'Backspace') {
      this.codeInputs[index].value = '';
      target.value = '';
      
      // Chuyển focus về ô trước đó
      const prev = document.getElementById('code-digit-' + (index - 1));
      if (prev) (prev as HTMLInputElement).focus();
      event.preventDefault();
    } else if (input.length === 1) {
      event.preventDefault();
    }
  }

  onDigitPaste(event: ClipboardEvent, index: number) {
    const paste = event.clipboardData?.getData('text') || '';
    
    if (/^[0-9]{6}$/.test(paste)) {
      for (let i = 0; i < 6; i++) {
        this.codeInputs[i].value = paste[i];
        const el = document.getElementById('code-digit-' + i);
        if (el) (el as HTMLInputElement).value = paste[i];
      }
      
      const last = document.getElementById('code-digit-5');
      if (last) (last as HTMLInputElement).focus();
      event.preventDefault();
    } else if (/^[0-9]{1,6}$/.test(paste)) {
      for (let i = 0; i < paste.length && (index + i) < 6; i++) {
        this.codeInputs[index + i].value = paste[i];
        const el = document.getElementById('code-digit-' + (index + i));
        if (el) (el as HTMLInputElement).value = paste[i];
      }
      
      const nextFocus = document.getElementById('code-digit-' + Math.min(index + paste.length, 5));
      if (nextFocus) (nextFocus as HTMLInputElement).focus();
      event.preventDefault();
    }
  }

  onPasswordSubmit() {
    if (this.passwordForm.valid && this.emailSent) {
      const newPassword = this.passwordForm.value.newPassword;
      const confirmPassword = this.passwordForm.value.confirmPassword;
      
      if (newPassword !== confirmPassword) {
        this.toast?.error('Mật khẩu xác nhận không khớp!');
        return;
      }
      
      this.isLoading = true;
      this.errorMessage = '';
      const code = this.codeInputs.map(i => i.value).join('');
      
      this.authDialogService.authService.resetPassword(this.emailSent, code, newPassword).subscribe({
        next: () => {
          this.toast?.success('Đặt lại mật khẩu thành công!');
          
          // Redirect to login dialog after successful password change
          this.goToLogin();
        },
        error: (err: any) => {
          this.errorMessage = err?.error?.message || 'Đặt lại mật khẩu thất bại!';
          this.toast?.error(this.errorMessage);
          this.isLoading = false;
          this.cdr.detectChanges();
        }
      });
    }
  }

  onCodeKeyPress(event: KeyboardEvent) {
    const charCode = event.key.charCodeAt(0);
    
    // Chỉ cho nhập số
    if (charCode < 48 || charCode > 57) {
      event.preventDefault();
    }
  }

  // Reset form khi chuyển step
  resetCodeInputs() {
    this.codeInputs.forEach(input => input.value = '');
    this.errorMessage = '';
  }

  // Quay lại bước trước
  goBack() {
    if (this.step === 'code') {
      this.step = 'email';
      this.emailSent = '';
      this.resetCodeInputs();
      this.cdr.detectChanges();
    } else if (this.step === 'password') {
      this.step = 'code';
      this.passwordForm.reset();
      this.cdr.detectChanges();
    }
  }
}
