
import { Component, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { Inject, Optional } from '@angular/core';
import { MatDialogRef } from '@angular/material/dialog';
import { AuthService } from '../../auth/auth.service';

interface ChatMessage {
  sender: 'user' | 'ai';
  content: string;
  timestamp?: string;
}

@Component({
  selector: 'app-chat-ai',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './chat-ai.component.html',
  styleUrls: ['./chat-ai.component.scss']
})

export class ChatAiComponent {

  messages: ChatMessage[] = [];
  newMessage: string = '';
  loading = false;
  error = '';
  isLoggedIn = false;

  constructor(
    private http: HttpClient,
    private cdr: ChangeDetectorRef,
    private authService: AuthService,
    @Optional() @Inject(MatDialogRef) private dialogRef?: MatDialogRef<ChatAiComponent>
  ) {
    this.isLoggedIn = this.authService.isLoggedIn();
  }

  sendMessage() {
    if (!this.isLoggedIn) return;
    const msg = this.newMessage.trim();
    if (!msg) return;
    this.messages.push({ sender: 'user', content: msg, timestamp: new Date().toISOString() });
    this.loading = true;
    this.http.post<{ reply: string }>('/api/chat', { message: msg }).subscribe({
      next: (res) => {
        this.messages.push({ sender: 'ai', content: res.reply, timestamp: new Date().toISOString() });
        this.loading = false;
        this.cdr.markForCheck();
      },
      error: err => {
        this.error = 'Không thể gửi tin nhắn tới AI';
        this.loading = false;
        this.cdr.markForCheck();
      }
    });
    this.newMessage = '';
  }
  
  closeDialog = () => {
    if (this.dialogRef) this.dialogRef.close();
  };
}
