import { Component, Inject, inject, ChangeDetectorRef } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { SupportService } from '../send-ticket/support.service';
import { ToastService } from '../../../../shared/toast/toast.service';

@Component({
  selector: 'app-ticket-response-dialog',
  templateUrl: './ticket-response-dialog.component.html',
  styleUrls: ['./ticket-response-dialog.component.scss'],
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule]
})
export class TicketResponseDialogComponent {
  responseForm: FormGroup;
  loading = false;
  ticketId: number;
  
  private supportService = inject(SupportService);
  private toast = inject(ToastService);
  private cdr = inject(ChangeDetectorRef);

  constructor(
    public dialogRef: MatDialogRef<TicketResponseDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { ticketId: number },
    private fb: FormBuilder
  ) {
    this.ticketId = data.ticketId;
    this.responseForm = this.fb.group({
      content: [{ value: '', disabled: false }, [Validators.required, Validators.maxLength(2000)]]
    });
  }

  submit() {
    if (this.responseForm.invalid || !this.ticketId) return;
    this.loading = true;
    this.responseForm.get('content')?.disable();
    this.cdr.detectChanges();
    
    this.supportService.addTicketResponse(this.ticketId, this.responseForm.get('content')?.value).subscribe({
      next: () => {
        this.loading = false;
        this.responseForm.get('content')?.enable();
        this.responseForm.reset();
        this.toast.success('Gửi phản hồi thành công!');
        this.dialogRef.close('responseAdded');
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.loading = false;
        this.responseForm.get('content')?.enable();
        this.toast.error('Gửi phản hồi thất bại!');
        this.cdr.detectChanges();
      }
    });
  }

  close() {
    this.dialogRef.close();
  }
}
