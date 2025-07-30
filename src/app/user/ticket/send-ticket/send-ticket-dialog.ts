import { Component, ChangeDetectorRef } from '@angular/core';
import { Router } from '@angular/router';
import { MatDialogRef } from '@angular/material/dialog';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SupportService } from '../send-ticket/support.service';
import { ToastService } from '../../../shared/toast/toast.service';

@Component({
  selector: 'app-send-ticket-dialog',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './send-ticket-dialog.html',
  styleUrls: ['./send-ticket-dialog.scss']
})

export class SendTicketDialogComponent {
  title = '';
  description = '';
  selectedImage: File | null = null;
  selectedFileName: string = '';
  imagePreview = '';
  isSubmitting = false;
  errorMessage = '';

  constructor(
    private dialogRef: MatDialogRef<SendTicketDialogComponent>,
    private supportService: SupportService,
    private toastService: ToastService,
    private cdr: ChangeDetectorRef,
    private router: Router
  ) { }


  onImageSelected(event: any) {
    const file = event.target.files[0];
    if (file) {
      this.selectedImage = file;
      this.selectedFileName = file.name;
      const reader = new FileReader();
      reader.onload = (e: any) => {
        this.imagePreview = e.target.result;
      };
      reader.readAsDataURL(file);
    } else {
      this.selectedFileName = '';
    }
  }

  removeImage() {
    this.selectedImage = null;
    this.selectedFileName = '';
    this.imagePreview = '';
  }

  public async onSubmit() {
    if (!this.title.trim() || !this.description.trim()) {
      this.errorMessage = 'Vui lòng nhập đầy đủ tiêu đề và mô tả';
      this.cdr.detectChanges();
      return;
    }

    this.isSubmitting = true;
    this.errorMessage = '';
    this.cdr.detectChanges();

    try {
      let imageUrl = '';
      // Upload image if selected
      if (this.selectedImage) {
        const uploadResponse = await this.supportService.uploadImage(this.selectedImage).toPromise();
        imageUrl = uploadResponse?.url || '';
      }

      // Create ticket
      const ticketData = {
        title: this.title.trim(),
        description: this.description.trim(),
        imageUrl: imageUrl
      };

      const created = await this.supportService.createTicket(ticketData).toPromise();

      if (created) {
        this.toastService.show('Ticket đã được gửi thành công!', 'success');
        this.router.navigate(['user/my-tickets']);
      }
      this.close();
    } catch (error: any) {
      console.error('Error submitting ticket:', error);
      this.errorMessage = error.message || 'Có lỗi xảy ra khi gửi ticket. Vui lòng thử lại.';
      this.toastService.show('Không thể gửi ticket. Vui lòng thử lại.', 'error');
      this.cdr.detectChanges();
    } finally {
      this.isSubmitting = false;
      this.cdr.detectChanges();
    }
  }

  close() {
    this.dialogRef.close();
  }
}
