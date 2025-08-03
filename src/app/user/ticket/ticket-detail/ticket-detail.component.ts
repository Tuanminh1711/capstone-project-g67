import { Component, Input, Output, EventEmitter, inject, OnInit, OnDestroy, ChangeDetectorRef, OnChanges, SimpleChanges } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { CommonModule } from '@angular/common';
import { TicketResponseDialogComponent } from '../ticket-response/ticket-response-dialog.component';
import { environment } from '../../../../environments/environment';
import { HttpClient } from '@angular/common/http';
import { DomSanitizer, SafeUrl } from '@angular/platform-browser';

@Component({
  selector: 'app-ticket-detail',
  templateUrl: './ticket-detail.component.html',
  styleUrls: ['./ticket-detail.component.scss'],
  standalone: true,
  imports: [CommonModule]
})
export class TicketDetailComponent implements OnInit, OnDestroy, OnChanges {
  @Input() ticket: any;
  @Output() close = new EventEmitter<void>();

  private dialog = inject(MatDialog);
  private http = inject(HttpClient);
  private sanitizer = inject(DomSanitizer);
  private cdr = inject(ChangeDetectorRef);
  
  imageObjectUrl: SafeUrl | null = null;

  ngOnInit() {
    // Trigger change detection để đảm bảo UI update
    this.cdr.detectChanges();
    
    if (this.ticket?.imageUrl) {
      this.loadImage();
    }
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['ticket'] && changes['ticket'].currentValue) {
      // Reset image URL khi ticket thay đổi
      if (this.imageObjectUrl) {
        URL.revokeObjectURL(this.imageObjectUrl.toString());
        this.imageObjectUrl = null;
      }
      
      // Load ảnh mới nếu có
      if (this.ticket?.imageUrl) {
        this.loadImage();
      }
    }
  }

  ngOnDestroy() {
    // Clean up object URL to prevent memory leaks
    if (this.imageObjectUrl) {
      URL.revokeObjectURL(this.imageObjectUrl.toString());
    }
  }

  private loadImage() {
    if (!this.ticket?.imageUrl) return;

    const token = localStorage.getItem('token');
    // Trong development: sử dụng URL tương đối (qua proxy)
    // Trong production: sử dụng baseUrl + imageUrl
    const imageUrl = environment.production 
      ? `${environment.baseUrl}${this.ticket.imageUrl}`
      : (this.ticket.imageUrl.startsWith('/') ? this.ticket.imageUrl : `/${this.ticket.imageUrl}`);
    
    this.http.get(imageUrl, {
      responseType: 'blob',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    }).subscribe({
      next: (blob) => {
        const objectUrl = URL.createObjectURL(blob);
        this.imageObjectUrl = this.sanitizer.bypassSecurityTrustUrl(objectUrl);
        this.cdr.detectChanges(); // Force change detection
      },
      error: (error) => {
        console.error('Failed to load image:', error);
        this.imageObjectUrl = null;
        this.cdr.detectChanges(); // Force change detection
      }
    });
  }

  onClose() {
    this.close.emit();
  }

  getFullImageUrl(imageUrl: string): SafeUrl | string {
    // Trả về object URL đã được tạo sẵn hoặc fallback URL
    if (this.imageObjectUrl) {
      return this.imageObjectUrl;
    }
    // Fallback: trả về URL gốc nếu object URL chưa sẵn sàng
    return imageUrl || '';
  }

  openResponseDialog() {
    if (!this.ticket?.id && !this.ticket?.ticketId) return;
    const ticketId = this.ticket.id || this.ticket.ticketId;
    this.dialog.open(TicketResponseDialogComponent, {
      data: { ticketId },
      width: '480px',
      panelClass: 'dialog-panel-bg'
    }).afterClosed().subscribe(result => {
      if (result === 'responseAdded') {
        // TODO: reload responses from API if needed
      }
    });
  }
}
