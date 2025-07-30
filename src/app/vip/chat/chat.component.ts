
import { Component, OnInit, OnDestroy, ChangeDetectorRef, NgZone } from '@angular/core';
import { TopNavigatorComponent } from '../../shared/top-navigator/top-navigator.component';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { Subscription } from 'rxjs';
import { ChatStompService, ChatMessage } from './chat-stomp.service';

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

  private wsSub?: Subscription;
  private wsErrSub?: Subscription;

  constructor(
    private http: HttpClient,
    private cdr: ChangeDetectorRef,
    private ws: ChatStompService,
    private zone: NgZone
  ) {}


  ngOnInit(): void {
    this.fetchHistory();
    this.ws.connect();
    this.wsSub = this.ws.onMessage().subscribe((msg: ChatMessage) => {
      this.zone.run(() => {
        this.messages.push(msg);
        this.cdr.markForCheck();
      });
    });
    this.wsErrSub = this.ws.onError().subscribe((err: string) => {
      this.zone.run(() => {
        this.error = err;
        this.cdr.markForCheck();
      });
    });
  }

  fetchHistory() {
    this.loading = true;
    // Gọi đúng endpoint không có /api nếu backend không có prefix /api
    this.http.get<ChatMessage[]>('/chat/history').subscribe({
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
    // Lấy senderId từ localStorage (giả lập, nên lấy từ AuthService thực tế)
    const senderId = +(localStorage.getItem('userId') || '1');
    const msg: ChatMessage = {
      senderId,
      content: this.newMessage.trim(),
      senderRole: 'VIP',
      timestamp: new Date().toISOString()
    };
    this.ws.sendMessage(msg);
    this.newMessage = '';
    this.cdr.markForCheck();
  }

  ngOnDestroy(): void {
    this.wsSub?.unsubscribe();
    this.wsErrSub?.unsubscribe();
    this.ws.disconnect();
  }
}
