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
    
    console.log('[CLAIM DEBUG] Attempting to claim ticket:', this.data.ticketId, 'with note:', this.claimForm.value.note);
    
    this.loading = true;
    this.error = null;
    this.ticketsService.claimTicket(this.data.ticketId, this.claimForm.value.note).subscribe({
      next: (response) => {
        console.log('[CLAIM DEBUG] Claim successful:', response);
        this.loading = false;
        this.dialogRef.close(true);
      },
      error: (err) => {
        console.error('[CLAIM DEBUG] Claim failed:', err);
        this.loading = false;
        
        let errorMessage = 'Có lỗi xảy ra khi nhận ticket.';
        
        if (err?.error?.message) {
          errorMessage = err.error.message;
        } else if (err?.message) {
          errorMessage = err.message;
        }
        
        // Special handling for specific error cases
        if (errorMessage.includes('Ticket cannot be claimed')) {
          errorMessage = 'Ticket không thể nhận được. Có thể đã được admin khác nhận hoặc trạng thái đã thay đổi. Vui lòng tải lại trang.';
        }
        
        this.error = errorMessage;
        this.toast.error(errorMessage);
        
        // Don't close dialog immediately to let user see the error
        // They can manually close or retry
      }
    });
  }

  close() {
    this.dialogRef.close(false);
  }
}
