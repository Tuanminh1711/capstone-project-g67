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
  templateUrl: './response-ticket-dialog.component.html',
  styleUrls: ['./response-ticket-dialog.component.scss']
})
export class ResponseTicketDialogComponent {
  form: FormGroup;
  loading = false;
  error: string | null = null;
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
    this.error = null;
    const body = { content: this.form.value.response };
    this.http.post<any>(`http://localhost:8080/api/admin/support/tickets/${this.data.ticketId}/responses`, body).subscribe({
      next: (res) => {
        this.loading = false;
        this.dialogRef.close(true);
      },
      error: (err) => {
        this.loading = false;
        this.error = err?.error?.message || 'Gửi phản hồi thất bại. Vui lòng thử lại.';
      }
    });
  }
  close() { this.dialogRef.close(); }
}
