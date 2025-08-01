import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';

@Component({
  selector: 'app-release-ticket-confirm-dialog',
  standalone: true,
  template: `
    <div class="modern-dialog">
      <div class="dialog-header">
        <h3>Xác nhận trả lại ticket</h3>
      </div>
      <div class="dialog-body">
        <p>Bạn có chắc chắn muốn trả lại ticket này?</p>
      </div>
      <div class="dialog-footer">
        <button type="button" class="btn btn-secondary" (click)="close(false)">
          Hủy
        </button>
        <button type="button" class="btn btn-danger" (click)="close(true)">
          Xác nhận
        </button>
      </div>
    </div>
  `,
  styleUrls: ['./release-ticket-confirm-dialog.component.scss']
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
