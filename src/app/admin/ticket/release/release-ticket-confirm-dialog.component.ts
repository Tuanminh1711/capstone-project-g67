import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';

@Component({
  selector: 'app-release-ticket-confirm-dialog',
  standalone: true,
  template: `
    <div class="release-dialog">
      <h2>Xác nhận trả lại ticket</h2>
      <p>Bạn có chắc chắn muốn trả lại ticket này?</p>
      <div class="actions">
        <button type="button" (click)="close(false)">Hủy</button>
        <button type="button" (click)="close(true)" class="confirm">Xác nhận</button>
      </div>
    </div>
  `,
  styles: [`
    .release-dialog { background: #fff; border-radius: 12px; box-shadow: 0 4px 16px rgba(25, 118, 210, 0.10); padding: 20px; min-width: 240px; max-width: 98vw; margin: auto; border: none; }
    h2 { font-size: 1.1rem; font-weight: 700; margin: 0 0 10px 0; color: #1976d2; text-align: center; }
    .actions { display: flex; justify-content: flex-end; gap: 10px; margin-top: 18px; }
    button { min-width: 80px; padding: 7px 0; border-radius: 8px; border: none; font-size: 0.97rem; font-weight: 600; cursor: pointer; background: #e0e0e0; color: #222; }
    .confirm { background: linear-gradient(90deg, #43ea7f 0%, #2ecc40 100%); color: #fff; }
  `]
})
export class ReleaseTicketConfirmDialogComponent {
  constructor(
    private dialogRef: MatDialogRef<ReleaseTicketConfirmDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { ticketId: number }
  ) {}

  close(result: boolean) {
    this.dialogRef.close(result);
  }
}
