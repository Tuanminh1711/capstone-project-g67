import { Injectable, NgZone } from '@angular/core';
import { Client, IMessage } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import { Observable, Subject } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface ChatMessage {
  senderId: number;
  receiverId?: number;
  senderRole?: string;
  content: string;
  timestamp?: string;
}

@Injectable({ providedIn: 'root' })
export class ChatStompService {
  private client!: Client;
  private messageSubject = new Subject<ChatMessage>();
  private errorSubject = new Subject<string>();
  private connected = false;

  constructor(private zone: NgZone) {
    this.initializeConnection();
  }

  private initializeConnection(): void {
    // Check environment and initialize accordingly
    if (environment.production) {
      // Production: WebSocket not configured yet, show warning
      console.warn('🚫 WebSocket chat không khả dụng trên production server. Đang sử dụng chế độ offline.');
      this.errorSubject.next('Chat tạm thời không khả dụng trên server production.');
      return; // Don't initialize WebSocket
    }

    // Development only: Initialize WebSocket
    this.client = new Client({
      webSocketFactory: () => new SockJS('/ws'),
      reconnectDelay: 5000,
      debug: (str) => console.log('STOMP:', str)
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
    if (environment.production) {
      console.warn('WebSocket không khả dụng trên production');
      return Promise.reject('WebSocket not available in production');
    }
    
    if (!this.connected && this.client) {
      this.client.activate();
    }
    return Promise.resolve();
  }

  disconnect() {
    if (this.client && this.connected) {
      this.client.deactivate();
    }
    this.connected = false;
  }

  sendMessage(message: ChatMessage) {
    if (environment.production) {
      console.warn('Không thể gửi tin nhắn trên production');
      this.errorSubject.next('Chat không khả dụng trên production server');
      return Promise.reject('Chat not available');
    }
    
    if (this.connected && this.client) {
      this.client.publish({
        destination: '/app/chat.sendMessage',
        body: JSON.stringify(message)
      });
      return Promise.resolve();
    }
    
    return Promise.reject('WebSocket not connected');
  }

  isConnected(): boolean {
    return this.connected && !environment.production;
  }

  onMessage(): Observable<ChatMessage> {
    return this.messageSubject.asObservable();
  }
  onError(): Observable<string> {
    return this.errorSubject.asObservable();
  }
}