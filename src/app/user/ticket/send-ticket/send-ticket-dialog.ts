import { Component, ChangeDetectorRef } from '@angular/core';
import { Router } from '@angular/router';
import { MatDialogRef } from '@angular/material/dialog';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { SupportService } from '../send-ticket/support.service';
import { ToastService } from '../../../shared/toast/toast.service';

@Component({
  selector: 'app-send-ticket-dialog',
  standalone: true,
  imports: [
    CommonModule, 
    FormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule
  ],
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
        setTimeout(() => this.cdr.detectChanges());
      };
      reader.readAsDataURL(file);
    } else {
      this.selectedFileName = '';
      this.imagePreview = '';
      setTimeout(() => this.cdr.detectChanges());
    }
  }

  removeImage() {
    this.selectedImage = null;
    this.selectedFileName = '';
    this.imagePreview = '';
    setTimeout(() => this.cdr.detectChanges());
  }

  public async onSubmit() {
    if (!this.title.trim() || !this.description.trim()) {
      this.errorMessage = 'Vui lòng nhập đầy đủ tiêu đề và mô tả';
      setTimeout(() => this.cdr.detectChanges());
      return;
    }

    this.isSubmitting = true;
    this.errorMessage = '';
    setTimeout(() => this.cdr.detectChanges());

    try {
      let imageUrl = '';
      // Upload image if selected (convert to base64)
      if (this.selectedImage) {
        console.log('Converting image to base64:', this.selectedImage.name);
        const uploadResponse = await this.supportService.uploadImage(this.selectedImage).toPromise();
        imageUrl = uploadResponse?.url || '';
        console.log('Image converted, base64 length:', imageUrl.length);
      }

      // Create ticket
      const ticketData = {
        title: this.title.trim(),
        description: this.description.trim(),
        imageUrl: imageUrl
      };

      console.log('Sending ticket data:', ticketData);
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
      setTimeout(() => this.cdr.detectChanges());
    } finally {
      this.isSubmitting = false;
      setTimeout(() => this.cdr.detectChanges());
    }
  }

  close() {
    this.dialogRef.close();
  }
}
