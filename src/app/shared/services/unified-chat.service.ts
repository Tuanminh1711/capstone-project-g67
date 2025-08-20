import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, Subject } from 'rxjs';
import { Client, Message, Stomp } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import { ChatMessage } from '../../feature/vip/chat/chat-stomp.service';
import { environment } from '../../../environments/environment';

export interface WebSocketStatus {
  connected: boolean;
  connecting: boolean;
  error: string | null;
}

@Injectable({
  providedIn: 'root'
})
export class UnifiedChatService {
  private stompClient: Client | null = null;
  private connectionStatus = new BehaviorSubject<WebSocketStatus>({
    connected: false,
    connecting: false,
    error: null
  });

  // Subjects for different message types
  private communityMessageSubject = new Subject<ChatMessage>();
  private privateMessageSubject = new Subject<ChatMessage>();
  private errorSubject = new Subject<string>();

  // Public observables
  public connectionStatus$ = this.connectionStatus.asObservable();
  public communityMessages$ = this.communityMessageSubject.asObservable();
  public privateMessages$ = this.privateMessageSubject.asObservable();
  public errors$ = this.errorSubject.asObservable();

  // Connection state
  private currentUserId: string | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 3000;

  constructor() {
    // Auto-reconnect logic
    this.setupAutoReconnect();
  }

  /**
   * Connect to WebSocket with user authentication
   */
  public async connect(userId: string, token?: string): Promise<void> {
    if (this.connectionStatus.value.connecting) {
  // ...existing code...
      return;
    }

    if (this.connectionStatus.value.connected) {
  // ...existing code...
      return;
    }

    this.currentUserId = userId;
    this.updateConnectionStatus({ connecting: true, connected: false, error: null });

    try {
  // ...existing code...
      
      // Auto-detect WebSocket URL based on current environment
      const webSocketUrl = this.getWebSocketUrl();
  // ...existing code...

      // Create SockJS connection
      let socket: any;
      
      if (webSocketUrl.startsWith('/')) {
        // Relative URL - use proxy
  // ...existing code...
        socket = new SockJS(webSocketUrl);
      } else if (webSocketUrl.startsWith('ws://') || webSocketUrl.startsWith('wss://')) {
        // For WebSocket protocols, convert to HTTP/HTTPS for SockJS
        const httpUrl = webSocketUrl.replace('ws://', 'http://').replace('wss://', 'https://');
  // ...existing code...
        socket = new SockJS(httpUrl);
      } else {
        // For HTTP/HTTPS URLs, use directly
  // ...existing code...
        socket = new SockJS(webSocketUrl);
      }
      
      // Create STOMP client
      this.stompClient = new Client({
        webSocketFactory: () => socket as any,
        debug: (str: string) => {
          if (!environment.production) {
            // Only log in development
            // ...existing code...
          }
        },
        reconnectDelay: 0, // Disable auto-reconnect, we'll handle it manually
        heartbeatIncoming: 25000,
        heartbeatOutgoing: 25000
      });

      // Connect with headers
      const headers: any = {};
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
      headers['userId'] = userId;

      return new Promise((resolve, reject) => {
        if (!this.stompClient) {
          reject(new Error('STOMP client not initialized'));
          return;
        }

        this.stompClient.onConnect = () => {
          // ...existing code...
          this.updateConnectionStatus({ connecting: false, connected: true, error: null });
          this.reconnectAttempts = 0;
          
          // Setup subscriptions
          this.setupSubscriptions();
          
          resolve();
        };

        this.stompClient.onStompError = (frame: any) => {
          // ...existing code...
          this.updateConnectionStatus({ 
            connecting: false, 
            connected: false, 
            error: frame.headers.message || 'STOMP Error' 
          });
          this.errorSubject.next(`Connection failed: ${frame.headers.message || 'STOMP Error'}`);
          reject(new Error(frame.headers.message || 'STOMP Error'));
        };

        this.stompClient.onWebSocketError = (event: Event) => {
          // ...existing code...
          this.updateConnectionStatus({ 
            connecting: false, 
            connected: false, 
            error: 'WebSocket Error' 
          });
          this.errorSubject.next('WebSocket Error');
          reject(new Error('WebSocket Error'));
        };

        // Activate the client
        this.stompClient.activate();
      });

    } catch (error) {
  // ...existing code...
      this.updateConnectionStatus({ 
        connecting: false, 
        connected: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      });
      throw error;
    }
  }

  /**
   * Setup WebSocket subscriptions
   */
  private setupSubscriptions(): void {
    if (!this.stompClient || !this.stompClient.connected) {
  // ...existing code...
      return;
    }

  // ...existing code...

    // Subscribe to all messages (community và private) từ cùng 1 topic
    const allMessagesSub = this.stompClient.subscribe('/topic/vip-community', (message: Message) => {
      try {
        const chatMessage: ChatMessage = JSON.parse(message.body);
        
        if (chatMessage.chatType === 'COMMUNITY') {
          // ...existing code...
          this.communityMessageSubject.next(chatMessage);
        } else if (chatMessage.chatType === 'PRIVATE') {
          // ...existing code...
          this.privateMessageSubject.next(chatMessage);
        }
      } catch (error) {
  // ...existing code...
      }
    });

    // Subscribe to errors
    const errorSub = this.stompClient.subscribe('/user/queue/errors', (message: Message) => {
      try {
        const errorMessage = message.body;
        this.errorSubject.next(errorMessage);
      } catch (error) {
      }
    });
  }



  /**
   * Send community message
   */
  public async sendCommunityMessage(message: ChatMessage): Promise<void> {
    if (!this.stompClient || !this.stompClient.connected) {
      throw new Error('WebSocket not connected');
    }

    try {  
      this.stompClient.publish({
        destination: '/app/chat.sendMessage',
        body: JSON.stringify(message)
      });
    } catch (error) {
      throw error;
    }
  }

  /**
   * Send private message
   */
    public async sendPrivateMessage(message: ChatMessage): Promise<void> {
    if (!this.stompClient || !this.stompClient.connected) {
      throw new Error('WebSocket not connected');
    }

    try {
      // Gửi private message về cùng endpoint với community (backend sẽ phân biệt theo chatType)
      const result = this.stompClient.publish({
        destination: '/app/chat.sendMessage',
        body: JSON.stringify(message)
      });
    } catch (error) {
      throw error;
    }
  }

  /**
   * Send typing indicator
   */
  public sendTypingIndicator(typingData: { conversationId: string; isTyping: boolean }): void {
    if (!this.stompClient || !this.stompClient.connected) {
      return;
    }

    try {
      this.stompClient.publish({
        destination: '/app/chat.typing',
        body: JSON.stringify(typingData)
      });
    } catch (error) {

    }
  }



  /**
   * Disconnect from WebSocket
   */
  public disconnect(): void {    
    if (this.stompClient) {
      this.stompClient.deactivate();
      this.stompClient = null;
    }
    
    this.updateConnectionStatus({ connecting: false, connected: false, error: null });
    this.currentUserId = null;
  }

  /**
   * Check if WebSocket is connected
   */
  public isConnected(): boolean {
    return this.stompClient?.connected || false;
  }

  /**
   * Get current connection status
   */
  public getConnectionStatus(): WebSocketStatus {
    return this.connectionStatus.value;
  }

  /**
   * Get current user ID
   */
  public getCurrentUserId(): string | null {
    return this.currentUserId;
  }

  /**
   * Force reconnect
   */
  public async forceReconnect(): Promise<void> { 
    if (this.stompClient) {
      this.stompClient.deactivate();
      this.stompClient = null;
    }
    
    if (this.currentUserId) {
      await this.connect(this.currentUserId);
    }
  }

  /**
   * Update connection status
   */
  private updateConnectionStatus(status: Partial<WebSocketStatus>): void {
    this.connectionStatus.next({
      ...this.connectionStatus.value,
      ...status
    });
  }

  /**
   * Setup auto-reconnect logic
   */
  private setupAutoReconnect(): void {
    this.connectionStatus$.subscribe(status => {
      if (!status.connected && !status.connecting && this.currentUserId && this.reconnectAttempts < this.maxReconnectAttempts) {
        this.reconnectAttempts++;
        setTimeout(() => {
          this.connect(this.currentUserId!).catch(error => {
          });
        }, this.reconnectDelay * this.reconnectAttempts);
      }
    });
  }


  /**
   * Debug subscription details
   */
  public debugSubscriptions(): void {
    if (!this.stompClient) {
      return;
    }
    
    // Test community message subscription by sending a test message
    if (this.stompClient?.connected && this.currentUserId) {
      const testMessage = {
        senderId: +this.currentUserId,
        content: 'TEST PRIVATE MESSAGE SUBSCRIPTION',
        senderRole: 'VIP',
        timestamp: new Date().toISOString(),
        chatType: 'PRIVATE',
        conversationId: 'test_subscription',
        receiverId: +this.currentUserId // Send to self for testing
      };
      this.stompClient.publish({
        destination: '/app/chat.sendPrivateMessage',
        body: JSON.stringify(testMessage)
      });
    }
    
    // Test subscription by sending a test message to ourselves
    if (this.currentUserId) {
      console.log('Testing subscription by sending message to self...');
      const testMessage: ChatMessage = {
        senderId: +this.currentUserId,
        content: 'Test subscription message',
        senderRole: 'VIP',
        timestamp: new Date().toISOString(),
        chatType: 'PRIVATE',
        receiverId: +this.currentUserId,
        conversationId: 'test_self'
      };
      this.privateMessageSubject.next(testMessage);
    }
  }

  /**
   * Get connection statistics
   */
  public getConnectionStats(): {
    connected: boolean;
    userId: string | null;
    reconnectAttempts: number;
    maxReconnectAttempts: number;
  } {
    return {
      connected: this.isConnected(),
      userId: this.currentUserId,
      reconnectAttempts: this.reconnectAttempts,
      maxReconnectAttempts: this.maxReconnectAttempts
    };
  }

  /**
   * Get appropriate WebSocket URL based on current environment
   */
  private getWebSocketUrl(): string {
    // Check if we're running in production (plantcare.id.vn)
    if (window.location.hostname === 'plantcare.id.vn') {
      return 'https://plantcare.id.vn/ws-chat';
    }
    
    // Check if we're running in development (localhost)
    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
      // Option 1: Use proxy (recommended)
      return '/ws-chat';
      
      // Option 2: Direct connection (needs CSP update)
      // return 'http://localhost:8080/ws-chat';
    }
    
    // Fallback to environment config
    if (environment.webSocketUrl) {
      return environment.webSocketUrl;
    }
    
    // Final fallback
    return '/ws-chat';
  }

    /**
   * Test WebSocket connection
   */
  public testConnection(): void {
    if (this.isConnected()) {
      
      // Test sending a ping message
      const testMessage: ChatMessage = {
        senderId: this.currentUserId ? +this.currentUserId : 0,
        content: 'Test message from Unified Chat Service',
        senderRole: 'VIP',
        timestamp: new Date().toISOString(),
        chatType: 'COMMUNITY'
      };
      
      this.sendCommunityMessage(testMessage).then(() => {
      }).catch(error => {
      });
    } else {
      console.log('❌ WebSocket is not connected');
    }
  }

  /**
   * Test WebSocket URL detection
   */
  public testWebSocketUrlDetection(): void {
    
    // Test CSP bypass
    const wsUrl = this.getWebSocketUrl();
    if (wsUrl.startsWith('ws://') || wsUrl.startsWith('wss://')) {
      const httpUrl = wsUrl.replace('ws://', 'http://').replace('wss://', 'https://');
    }
    
    console.log('=== End Test ===');
  }

  /**
   * Test CSP bypass logic
   */
  public testCspBypass(): void { 
    const wsUrl = this.getWebSocketUrl();
    if (wsUrl.startsWith('ws://') || wsUrl.startsWith('wss://')) {
      const httpUrl = wsUrl.replace('ws://', 'http://').replace('wss://', 'https://');
    } else {
    }
  }

  /**
   * Test subscription status
   */
  public testSubscriptionStatus(): void {
    if (this.stompClient?.connected) {
      
      // Test sending a ping to verify connection
      try {
        this.stompClient.publish({
          destination: '/app/chat.sendMessage',
          body: JSON.stringify({
            senderId: this.currentUserId ? +this.currentUserId : 0,
            content: 'PING from Unified Chat Service',
            senderRole: 'VIP',
            timestamp: new Date().toISOString(),
            chatType: 'COMMUNITY'
          })
        });
      } catch (error) {
      }
    } else {
    }
  }
}
