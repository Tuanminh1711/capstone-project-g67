import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import SockJS from 'sockjs-client';
import { Client } from '@stomp/stompjs';

export interface ChatMessage {
  senderId?: number;
  receiverId?: number;
  senderRole?: string;
  content: string;
  timestamp?: string;
}

@Injectable({
  providedIn: 'root'
})
export class ChatService {
  private stompClient: Client | null = null;
  private messagesSubject = new BehaviorSubject<ChatMessage[]>([]);
  public messages$ = this.messagesSubject.asObservable();
  private isConnected = false;

  constructor(private http: HttpClient) {}

  connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (this.isConnected) {
        resolve();
        return;
      }

      this.stompClient = new Client({
        webSocketFactory: () => new SockJS(`${environment.wsUrl}/ws-chat`),
        onConnect: (frame) => {
          console.log('ChatService - Connected to WebSocket:', frame);
          this.isConnected = true;
          
          // Subscribe to VIP community topic
          this.stompClient!.subscribe('/topic/vip-community', (message) => {
            console.log('ChatService - Received message from /topic/vip-community:', message);
            const chatMessage: ChatMessage = JSON.parse(message.body);
            console.log('ChatService - Parsed chat message:', chatMessage);
            this.addMessage(chatMessage);
          });
          console.log('ChatService - Subscribed to /topic/vip-community');

          resolve();
        },
        onStompError: (error) => {
          console.error('WebSocket connection error:', error);
          this.isConnected = false;
          reject(error);
        }
      });

      this.stompClient.activate();
    });
  }

  disconnect(): void {
    if (this.stompClient && this.isConnected) {
      this.stompClient.deactivate();
      this.isConnected = false;
    }
  }

  sendMessage(message: ChatMessage): void {
    console.log('ChatService - Sending message:', message);
    console.log('ChatService - Message JSON:', JSON.stringify(message));
    console.log('ChatService - WebSocket connected:', this.isConnected);
    console.log('ChatService - STOMP client exists:', !!this.stompClient);
    
    if (this.stompClient && this.isConnected) {
      this.stompClient.publish({
        destination: '/app/chat.sendMessage',
        body: JSON.stringify(message)
      });
      console.log('ChatService - Message sent successfully to /app/chat.sendMessage');
    } else {
      console.error('ChatService - WebSocket not connected. Message not sent:', message);
      console.error('ChatService - Connection status:', {
        isConnected: this.isConnected,
        stompClientExists: !!this.stompClient
      });
    }
  }

  private addMessage(message: ChatMessage): void {
    console.log('ChatService - Adding message to list:', message);
    const currentMessages = this.messagesSubject.value;
    console.log('ChatService - Current messages count:', currentMessages.length);
    this.messagesSubject.next([...currentMessages, message]);
    console.log('ChatService - Updated messages count:', this.messagesSubject.value.length);
  }

  getChatHistory(): Observable<ChatMessage[]> {
    return this.http.get<ChatMessage[]>(`${environment.apiUrl}/chat/history`);
  }

  loadChatHistory(): void {
    console.log('ChatService - Loading chat history...');
    this.getChatHistory().subscribe(
      (messages) => {
        console.log('ChatService - Received chat history:', messages);
        this.messagesSubject.next(messages);
      },
      (error) => {
        console.error('ChatService - Error loading chat history:', error);
      }
    );
  }

  isConnectedToWebSocket(): boolean {
    return this.isConnected;
  }
} 