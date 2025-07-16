import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';

import { ReactiveFormsModule } from '@angular/forms';

@Component({
  selector: 'app-status-ticket-dialog',
  standalone: true,
  imports: [ReactiveFormsModule],
  template: `
    <div class="status-dialog">
      <h2>Đổi trạng thái ticket</h2>
      <form [formGroup]="form" (ngSubmit)="submit()">
        <div class="form-group">
          <label for="status">Trạng thái mới</label>
          <select id="status" formControlName="status">
            <option value="OPEN">OPEN</option>
            <option value="CLAIMED">CLAIMED</option>
            <option value="HANDLED">HANDLED</option>
            <option value="CLOSED">CLOSED</option>
          </select>
        </div>
        <div class="actions">
          <button type="button" (click)="close()">Hủy</button>
          <button type="submit" [disabled]="form.invalid">Xác nhận</button>
        </div>
      </form>
    </div>
  `,
  styles: [`
    .status-dialog { background: #fff; border-radius: 12px; box-shadow: 0 4px 16px rgba(25, 118, 210, 0.10); padding: 0; min-width: 240px; max-width: 98vw; margin: auto; border: none; }
    h2 { font-size: 1rem; font-weight: 700; margin: 0; color: #1976d2; text-align: center; padding: 12px 12px 6px 12px; }
    form { padding: 10px 14px 14px 14px; }
    .form-group { margin-bottom: 10px; }
    label { display: block; font-weight: 500; margin-bottom: 5px; color: #1976d2; font-size: 0.95rem; }
    select { width: 100%; border-radius: 6px; border: 1px solid #bfc8d6; background: #f5f7fa; color: #222; padding: 6px; font-size: 0.95rem; }
    .actions { display: flex; justify-content: flex-end; gap: 8px; margin-top: 12px; }
    button { min-width: 70px; padding: 6px 0; border-radius: 8px; border: none; font-size: 0.95rem; font-weight: 600; cursor: pointer; background: linear-gradient(90deg, #43ea7f 0%, #2ecc40 100%); color: #fff; }
    button[type="button"] { background: #e0e0e0; color: #222; }
    button:disabled { background: #bfc8d6; color: #888; cursor: not-allowed; }
  `]
})
export class StatusTicketDialogComponent {
  form: FormGroup;
  constructor(
    private fb: FormBuilder,
    private dialogRef: MatDialogRef<StatusTicketDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { ticketId: number, currentStatus: string }
  ) {
    this.form = this.fb.group({
      status: [data.currentStatus, Validators.required]
    });
  }
  submit() {
    if (this.form.invalid) return;
    this.dialogRef.close(this.form.value.status);
  }
  close() { this.dialogRef.close(); }
}
