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

export interface TypingIndicator {
  conversationId: string;
  isTyping: boolean;
  userId?: number;
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
      debug: (str) => {
        // Expert STOMP debug
      },
    });

    this.client.onConnect = () => {
      this.connected = true;

      // Subscribe to community messages
      this.client.subscribe('/topic/vip-community', (msg: IMessage) => {
        this.zone.run(() => {
          try {
            const data = JSON.parse(msg.body);
            // Lọc: chỉ nhận tin nhắn cộng đồng (không có receiverId và conversationId)
            if (!data.receiverId && !data.conversationId) {
              data.chatType = 'COMMUNITY';
              this.communityMessageSubject.next(data);
            }
            // Nếu là private, bỏ qua ở đây (sẽ nhận qua /user/queue/private-messages)
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
      this.errorSubject.next('Cần đăng nhập để sử dụng chat');
      return Promise.reject('No authentication token');
    }

    if (!this.connected && this.client) {
      this.client.activate();
    }
    return Promise.resolve();
  }

  disconnect(): void {
    if (this.client && this.connected) {
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
      const token = this.cookieService.getAuthToken();
      this.client.publish({
        destination: '/app/chat.sendPrivateMessage',
        body: JSON.stringify(message),
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      });
      return Promise.resolve();
    }
    this.errorSubject.next('WebSocket chưa kết nối');
    return Promise.reject('WebSocket not connected');
  }

  sendTypingIndicator(typingIndicator: TypingIndicator): Promise<void> {
    if (this.connected && this.client) {
      const token = this.cookieService.getAuthToken();
      this.client.publish({
        destination: '/app/chat.typingIndicator',
        body: JSON.stringify(typingIndicator),
        headers: token ? { Authorization: `Bearer ${token}` } : {}
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
