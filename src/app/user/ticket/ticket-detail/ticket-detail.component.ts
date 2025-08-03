import { Component, Input, Output, EventEmitter, inject, OnInit, OnDestroy } from '@angular/core';
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
export class TicketDetailComponent implements OnInit, OnDestroy {
  @Input() ticket: any;
  @Output() close = new EventEmitter<void>();

  private dialog = inject(MatDialog);
  private http = inject(HttpClient);
  private sanitizer = inject(DomSanitizer);
  
  imageObjectUrl: SafeUrl | null = null;

  ngOnInit() {
    if (this.ticket?.imageUrl) {
      this.loadImage();
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
      },
      error: (error) => {
        console.error('Failed to load image:', error);
        this.imageObjectUrl = null;
      }
    });
  }

  onClose() {
    this.close.emit();
  }

  getFullImageUrl(imageUrl: string): SafeUrl | string {
    // Trả về object URL đã được tạo sẵn
    return this.imageObjectUrl || '';
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
