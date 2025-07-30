import { Injectable, NgZone } from '@angular/core';
import { Client, IMessage } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import { Observable, Subject } from 'rxjs';

export interface ChatMessage {
  senderId: number;
  receiverId?: number;
  senderRole?: string;
  content: string;
  timestamp?: string;
}

@Injectable({ providedIn: 'root' })
export class ChatStompService {
  private client: Client;
  private messageSubject = new Subject<ChatMessage>();
  private errorSubject = new Subject<string>();
  private connected = false;

  constructor(private zone: NgZone) {
    // Dùng '/ws' để đồng bộ với backend expose '/ws' và đi qua proxy tránh lỗi CORS
    this.client = new Client({
      webSocketFactory: () => new SockJS('/ws'),
      reconnectDelay: 5000,
      debug: str => console.log('[STOMP]', str)
    });

    this.client.onConnect = () => {
      this.connected = true;
      this.client.subscribe('/topic/vip-community', (msg: IMessage) => {
        this.zone.run(() => {
          try {
            const data = JSON.parse(msg.body);
            this.messageSubject.next(data);
          } catch (e) {
            this.errorSubject.next('Lỗi nhận dữ liệu chat');
          }
        });
      });
    };
    this.client.onStompError = err => {
      this.zone.run(() => this.errorSubject.next('Lỗi STOMP: ' + err.headers['message']));
    };
    this.client.onWebSocketError = evt => {
      this.zone.run(() => this.errorSubject.next('Lỗi kết nối WebSocket'));
    };
  }

  connect() {
    if (!this.connected) this.client.activate();
  }

  disconnect() {
    if (this.connected) this.client.deactivate();
    this.connected = false;
  }

  sendMessage(message: ChatMessage) {
    if (this.connected) {
      this.client.publish({
        destination: '/app/chat.sendMessage',
        body: JSON.stringify(message)
      });
    }
  }

  onMessage(): Observable<ChatMessage> {
    return this.messageSubject.asObservable();
  }
  onError(): Observable<string> {
    return this.errorSubject.asObservable();
  }
}
