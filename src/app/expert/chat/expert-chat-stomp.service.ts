import { Injectable, NgZone } from '@angular/core';
import { Observable, Subject } from 'rxjs';

export interface ChatMessage {
  senderId: number;
  receiverId?: number;
  senderRole?: string;
  content: string;
  timestamp?: string;
}

@Injectable({
  providedIn: 'root'
})
export class ExpertChatStompService {
  private messageSubject = new Subject<ChatMessage>();
  private errorSubject = new Subject<string>();
  private connected = false;

  constructor(private zone: NgZone) {
    // Khởi tạo service nhưng không kết nối WebSocket để tránh lỗi
  }

  connect(): void {
    // Tạm thời disable để tránh lỗi kết nối
    console.log('Expert chat service initialized (WebSocket disabled)');
    this.connected = true;
  }

  disconnect(): void {
    this.connected = false;
  }

  get messages$(): Observable<ChatMessage> {
    return this.messageSubject.asObservable();
  }

  get errors$(): Observable<string> {
    return this.errorSubject.asObservable();
  }

  sendMessage(message: ChatMessage): Promise<void> {
    return new Promise((resolve) => {
      // Tạm thời chỉ log message, không gửi thật
      console.log('Expert message (not sent):', message);
      resolve();
    });
  }

  isConnected(): boolean {
    return this.connected;
  }
}
