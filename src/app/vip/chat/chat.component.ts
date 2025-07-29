import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { TopNavigatorComponent } from '../../shared/top-navigator/top-navigator.component';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { Subscription } from 'rxjs';

interface ChatMessage {
  senderId: number;
  receiverId?: number;
  senderRole?: string;
  content: string;
  timestamp?: string;
}

@Component({
  selector: 'app-vip-chat',
  standalone: true,
  imports: [CommonModule, FormsModule, TopNavigatorComponent],
  templateUrl: './chat.component.html',
  styleUrls: ['./chat.component.scss']
})
export class ChatComponent implements OnInit, OnDestroy {
  messages: ChatMessage[] = [];
  newMessage: string = '';
  loading = false;
  error = '';
  private sub?: Subscription;

  constructor(private http: HttpClient, private cdr: ChangeDetectorRef) {}

  ngOnInit(): void {
    this.fetchHistory();
    // TODO: connect websocket for real-time
  }

  fetchHistory() {
    this.loading = true;
    this.http.get<ChatMessage[]>('/api/chat/history').subscribe({
      next: (data: any) => {
        this.messages = Array.isArray(data) ? data : (data?.data || []);
        this.loading = false;
        this.cdr.markForCheck();
      },
      error: err => {
        this.error = 'Không thể tải lịch sử chat';
        this.loading = false;
        this.cdr.markForCheck();
      }
    });
  }

  sendMessage() {
    if (!this.newMessage.trim()) return;
    // TODO: send via websocket
    // Tạm thời push local
    this.messages.push({
      senderId: 1, // TODO: lấy từ auth
      content: this.newMessage,
      timestamp: new Date().toISOString(),
      senderRole: 'VIP'
    });
    this.newMessage = '';
    this.cdr.markForCheck();
  }

  ngOnDestroy(): void {
    this.sub?.unsubscribe();
  }
}
