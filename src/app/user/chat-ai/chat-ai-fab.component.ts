
import { Component } from '@angular/core';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { ChatAiComponent } from './chat-ai.component';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../auth/auth.service';

@Component({
  selector: 'app-chat-ai-fab',
  standalone: true,
  imports: [CommonModule, MatDialogModule],
  template: `
    <button *ngIf="isLoggedIn" class="chat-ai-fab" (click)="openDialog()">
      <span>🤖</span>
    </button>
  `,
  styleUrls: ['./chat-ai-fab.component.scss']
})
export class ChatAiFabComponent {
  isLoggedIn = false;
  constructor(private dialog: MatDialog, private authService: AuthService) {
    this.isLoggedIn = this.authService.isLoggedIn();
  }

  openDialog() {
    this.dialog.open(ChatAiComponent, {
      width: '400px',
      height: '70vh',
      maxWidth: '90vw',
      position: { right: '24px', bottom: '24px' },
      panelClass: 'chat-ai-dialog-panel',
      autoFocus: false,
      hasBackdrop: false,
      backdropClass: 'no-backdrop',
      disableClose: false
    });
  }
}
