import { Component, Inject, ChangeDetectorRef } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { AdminSupportTicketsService } from '../admin-support-tickets.service';
import { ToastService } from '../../../../shared/toast/toast.service';

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
  error: string | null = null;

  constructor(
    private fb: FormBuilder,
    private dialogRef: MatDialogRef<HandleTicketDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { ticket: any },
    private ticketsService: AdminSupportTicketsService,
    private toast: ToastService,
    private cdr: ChangeDetectorRef
  ) {
    this.handleForm = this.fb.group({
      note: ['', Validators.required]
    });
  }

  submit() {
    if (this.handleForm.invalid) return;
    
    this.error = null;
    this.loading = true;
    this.cdr.detectChanges(); // Force change detection
    
    const ticketId = this.data.ticket?.ticketId;
    if (!ticketId) {
      this.error = 'Không tìm thấy ID ticket';
      this.loading = false;
      return;
    }

    this.ticketsService.handleTicket(ticketId, this.handleForm.value.note).subscribe({
      next: () => {
        this.loading = false;
        this.error = null;
        // Remove duplicate toast - parent component will show it
        this.dialogRef.close({ success: true });
      },
      error: (err) => {
        this.loading = false;
        this.error = 'Xử lý ticket thất bại!';
        this.toast.error('Xử lý ticket thất bại!');
      }
    });
  }

  close() {
    this.dialogRef.close(null);
  }
}
