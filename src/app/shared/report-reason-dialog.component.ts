import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatDialogRef } from '@angular/material/dialog';

@Component({
  selector: 'app-report-reason-dialog',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="dialog-panel-bg">
      <button class="dialog-close-x" (click)="onCancel()">&times;</button>
      <div class="auth-header">
        <img src="assets/image/logo.png" alt="logo" class="logo-img" />
        <span class="logo-text">PLANCARE</span>
      </div>
      <h2 class="auth-title">Báo cáo thông tin cây</h2>
      <form (ngSubmit)="onSubmit()" autocomplete="off">
        <textarea class="report-textarea" [(ngModel)]="reason" name="reason" rows="4" placeholder="Nhập lý do báo cáo..." required autofocus></textarea>
        <div *ngIf="errorMsg" class="auth-error">{{ errorMsg }}</div>
        <div class="dialog-actions">
          <button type="button" class="auth-btn cancel" (click)="onCancel()">Hủy</button>
          <button type="submit" class="auth-btn submit" [disabled]="!reason.trim()">Gửi báo cáo</button>
        </div>
      </form>
    </div>
  `,
  styles: [`
    .dialog-panel-bg {
      background: #178a4c !important;
      border-radius: 18px !important;
      box-shadow: 0 12px 40px rgba(30, 174, 96, 0.22) !important;
      padding: 28px 18px 18px 18px !important;
      min-width: 320px;
      max-width: 95vw;
      display: flex;
      flex-direction: column;
      align-items: stretch;
      justify-content: center;
      position: relative;
      border: none !important;
    }
    .dialog-close-x {
      position: absolute;
      top: 18px;
      right: 22px;
      background: rgba(23,138,76,0.18);
      border: none;
      color: #fff;
      font-size: 2.2rem;
      font-weight: bold;
      cursor: pointer;
      z-index: 10;
      border-radius: 50%;
      width: 38px;
      height: 38px;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: color 0.2s, background 0.2s;
    }
    .dialog-close-x:hover {
      color: #ffe066;
      background: #178a4c;
    }
    .auth-header {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      margin-bottom: 8px;
    }
    .logo-img {
      width: 38px;
      height: 38px;
      border-radius: 50%;
      background: #fff;
      object-fit: contain;
    }
    .logo-text {
      color: #fff;
      font-size: 1.3rem;
      font-weight: 700;
      letter-spacing: 1px;
    }
    .auth-title {
      color: #fff;
      text-align: center;
      font-size: 1.25rem;
      font-weight: 600;
      margin: 0 0 10px 0;
    }
    form {
      display: flex;
      flex-direction: column;
      gap: 10px;
    }
    .report-textarea {
      width: 100%;
      min-height: 80px;
      max-height: 180px;
      padding: 10px;
      border-radius: 8px;
      border: 1.5px solid #e0e0e0;
      font-size: 1rem;
      resize: vertical;
      margin-bottom: 8px;
      background: #fff;
      color: #222;
    }
    .auth-error {
      color: #ffe066;
      background: rgba(255,224,102,0.08);
      border-radius: 6px;
      padding: 6px 10px;
      font-size: 0.98rem;
      margin-bottom: 4px;
      text-align: center;
    }
    .dialog-actions {
      display: flex;
      justify-content: flex-end;
      gap: 10px;
      margin-top: 8px;
    }
    .auth-btn {
      min-width: 100px;
      padding: 7px 16px;
      border-radius: 6px;
      border: none;
      font-size: 1rem;
      font-weight: 600;
      cursor: pointer;
      transition: background 0.2s, color 0.2s;
    }
    .auth-btn.cancel {
      background: #fff;
      color: #178a4c;
      border: 1.5px solid #178a4c;
    }
    .auth-btn.cancel:hover {
      background: #e0e0e0;
    }
    .auth-btn.submit {
      background: #ffe066;
      color: #178a4c;
    }
    .auth-btn.submit:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }
  `]
})
export class ReportReasonDialogComponent {
  reason = '';
  errorMsg = '';
  private dialogRef = inject(MatDialogRef<ReportReasonDialogComponent>);

  onCancel() {
    this.dialogRef.close(null);
  }

  onSubmit() {
    if (!this.reason.trim()) {
      this.errorMsg = 'Vui lòng nhập lý do báo cáo.';
      return;
    }
    this.dialogRef.close(this.reason.trim());
  }
}
