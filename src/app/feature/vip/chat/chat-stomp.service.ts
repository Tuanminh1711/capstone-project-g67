
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

@Injectable({ providedIn: 'root' })
export class ChatStompService {
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
    // Get WebSocket URL based on environment
    const websocketUrl = this.getWebSocketUrl();

    // Get authentication token
    const token = this.cookieService.getAuthToken();

    this.client = new Client({
      webSocketFactory: () => {
        // For SockJS, create connection normally and use connectHeaders for auth
        return new SockJS(websocketUrl);
      },
      connectHeaders: token
        ? {
            Authorization: `Bearer ${token}`,
          }
        : {},
      reconnectDelay: 5000,
      debug: (str) => {
        // STOMP debug logging disabled for security
      },
    });

    this.client.onConnect = () => {
      this.connected = true;
      
      // Subscribe to community messages
      this.client.subscribe('/topic/vip-community', (msg: IMessage) => {
        this.zone.run(() => {
          try {
            const data = JSON.parse(msg.body);
            // Ensure chatType is set to COMMUNITY for community messages
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
            // Ensure chatType is set to PRIVATE for private messages
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
    const isProduction =
      environment.production ||
      window.location.hostname.includes('plantcare.id.vn');

    // Check authentication before connecting
    const token = this.cookieService.getAuthToken();
    if (!token) {
      this.errorSubject.next('Cần đăng nhập để sử dụng chat');
      return Promise.reject('No authentication token');
    }

    if (!this.connected && this.client) {
      // Activating WebSocket client
      this.client.activate();
    }
    return Promise.resolve();
  }

  disconnect() {
    if (this.client && this.connected) {
      // Disconnecting WebSocket
      this.client.deactivate();
    }
    this.connected = false;
  }

  // Method to refresh connection with new auth token
  refreshConnection(): Promise<void> {
    // Refreshing WebSocket connection
    this.disconnect();

    // Reinitialize with new token
    this.initializeConnection();

    return this.connect();
  }

  sendMessage(message: ChatMessage) {
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

  isConnected(): boolean {
    return this.connected;
  }

  // Method for community messages
  onCommunityMessage(): Observable<ChatMessage> {
    return this.communityMessageSubject.asObservable();
  }

  // Method for private messages
  onPrivateMessage(): Observable<ChatMessage> {
    return this.privateMessageSubject.asObservable();
  }

  // Legacy method for backward compatibility (returns community messages)
  onMessage(): Observable<ChatMessage> {
    return this.communityMessageSubject.asObservable();
  }

  onError(): Observable<string> {
    return this.errorSubject.asObservable();
  }

  sendPrivateMessage(message: ChatMessage) {
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

  sendTypingIndicator(typingIndicator: TypingIndicator) {
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

  // Remove these methods as they're no longer needed
  // subscribeToPrivateMessages() and subscribeToConversation() are redundant
  // since we now handle subscriptions in onConnect
}