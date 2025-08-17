import { Injectable, NgZone } from '@angular/core';
import { Client, IMessage } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import { Observable, Subject } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { UrlService } from '../../../shared/services/url.service';
import { CookieService } from '../../../auth/cookie.service';

export interface ChatMessage {
  senderId: number;
  receiverId?: number;
  senderRole?: string;
  content: string;
  timestamp?: string;
  conversationId?: string;
  chatType?: 'COMMUNITY' | 'PRIVATE';
}

@Injectable({
  providedIn: 'root',
})
export class ExpertChatStompService {
  private client!: Client;
  private communityMessageSubject = new Subject<ChatMessage>();
  private privateMessageSubject = new Subject<ChatMessage>();
  private errorSubject = new Subject<string>();
  private connected = false;

  constructor(
    private zone: NgZone,
    private urlService: UrlService,
    private cookieService: CookieService
  ) {
    this.initializeConnection();
  }

  private getWebSocketUrl(): string {
    return this.urlService.getWebSocketUrl();
  }

  private initializeConnection(): void {
    const websocketUrl = this.getWebSocketUrl();
    const token = this.cookieService.getAuthToken();

    console.log('Initializing Expert WebSocket connection:', {
      websocketUrl,
      hasToken: !!token,
    });

    this.client = new Client({
      webSocketFactory: () => {
        return new SockJS(websocketUrl);
      },
      connectHeaders: token
        ? {
            Authorization: `Bearer ${token}`,
          }
        : {},
      reconnectDelay: 5000,
      debug: (str) => console.log('Expert STOMP:', str),
    });

    this.client.onConnect = () => {
      this.connected = true;

      // Subscribe to community messages
      this.client.subscribe('/topic/vip-community', (msg: IMessage) => {
        this.zone.run(() => {
          try {
            const data = JSON.parse(msg.body);
            data.chatType = 'COMMUNITY';
            this.communityMessageSubject.next(data);
          } catch (e) {
            this.errorSubject.next('Lỗi nhận dữ liệu chat cộng đồng');
          }
        });
      });

      // Subscribe to private messages
      this.client.subscribe('/user/queue/private-messages', (msg: IMessage) => {
        this.zone.run(() => {
          try {
            const data = JSON.parse(msg.body);
            data.chatType = 'PRIVATE';
            this.privateMessageSubject.next(data);
          } catch (e) {
            this.errorSubject.next('Lỗi nhận dữ liệu chat riêng tư');
          }
        });
      });
    };

    this.client.onStompError = (err) => {
      this.zone.run(() =>
        this.errorSubject.next('Lỗi STOMP: ' + err.headers['message'])
      );
    };
    this.client.onWebSocketError = (evt) => {
      this.zone.run(() => this.errorSubject.next('Lỗi kết nối WebSocket'));
    };
  }

  connect(): Promise<void> {
    const token = this.cookieService.getAuthToken();
    if (!token) {
      console.warn('No auth token found for Expert WebSocket connection');
      this.errorSubject.next('Cần đăng nhập để sử dụng chat');
      return Promise.reject('No authentication token');
    }

    if (!this.connected && this.client) {
      console.log('Activating Expert WebSocket client...');
      this.client.activate();
    }
    return Promise.resolve();
  }

  disconnect(): void {
    if (this.client && this.connected) {
      console.log('Disconnecting Expert WebSocket...');
      this.client.deactivate();
    }
    this.connected = false;
  }

  // Method for community messages
  onCommunityMessage(): Observable<ChatMessage> {
    return this.communityMessageSubject.asObservable();
  }

  // Method for private messages
  onPrivateMessage(): Observable<ChatMessage> {
    return this.privateMessageSubject.asObservable();
  }

  // Legacy method for backward compatibility
  onMessage(): Observable<ChatMessage> {
    return this.communityMessageSubject.asObservable();
  }

  onError(): Observable<string> {
    return this.errorSubject.asObservable();
  }

  sendMessage(message: ChatMessage): Promise<void> {
    if (this.connected && this.client) {
      this.client.publish({
        destination: '/app/chat.sendMessage',
        body: JSON.stringify(message),
      });
      return Promise.resolve();
    }

    this.errorSubject.next('WebSocket chưa kết nối');
    return Promise.reject('WebSocket not connected');
  }

  sendPrivateMessage(message: ChatMessage): Promise<void> {
    if (this.connected && this.client) {
      this.client.publish({
        destination: '/app/chat.sendPrivateMessage',
        body: JSON.stringify(message),
      });
      return Promise.resolve();
    }

    this.errorSubject.next('WebSocket chưa kết nối');
    return Promise.reject('WebSocket not connected');
  }

  isConnected(): boolean {
    return this.connected;
  }
}
