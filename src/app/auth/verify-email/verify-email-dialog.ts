import { Component, Optional, ChangeDetectorRef, ViewChild, ElementRef, AfterViewInit, OnDestroy } from '@angular/core';
import { MatDialogRef } from '@angular/material/dialog';
import { FormsModule } from '@angular/forms';
import { NgIf } from '@angular/common';
import { AuthService, VerifyEmailRequest, VerifyEmailResponse } from '../auth.service';
import { AuthDialogService } from '../auth-dialog.service';
import { ToastService } from '../../shared/toast.service';

@Component({
  selector: 'app-verify-email-dialog',
  standalone: true,
  imports: [FormsModule, NgIf],
  templateUrl: './verify-email-dialog.html',
  styleUrls: ['./verify-email.scss']
})
export class VerifyEmailDialogComponent implements AfterViewInit, OnDestroy {
  @ViewChild('input0') input0!: ElementRef<HTMLInputElement>;
  
  email = '';
  otpDigits: string[] = ['', '', '', '', '', ''];
  loading = false;
  resendLoading = false;
  countdown = 0;
  private countdownInterval?: any;
  errorMsg: string = '';

  constructor(
    private authService: AuthService,
    private cdRef: ChangeDetectorRef,
    private authDialogService: AuthDialogService,
    private toast: ToastService,
    @Optional() private dialogRef?: MatDialogRef<VerifyEmailDialogComponent>
  ) {}

  ngAfterViewInit() {
    // Focus vào ô đầu tiên
    setTimeout(() => {
      if (this.input0) {
        this.input0.nativeElement.focus();
      }
    }, 100);
  }

  ngOnDestroy() {
    if (this.countdownInterval) {
      clearInterval(this.countdownInterval);
    }
  }

  close() {
    if (this.dialogRef) {
      this.dialogRef.close();
    }
  }

  onOtpInput(event: any, index: number) {
    const value = event.target.value;
    
    // Chỉ cho phép số
    if (!/^\d$/.test(value) && value !== '') {
      event.target.value = '';
      this.otpDigits[index] = '';
      return;
    }

    this.otpDigits[index] = value;
    
    // Tự động chuyển đến ô tiếp theo
    if (value && index < 5) {
      const nextInput = event.target.parentElement.children[index + 1];
      if (nextInput) {
        nextInput.focus();
      }
    }
  }

  onKeyDown(event: KeyboardEvent, index: number) {
    // Xử lý phím Backspace
    if (event.key === 'Backspace' && !this.otpDigits[index] && index > 0) {
      const prevInput = (event.target as HTMLElement).parentElement?.children[index - 1] as HTMLInputElement;
      if (prevInput) {
        prevInput.focus();
        this.otpDigits[index - 1] = '';
      }
    }
    
    // Xử lý phím mũi tên
    if (event.key === 'ArrowLeft' && index > 0) {
      const prevInput = (event.target as HTMLElement).parentElement?.children[index - 1] as HTMLInputElement;
      if (prevInput) {
        prevInput.focus();
      }
    }
    
    if (event.key === 'ArrowRight' && index < 5) {
      const nextInput = (event.target as HTMLElement).parentElement?.children[index + 1] as HTMLInputElement;
      if (nextInput) {
        nextInput.focus();
      }
    }
  }

  isOtpComplete(): boolean {
    return this.otpDigits.every(digit => digit !== '');
  }

  getOtpCode(): string {
    return this.otpDigits.join('');
  }

  onSubmit() {
    if (!this.isOtpComplete()) {
      this.toast.error('Vui lòng nhập đầy đủ mã OTP');
      return;
    }
    this.loading = true;
    this.cdRef.detectChanges();
    const verifyData: VerifyEmailRequest = {
      email: this.email,
      otp: this.getOtpCode()
    };
    this.authService.verifyEmail(verifyData).subscribe({
      next: (res: VerifyEmailResponse) => {
        this.loading = false;
        this.toast.success(res.message || 'Xác thực email thành công!');
        this.cdRef.detectChanges();
        if (this.dialogRef) {
          this.dialogRef.afterClosed().subscribe(() => {
            this.authDialogService.openLoginDialog();
          });
          this.dialogRef.close();
        } else {
          this.authDialogService.openLoginDialog();
        }
      },
      error: (err: any) => {
        this.loading = false;
        console.error('API Verify Email Error:', err);
        if (err && err.error && err.error.message) {
          this.toast.error(err.error.message);
        } else if (err && err.error && typeof err.error === 'string') {
          this.toast.error(err.error);
        } else if (err && err.status) {
          this.toast.error(`Xác thực thất bại (status: ${err.status})`);
        } else {
          this.toast.error('Xác thực thất bại! Vui lòng thử lại.');
        }
        this.otpDigits = ['', '', '', '', '', ''];
        if (this.input0) {
          this.input0.nativeElement.focus();
        }
        this.cdRef.detectChanges();
      }
    });
  }

  resendOtp() {
    if (this.countdown > 0 || this.resendLoading) {
      return;
    }
    
    if (!this.email) {
      this.toast.error('Email không hợp lệ');
      return;
    }
    
    this.resendLoading = true;
    this.cdRef.detectChanges();
    
    this.authService.resendVerificationEmail(this.email).subscribe({
      next: (res: any) => {
        this.resendLoading = false;
        this.toast.success('Mã OTP mới đã được gửi đến email của bạn');
        this.startCountdown();
        // Reset OTP inputs để user nhập mã mới
        this.otpDigits = ['', '', '', '', '', ''];
        if (this.input0) {
          this.input0.nativeElement.focus();
        }
        this.cdRef.detectChanges();
      },
      error: (err: any) => {
        this.resendLoading = false;
        console.error('Resend OTP Error:', err);
        
        let errorMessage = 'Không thể gửi lại mã OTP. Vui lòng thử lại sau.';
        if (err && err.error && err.error.message) {
          errorMessage = err.error.message;
        } else if (err && err.error && typeof err.error === 'string') {
          errorMessage = err.error;
        } else if (err && err.status === 429) {
          errorMessage = 'Bạn đã gửi quá nhiều yêu cầu. Vui lòng thử lại sau.';
        } else if (err && err.status === 400) {
          errorMessage = 'Email không hợp lệ hoặc đã được xác thực.';
        }
        
        this.toast.error(errorMessage);
        this.cdRef.detectChanges();
      }
    });
  }

  private startCountdown() {
    this.countdown = 60; // 60 giây
    this.countdownInterval = setInterval(() => {
      this.countdown--;
      if (this.countdown <= 0) {
        clearInterval(this.countdownInterval);
      }
      this.cdRef.detectChanges();
    }, 1000);
  }

  // Method để set email từ component cha
  setEmail(email: string) {
    this.email = email;
    this.startCountdown(); // Bắt đầu đếm ngược khi mở dialog
  }
}
