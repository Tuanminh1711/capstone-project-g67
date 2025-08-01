import { Component, Input, Output, EventEmitter, inject } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { CommonModule } from '@angular/common';
import { TicketResponseDialogComponent } from '../ticket-response/ticket-response-dialog.component';

@Component({
  selector: 'app-ticket-detail',
  templateUrl: './ticket-detail.component.html',
  styleUrls: ['./ticket-detail.component.scss'],
  standalone: true,
  imports: [CommonModule]
})
export class TicketDetailComponent {
  @Input() ticket: any;
  @Output() close = new EventEmitter<void>();

  private dialog = inject(MatDialog);

  onClose() {
    this.close.emit();
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
