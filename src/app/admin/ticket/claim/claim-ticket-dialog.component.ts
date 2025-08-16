import { Component, Inject } from '@angular/core';
import { ToastService } from '../../../shared/toast/toast.service';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { AdminSupportTicketsService } from '../admin-support-tickets.service';

@Component({
  selector: 'app-claim-ticket-dialog',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './claim-ticket-dialog.component.html',
  styleUrls: ['./claim-ticket-dialog.component.scss']
})
export class ClaimTicketDialogComponent {
  claimForm: FormGroup;
  loading = false;
  error: string | null = null;

  constructor(
    private fb: FormBuilder,
    private ticketsService: AdminSupportTicketsService,
    private dialogRef: MatDialogRef<ClaimTicketDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { ticketId: number },
    private toast: ToastService
  ) {
    this.claimForm = this.fb.group({
      note: ['', Validators.required]
    });
  }

  submit() {
    if (this.claimForm.invalid) return;
    this.loading = true;
    this.error = null;
    this.ticketsService.claimTicket(this.data.ticketId, this.claimForm.value.note).subscribe({
      next: () => {
        this.loading = false;
        this.dialogRef.close(true);
      },
      error: (err) => {
        this.loading = false;
        this.toast.error(err?.error?.message || 'Có lỗi xảy ra khi nhận ticket.');
        this.dialogRef.close(false);
      }
    });
  }

  close() {
    this.dialogRef.close(false);
  }
}
