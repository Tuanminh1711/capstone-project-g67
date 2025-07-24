import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { HttpClient } from '@angular/common/http';

import { ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-response-ticket-dialog',
  standalone: true,
  imports: [ReactiveFormsModule, CommonModule],
  template: `
    <div class="response-dialog">
      <h2>Phản hồi ticket</h2>
      <form [formGroup]="form" (ngSubmit)="submit()">
        <div class="form-group">
          <label for="response">Nội dung phản hồi</label>
          <textarea id="response" formControlName="response" rows="3" placeholder="Nhập nội dung phản hồi..."></textarea>
        </div>
        <div class="actions">
          <button type="button" (click)="close()">Hủy</button>
          <button type="submit" [disabled]="form.invalid || loading">Gửi phản hồi</button>
        </div>
        <div class="error-message" *ngIf="errorMsg">{{ errorMsg }}</div>
      </form>
    </div>
  `,
  styleUrls: ['./response-ticket-dialog.component.scss']
})
export class ResponseTicketDialogComponent {
  form: FormGroup;
  loading = false;
  errorMsg = '';
  constructor(
    private fb: FormBuilder,
    private dialogRef: MatDialogRef<ResponseTicketDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { ticketId: number },
    private http: HttpClient
  ) {
    this.form = this.fb.group({
      response: ['', Validators.required]
    });
  }
  submit() {
    if (this.form.invalid || this.loading) return;
    this.loading = true;
    this.errorMsg = '';
    const body = { content: this.form.value.response };
    this.http.post<any>(`http://localhost:8080/api/admin/support/tickets/${this.data.ticketId}/responses`, body).subscribe({
      next: (res) => {
        this.loading = false;
        this.dialogRef.close(true);
      },
      error: (err) => {
        this.loading = false;
        this.errorMsg = 'Gửi phản hồi thất bại. Vui lòng thử lại.';
      }
    });
  }
  close() { this.dialogRef.close(); }
}
