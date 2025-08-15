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
  
  imageObjectUrl: SafeUrl | string | null = null;

  ngOnInit() {
    this.cdr.detectChanges();
    if (this.ticket?.imageUrl) {
      this.prepareImage();
    }
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['ticket'] && changes['ticket'].currentValue) {
      // Reset image URL khi ticket thay đổi
      if (this.imageObjectUrl && typeof this.imageObjectUrl !== 'string') {
        URL.revokeObjectURL(this.imageObjectUrl.toString());
        this.imageObjectUrl = null;
      }
      // Load ảnh mới nếu có
      if (this.ticket?.imageUrl) {
        this.prepareImage();
      }
    }
  }

  ngOnDestroy() {
    // Clean up object URL to prevent memory leaks
    if (this.imageObjectUrl && typeof this.imageObjectUrl !== 'string') {
      URL.revokeObjectURL(this.imageObjectUrl.toString());
    }
  }

  private prepareImage() {
    if (!this.ticket?.imageUrl) return;
    const imageUrl = this.ticket.imageUrl;
    // Nếu là absolute URL (http/https), render trực tiếp qua <img [src]>
    if (/^https?:\/\//i.test(imageUrl)) {
      this.imageObjectUrl = imageUrl;
      this.cdr.detectChanges();
      return;
    }
    // Nếu là ảnh nội bộ, fetch blob như cũ
    const token = localStorage.getItem('token');
    let localUrl = environment.production 
      ? `${environment.baseUrl}${imageUrl}`
      : (imageUrl.startsWith('/') ? imageUrl : `/${imageUrl}`);
    this.http.get(localUrl, {
      responseType: 'blob',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    }).subscribe({
      next: (blob) => {
        const objectUrl = URL.createObjectURL(blob);
        this.imageObjectUrl = this.sanitizer.bypassSecurityTrustUrl(objectUrl);
        this.cdr.detectChanges();
      },
      error: (error) => {
        console.error('Failed to load image:', error);
        this.imageObjectUrl = null;
        this.cdr.detectChanges();
      }
    });
  }

  onClose() {
    this.close.emit();
  }

  getFullImageUrl(imageUrl: string): SafeUrl | string {
    // Nếu đã có objectUrl (ảnh nội bộ) hoặc là absolute URL thì trả về luôn
    if (this.imageObjectUrl) {
      return this.imageObjectUrl;
    }
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
