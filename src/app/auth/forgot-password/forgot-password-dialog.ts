import { Component, Optional } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { CommonModule } from '@angular/common';
import { AuthDialogService } from '../auth-dialog.service';

@Component({
  selector: 'app-forgot-password-dialog',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, MatDialogModule],
  templateUrl: './forgot-password-dialog.html',
  styleUrls: ['../login/login.scss']
})
export class ForgotPasswordDialogComponent {
  forgotPasswordForm: FormGroup;
  successMessage = '';

  constructor(private fb: FormBuilder, private authDialogService: AuthDialogService, @Optional() private dialogRef?: MatDialogRef<ForgotPasswordDialogComponent>) {
    this.forgotPasswordForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]]
    });
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
      this.successMessage = 'Đã gửi liên kết đặt lại mật khẩu tới email của bạn!';
      this.forgotPasswordForm.reset();
    }
  }
}
