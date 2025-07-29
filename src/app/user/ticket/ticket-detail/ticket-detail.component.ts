import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

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

  onClose() {
    this.close.emit();
  }
}
