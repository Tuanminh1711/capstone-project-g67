import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { AdminSupportTicketsService } from '../admin-support-tickets.service';
import { ToastService } from '../../../shared/toast.service';

@Component({
  selector: 'app-handle-ticket-dialog',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './handle-ticket-dialog.component.html',
  styleUrls: ['./handle-ticket-dialog.component.scss']
})
export class HandleTicketDialogComponent {
  handleForm: FormGroup;
  loading = false;

  constructor(
    private fb: FormBuilder,
    private dialogRef: MatDialogRef<HandleTicketDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { ticketId: number },
    private ticketsService: AdminSupportTicketsService,
    private toast: ToastService
  ) {
    this.handleForm = this.fb.group({
      note: ['', Validators.required]
    });
  }

  submit() {
    if (this.handleForm.invalid) return;
    this.loading = true;
    this.ticketsService.handleTicket(this.data.ticketId, this.handleForm.value.note).subscribe({
      next: () => {
        this.toast.success('Xử lý ticket thành công!');
        this.dialogRef.close(true);
      },
      error: () => {
        this.toast.error('Xử lý ticket thất bại!');
        this.loading = false;
      }
    });
  }

  close() {
    this.dialogRef.close(null);
  }
}
