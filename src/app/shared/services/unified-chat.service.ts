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
      console.log('Connection already in progress...');
      return;
    }

    if (this.connectionStatus.value.connected) {
      console.log('Already connected to WebSocket');
      return;
    }

    this.currentUserId = userId;
    this.updateConnectionStatus({ connecting: true, connected: false, error: null });

    try {
      console.log(`=== Unified Chat: Connecting to WebSocket ===`);
      console.log(`User ID: ${userId}`);
      
      // Auto-detect WebSocket URL based on current environment
      const webSocketUrl = this.getWebSocketUrl();
      console.log(`WebSocket URL: ${webSocketUrl}`);
      console.log(`Current environment: ${environment.production ? 'PRODUCTION' : 'DEVELOPMENT'}`);

      // Create SockJS connection
      let socket: any;
      
      if (webSocketUrl.startsWith('/')) {
        // Relative URL - use proxy
        console.log(`Using proxy for WebSocket connection: ${webSocketUrl}`);
        socket = new SockJS(webSocketUrl);
      } else if (webSocketUrl.startsWith('ws://') || webSocketUrl.startsWith('wss://')) {
        // For WebSocket protocols, convert to HTTP/HTTPS for SockJS
        const httpUrl = webSocketUrl.replace('ws://', 'http://').replace('wss://', 'https://');
        console.log(`Converting WebSocket URL to HTTP for SockJS: ${webSocketUrl} -> ${httpUrl}`);
        socket = new SockJS(httpUrl);
      } else {
        // For HTTP/HTTPS URLs, use directly
        console.log(`Using direct HTTP connection: ${webSocketUrl}`);
        socket = new SockJS(webSocketUrl);
      }
      
      // Create STOMP client
      this.stompClient = new Client({
        webSocketFactory: () => socket as any,
        debug: (str: string) => {
          if (!environment.production) {
            // Only log in development
            console.debug('STOMP Debug:', str);
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
          console.log('=== Unified Chat: WebSocket connected successfully ===');
          this.updateConnectionStatus({ connecting: false, connected: true, error: null });
          this.reconnectAttempts = 0;
          
          // Setup subscriptions
          this.setupSubscriptions();
          
          resolve();
        };

        this.stompClient.onStompError = (frame: any) => {
          console.error('=== Unified Chat: WebSocket connection failed ===', frame);
          this.updateConnectionStatus({ 
            connecting: false, 
            connected: false, 
            error: frame.headers.message || 'STOMP Error' 
          });
          this.errorSubject.next(`Connection failed: ${frame.headers.message || 'STOMP Error'}`);
          reject(new Error(frame.headers.message || 'STOMP Error'));
        };

        this.stompClient.onWebSocketError = (event: Event) => {
          console.error('=== Unified Chat: WebSocket error ===', event);
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
      console.error('=== Unified Chat: Error during connection setup ===', error);
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
      console.error('=== Unified Chat: Cannot setup subscriptions - STOMP client not ready ===');
      console.error('STOMP client:', this.stompClient);
      console.error('Connected status:', this.stompClient?.connected);
      return;
    }

    console.log('=== Unified Chat: Setting up subscriptions ===');

    // Subscribe to all messages (community và private) từ cùng 1 topic
    const allMessagesSub = this.stompClient.subscribe('/topic/vip-community', (message: Message) => {
      try {
        const chatMessage: ChatMessage = JSON.parse(message.body);
        
        if (chatMessage.chatType === 'COMMUNITY') {
          console.log('=== Unified Chat: Received community message ===', chatMessage);
          this.communityMessageSubject.next(chatMessage);
        } else if (chatMessage.chatType === 'PRIVATE') {
          console.log('=== Unified Chat: Received private message ===', chatMessage);
          this.privateMessageSubject.next(chatMessage);
        }
      } catch (error) {
        console.error('Error parsing message:', error);
        console.error('Raw message body:', message.body);
      }
    });
    console.log('All messages subscription created:', allMessagesSub);

    // Subscribe to errors
    const errorSub = this.stompClient.subscribe('/user/queue/errors', (message: Message) => {
      try {
        const errorMessage = message.body;
        console.error('=== Unified Chat: Received error message ===', errorMessage);
        this.errorSubject.next(errorMessage);
      } catch (error) {
        console.error('Error parsing error message:', error);
      }
    });
    console.log('Error subscription created:', errorSub);

    console.log('=== Unified Chat: Subscriptions setup completed ===');
    console.log('All subscriptions:', { allMessagesSub, errorSub });
    
    // Debug subscription status
    console.log('Subscription details:');
    console.log('- All messages subscription ID:', allMessagesSub.id);
    console.log('- Error subscription ID:', errorSub.id);
    console.log('- Current user ID for private messages:', this.currentUserId);
    

  }



  /**
   * Send community message
   */
  public async sendCommunityMessage(message: ChatMessage): Promise<void> {
    if (!this.stompClient || !this.stompClient.connected) {
      throw new Error('WebSocket not connected');
    }

    try {
      console.log('=== Unified Chat: Sending community message ===', message);
      
      this.stompClient.publish({
        destination: '/app/chat.sendMessage',
        body: JSON.stringify(message)
      });
      
      console.log('Community message sent successfully');
    } catch (error) {
      console.error('Failed to send community message:', error);
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
      console.log('=== Unified Chat: Sending private message ===', message);

      // Gửi private message về cùng endpoint với community (backend sẽ phân biệt theo chatType)
      const result = this.stompClient.publish({
        destination: '/app/chat.sendMessage',
        body: JSON.stringify(message)
      });

      console.log('STOMP publish result:', result);
      console.log('Private message sent successfully');
    } catch (error) {
      console.error('Failed to send private message:', error);
      throw error;
    }
  }

  /**
   * Send typing indicator
   */
  public sendTypingIndicator(typingData: { conversationId: string; isTyping: boolean }): void {
    if (!this.stompClient || !this.stompClient.connected) {
      console.warn('Cannot send typing indicator: WebSocket not connected');
      return;
    }

    try {
      this.stompClient.publish({
        destination: '/app/chat.typing',
        body: JSON.stringify(typingData)
      });
    } catch (error) {
      console.error('Failed to send typing indicator:', error);
    }
  }



  /**
   * Disconnect from WebSocket
   */
  public disconnect(): void {
    console.log('=== Unified Chat: Disconnecting from WebSocket ===');
    
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
    console.log('=== Unified Chat: Force reconnecting ===');
    
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
        console.log(`=== Unified Chat: Auto-reconnect attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts} ===`);
        
        setTimeout(() => {
          this.connect(this.currentUserId!).catch(error => {
            console.error(`Auto-reconnect attempt ${this.reconnectAttempts} failed:`, error);
          });
        }, this.reconnectDelay * this.reconnectAttempts);
      }
    });
  }

  /**
   * Test WebSocket connection
   */
  public testConnection(): void {
    console.log('=== Unified Chat: Testing connection ===');
    console.log('Connection status:', this.getConnectionStatus());
    console.log('STOMP client:', this.stompClient);
    console.log('Current user ID:', this.currentUserId);
    console.log('Current hostname:', window.location.hostname);
    console.log('Detected WebSocket URL:', this.getWebSocketUrl());
    
    if (this.isConnected()) {
      console.log('✅ WebSocket is connected');
      
      // Test sending a ping message
      const testMessage: ChatMessage = {
        senderId: this.currentUserId ? +this.currentUserId : 0,
        content: 'Test message from Unified Chat Service',
        senderRole: 'VIP',
        timestamp: new Date().toISOString(),
        chatType: 'COMMUNITY'
      };
      
      this.sendCommunityMessage(testMessage).then(() => {
        console.log('✅ Test message sent successfully');
      }).catch(error => {
        console.error('❌ Test message failed:', error);
      });
    } else {
      console.log('❌ WebSocket is not connected');
    }
  }

  /**
   * Test WebSocket URL detection
   */
  public testWebSocketUrlDetection(): void {
    console.log('=== Unified Chat: Testing WebSocket URL Detection ===');
    console.log('Current hostname:', window.location.hostname);
    console.log('Current protocol:', window.location.protocol);
    console.log('Current port:', window.location.port);
    console.log('Environment production:', environment.production);
    console.log('Environment webSocketUrl:', environment.webSocketUrl);
    console.log('Detected WebSocket URL:', this.getWebSocketUrl());
    
    // Test CSP bypass
    const wsUrl = this.getWebSocketUrl();
    if (wsUrl.startsWith('ws://') || wsUrl.startsWith('wss://')) {
      const httpUrl = wsUrl.replace('ws://', 'http://').replace('wss://', 'https://');
      console.log('CSP Bypass: WebSocket URL -> HTTP URL:', wsUrl, '->', httpUrl);
    }
    
    console.log('=== End Test ===');
  }

  /**
   * Test CSP bypass logic
   */
  public testCspBypass(): void {
    console.log('=== Unified Chat: Testing CSP Bypass ===');
    
    const wsUrl = this.getWebSocketUrl();
    console.log('Original WebSocket URL:', wsUrl);
    
    if (wsUrl.startsWith('ws://') || wsUrl.startsWith('wss://')) {
      const httpUrl = wsUrl.replace('ws://', 'http://').replace('wss://', 'https://');
      console.log('Converted HTTP URL for SockJS:', httpUrl);
      console.log('✅ CSP bypass logic working correctly');
    } else {
      console.log('ℹ️ Using direct HTTP/HTTPS URL (no conversion needed)');
    }
    
    console.log('=== End CSP Test ===');
  }

  /**
   * Test subscription status
   */
  public testSubscriptionStatus(): void {
    console.log('=== Unified Chat: Testing Subscription Status ===');
    console.log('STOMP client:', this.stompClient);
    console.log('Connected:', this.stompClient?.connected);
    console.log('WebSocket readyState:', this.stompClient?.webSocket?.readyState);
    console.log('WebSocket URL:', this.stompClient?.webSocket?.url);
    
    if (this.stompClient?.connected) {
      console.log('✅ STOMP client is connected');
      
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
        console.log('✅ PING message sent successfully');
      } catch (error) {
        console.error('❌ Failed to send PING message:', error);
      }
    } else {
      console.log('❌ STOMP client is not connected');
    }
  }

  /**
   * Debug subscription details
   */
  public debugSubscriptions(): void {
    console.log('=== Unified Chat: Debug Subscriptions ===');
    
    if (!this.stompClient) {
      console.log('❌ No STOMP client');
      return;
    }
    
    console.log('STOMP client connected:', this.stompClient.connected);
    console.log('WebSocket readyState:', this.stompClient.webSocket?.readyState);
    console.log('WebSocket URL:', this.stompClient.webSocket?.url);
    console.log('Current user ID:', this.currentUserId);
    
    // Test if we can receive messages by checking subscription callbacks
    console.log('Community message subject observers:', this.communityMessageSubject.observed);
    console.log('Private message subject observers:', this.privateMessageSubject.observed);
    
    // Test private message subscription by sending a test message
    if (this.stompClient?.connected && this.currentUserId) {
      console.log('Testing private message subscription...');
      const testMessage = {
        senderId: +this.currentUserId,
        content: 'TEST PRIVATE MESSAGE SUBSCRIPTION',
        senderRole: 'VIP',
        timestamp: new Date().toISOString(),
        chatType: 'PRIVATE',
        conversationId: 'test_subscription',
        receiverId: +this.currentUserId // Send to self for testing
      };
      
      console.log('Sending test private message:', testMessage);
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
      
      // Simulate receiving this message to test subscription
      console.log('Simulating message reception...');
      this.privateMessageSubject.next(testMessage);
      console.log('✅ Message simulation completed');
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
}
