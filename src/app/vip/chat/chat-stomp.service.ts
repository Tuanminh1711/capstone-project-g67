import { Injectable, NgZone } from '@angular/core';
import { Client, IMessage } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import { Observable, Subject } from 'rxjs';
import { environment } from '../../../environments/environment';
import { UrlService } from '../../shared/url.service';

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

  constructor(private zone: NgZone, private urlService: UrlService) {
    this.initializeConnection();
  }

  private getWebSocketUrl(): string {
    return this.urlService.getWebSocketUrl();
  }

  private initializeConnection(): void {
    // Get WebSocket URL based on environment
    const websocketUrl = this.getWebSocketUrl();
    
    console.log('Initializing WebSocket connection:', { 
      configProduction: environment.production, 
      hostname: window.location.hostname,
      websocketUrl
    });

    this.client = new Client({
      webSocketFactory: () => new SockJS(websocketUrl),
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
    const isProduction = environment.production || window.location.hostname.includes('plantcare.id.vn');
    
    if (isProduction) {
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
    if (this.connected && this.client) {
      this.client.publish({
        destination: '/app/chat.sendMessage',
        body: JSON.stringify(message)
      });
      return Promise.resolve();
    }
    
    this.errorSubject.next('WebSocket chưa kết nối');
    return Promise.reject('WebSocket not connected');
  }

  isConnected(): boolean {
    return this.connected;
  }

  onMessage(): Observable<ChatMessage> {
    return this.messageSubject.asObservable();
  }
  onError(): Observable<string> {
    return this.errorSubject.asObservable();
  }
}