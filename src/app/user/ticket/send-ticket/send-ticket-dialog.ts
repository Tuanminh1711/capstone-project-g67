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
        this.cdr.detectChanges();
      };
      reader.readAsDataURL(file);
    } else {
      this.selectedFileName = '';
      this.imagePreview = '';
      this.cdr.detectChanges();
    }
  }

  removeImage() {
    this.selectedImage = null;
    this.selectedFileName = '';
    this.imagePreview = '';
    this.cdr.detectChanges();
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
        console.log('Uploading image:', this.selectedImage.name);
        const uploadResponse = await this.supportService.uploadImage(this.selectedImage).toPromise();
        
        if (uploadResponse && uploadResponse.status === 200) {
          imageUrl = uploadResponse.data; // Backend trả về URL trong field 'data'
          console.log('Image uploaded successfully, URL:', imageUrl);
        } else {
          throw new Error('Upload ảnh thất bại');
        }
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
        // Hiện toast ngay lập tức
        this.toastService.show('Ticket đã được gửi thành công!', 'success');
        
        // Đóng dialog trước
        this.close();
        
        // Navigation sau một chút để toast hiện được
        setTimeout(() => {
          this.router.navigate(['user/my-tickets']);
        }, 100);
      }
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
