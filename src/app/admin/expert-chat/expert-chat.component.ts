import { Component, OnInit, OnDestroy, ViewChild, ElementRef, AfterViewChecked } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ChatService, ChatMessage } from '../../shared/chat/chat.service';
import { JwtUserUtilService } from '../../auth/jwt-user-util.service';

import { Subscription } from 'rxjs';

@Component({
  selector: 'app-expert-chat',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './expert-chat.component.html',
  styleUrls: ['./expert-chat.component.scss']
})
export class ExpertChatComponent implements OnInit, OnDestroy, AfterViewChecked {
  @ViewChild('messagesContainer') private messagesContainer!: ElementRef;
  
  messages: ChatMessage[] = [];
  newMessage: string = '';
  currentUserId: string | null = null;
  currentUserRole: string | null = null;
  isConnected = false;
  loading = true;
  
  private messagesSubscription: Subscription | null = null;

  constructor(
    private chatService: ChatService,
    private jwtUserUtil: JwtUserUtilService
  ) {
    console.log('🔍 Expert Chat Component - Constructor called');
  }

  ngOnInit(): void {
    console.log('🔍 Expert Chat Component - ngOnInit called');
    this.currentUserId = this.jwtUserUtil.getUserIdFromToken();
    this.currentUserRole = this.jwtUserUtil.getRoleFromToken();
    
    console.log('Expert Chat - User ID:', this.currentUserId);
    console.log('Expert Chat - User Role:', this.currentUserRole);
    
    if (this.currentUserRole !== 'EXPERT') {
      console.error('Chỉ chuyên gia mới có thể truy cập chat này');
      console.error('Current role:', this.currentUserRole);
      return;
    }

    this.initializeChat();
  }

  ngOnDestroy(): void {
    this.messagesSubscription?.unsubscribe();
    this.chatService.disconnect();
  }

  ngAfterViewChecked(): void {
    this.scrollToBottom();
  }

  private async initializeChat(): Promise<void> {
    try {
      await this.chatService.connect();
      this.isConnected = true;
      
      // Load chat history
      this.chatService.loadChatHistory();
      
      // Subscribe to new messages
      this.messagesSubscription = this.chatService.messages$.subscribe(
        (messages) => {
          this.messages = messages;
          this.loading = false;
        }
      );
    } catch (error) {
      console.error('Error initializing chat:', error);
      this.loading = false;
    }
  }

  sendMessage(): void {
    if (!this.newMessage.trim() || !this.currentUserId) return;

    const senderId = parseInt(this.currentUserId);
    if (isNaN(senderId)) {
      console.error('Invalid sender ID:', this.currentUserId);
      return;
    }

    const message: ChatMessage = {
      senderId: senderId,
      content: this.newMessage.trim(),
      timestamp: new Date().toISOString()
    };

    console.log('Sending message:', message);
    this.chatService.sendMessage(message);
    this.newMessage = '';
  }

  onKeyPress(event: KeyboardEvent): void {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      this.sendMessage();
    }
  }

  isOwnMessage(message: ChatMessage): boolean {
    return message.senderId?.toString() === this.currentUserId;
  }

  getMessageTime(timestamp: string): string {
    return new Date(timestamp).toLocaleTimeString('vi-VN', {
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  private scrollToBottom(): void {
    try {
      this.messagesContainer.nativeElement.scrollTop = this.messagesContainer.nativeElement.scrollHeight;
    } catch (err) {}
  }

  getConnectionStatus(): string {
    return this.isConnected ? 'Đã kết nối' : 'Đang kết nối...';
  }

  trackByMessageId(index: number, message: ChatMessage): string {
    return `${message.senderId}-${message.timestamp}-${index}`;
  }
} 