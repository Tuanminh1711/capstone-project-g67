import { Component, OnInit, OnDestroy, ChangeDetectorRef, NgZone } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { AuthService } from '../../auth/auth.service';
import { ExpertLayoutComponent } from '../shared/expert-layout/expert-layout.component';
import { ExpertChatStompService, ChatMessage } from './expert-chat-stomp.service';
import { Subscription } from 'rxjs';
import { UrlService } from '../../shared/url.service';

export interface PrivateConversation {
  conversationId: string;
  otherUserId: number;
  otherUsername: string;
  otherUserRole: string;
  lastMessage: string;
  lastMessageTime: string;
  hasUnreadMessages: boolean;
}

@Component({
  selector: 'app-expert-private-chat',
  standalone: true,
  imports: [CommonModule, FormsModule, ExpertLayoutComponent],
  templateUrl: './expert-private-chat.component.html',
  styleUrls: ['./expert-private-chat.component.scss']
})
export class ExpertPrivateChatComponent implements OnInit, OnDestroy {
  // Chat state
  messages: ChatMessage[] = [];
  newMessage = '';
  loading = false;
  error = '';
  
  // Private chat properties
  conversations: PrivateConversation[] = [];
  selectedConversation: PrivateConversation | null = null;
  showConversationList = true;
  
  // WebSocket subscriptions
  private wsSub?: Subscription;
  private wsErrSub?: Subscription;
  private wsPrivateSub?: Subscription;
  
  // User info
  currentUserId: string | null = null;
  currentUserRole: string | null = null;

  constructor(
    private router: Router,
    private authService: AuthService,
    private cdr: ChangeDetectorRef,
    private zone: NgZone,
    private ws: ExpertChatStompService,
    private http: HttpClient,
    private urlService: UrlService
  ) {}

  ngOnInit(): void {
    this.currentUserId = this.authService.getCurrentUserId();
    this.currentUserRole = this.authService.getCurrentUserRole();
    
    if (!this.currentUserId) {
      console.warn('⚠️ No current user ID found! User might not be logged in properly.');
      this.error = 'Không thể xác định người dùng. Vui lòng đăng nhập lại.';
      return;
    }

    // Load conversations first
    this.loadConversations();
    
    // Connect WebSocket
    this.connectToChat();
  }

  ngOnDestroy(): void {
    this.wsSub?.unsubscribe();
    this.wsErrSub?.unsubscribe();
    this.wsPrivateSub?.unsubscribe();
    this.ws.disconnect();
  }

  connectToChat(): void {
    this.ws.connect();
    
    // Subscribe to private messages only
    this.wsPrivateSub = this.ws.onPrivateMessage().subscribe((msg: ChatMessage) => {
      this.zone.run(() => {
        // Chỉ thêm tin nhắn riêng tư nếu liên quan đến expert này
        if (msg.chatType === 'PRIVATE' && 
            this.currentUserId &&
            (msg.senderId === +this.currentUserId || msg.receiverId === +this.currentUserId)) {
          console.log('📨 Expert received private message:', msg);
          
          // Nếu đang xem conversation cụ thể, chỉ thêm tin nhắn của conversation đó
          if (this.selectedConversation && msg.senderId && msg.receiverId) {
            const conversationId = this.generateConversationId(msg.senderId, msg.receiverId);
            if (conversationId === this.selectedConversation.conversationId) {
              this.messages.push(msg);
              this.cdr.markForCheck();
              this.scrollToBottom();
            }
          }
          
          // Cập nhật conversation list
          this.updateConversationList(msg);
        }
      });
    });
    
    // Subscribe to errors  
    this.wsErrSub = this.ws.onError().subscribe((err: string) => {
      this.zone.run(() => {
        this.error = err;
        this.cdr.markForCheck();
      });
    });
  }

  // Load conversations for expert
  loadConversations() {
    this.loading = true;
    const conversationsUrl = this.urlService.getApiUrl('api/chat/conversations');
    
    this.http.get<PrivateConversation[]>(conversationsUrl).subscribe({
      next: (data) => {
        this.conversations = data;
        this.loading = false;
        this.cdr.markForCheck();
      },
      error: (err) => {
        console.error('Error loading conversations:', err);
        this.error = 'Không thể tải danh sách trò chuyện';
        this.loading = false;
        this.cdr.markForCheck();
      }
    });
  }

  // Select conversation and load messages
  selectConversation(conversation: PrivateConversation) {
    this.selectedConversation = conversation;
    this.showConversationList = false;
    this.loadPrivateMessages(conversation.otherUserId);
  }

  // Load private messages for specific conversation
  loadPrivateMessages(otherUserId: number) {
    this.loading = true;
    const privateMessagesUrl = this.urlService.getApiUrl(`api/chat/private/${otherUserId}`);
    
    this.http.get<ChatMessage[]>(privateMessagesUrl).subscribe({
      next: (data) => {
        this.messages = data;
        this.loading = false;
        this.cdr.markForCheck();
        this.scrollToBottom();
      },
      error: (err) => {
        console.error('Error loading private messages:', err);
        this.error = 'Không thể tải tin nhắn';
        this.loading = false;
        this.cdr.markForCheck();
      }
    });
  }

  // Go back to conversation list
  backToConversations() {
    this.selectedConversation = null;
    this.showConversationList = true;
    this.messages = [];
  }

  // Update conversation list when new message arrives
  private updateConversationList(msg: ChatMessage) {
    if (!this.currentUserId || !msg.senderId || !msg.receiverId) return;
    
    const conversationId = this.generateConversationId(msg.senderId, msg.receiverId);
    const otherUserId = msg.senderId === +this.currentUserId ? msg.receiverId : msg.senderId;
    
    let conversation = this.conversations.find(c => c.conversationId === conversationId);
    
    if (!conversation) {
      // Create new conversation
      conversation = {
        conversationId: conversationId,
        otherUserId: otherUserId,
        otherUsername: `User ${otherUserId}`,
        otherUserRole: msg.senderRole || 'VIP',
        lastMessage: msg.content,
        lastMessageTime: msg.timestamp || new Date().toISOString(),
        hasUnreadMessages: true
      };
      this.conversations.unshift(conversation);
    } else {
      // Update existing conversation
      conversation.lastMessage = msg.content;
      conversation.lastMessageTime = msg.timestamp || new Date().toISOString();
      conversation.hasUnreadMessages = true;
      
      // Move to top
      this.conversations = this.conversations.filter(c => c.conversationId !== conversationId);
      this.conversations.unshift(conversation);
    }
    
    this.cdr.markForCheck();
  }

  // Generate conversation ID
  private generateConversationId(user1Id: number, user2Id: number): string {
    const minId = Math.min(user1Id, user2Id);
    const maxId = Math.max(user1Id, user2Id);
    return `conv_${minId}_${maxId}`;
  }

  // Send private message
  sendMessage() {
    if (!this.newMessage.trim() || !this.selectedConversation) return;
    
    const userId = this.authService.getCurrentUserId();
    const userRole = this.authService.getCurrentUserRole();
    
    if (!userId) {
      this.error = 'Không thể xác định người dùng. Vui lòng đăng nhập lại.';
      this.cdr.markForCheck();
      return;
    }
    
    const msg: ChatMessage = {
      senderId: +userId,
      receiverId: this.selectedConversation.otherUserId,
      content: this.newMessage.trim(),
      senderRole: userRole || undefined,
      timestamp: new Date().toISOString(),
      chatType: 'PRIVATE',
      conversationId: this.selectedConversation.conversationId
    };
    
    this.ws.sendPrivateMessage(msg).catch(err => {
      this.error = 'Không thể gửi tin nhắn: ' + err;
      this.cdr.markForCheck();
    });
    
    this.newMessage = '';
    this.error = '';
    this.cdr.markForCheck();
  }

  // Message ownership detection
  isOwnMessage(message: ChatMessage): boolean {
    if (!this.currentUserId || !message?.senderId) {
      return false;
    }
    
    const currentId = this.currentUserId.toString().trim();
    const senderId = message.senderId.toString().trim();
    return currentId === senderId;
  }

  // UI Helper methods
  onEnterPress(event: Event): void {
    const keyboardEvent = event as KeyboardEvent;
    if (keyboardEvent.key === 'Enter' && !keyboardEvent.shiftKey) {
      event.preventDefault();
      this.sendMessage();
    }
  }

  scrollToBottom(): void {
    setTimeout(() => {
      const container = document.querySelector('.chat-messages');
      if (container) {
        container.scrollTop = container.scrollHeight;
      }
    }, 100);
  }

  // Utility methods for template
  trackMessage(index: number, message: ChatMessage): any {
    return message.timestamp || index;
  }

  getAvatarUrl(message: ChatMessage): string {
    return 'assets/image/default-avatar.png';
  }

  getRoleBadgeClass(role?: string): string {
    switch (role) {
      case 'VIP': return 'vip-badge';
      case 'EXPERT': return 'expert-badge';
      case 'STAFF': return 'expert-badge';
      case 'ADMIN': return 'expert-badge';
      default: return 'user-badge';
    }
  }

  getRoleDisplayName(role?: string): string {
    switch (role) {
      case 'VIP': return 'VIP';
      case 'EXPERT': return 'Chuyên gia';
      case 'STAFF': return 'Nhân viên';
      case 'ADMIN': return 'Quản trị';
      default: return 'Thành viên';
    }
  }

  formatTime(timestamp?: string): string {
    if (!timestamp) return '';
    
    const date = new Date(timestamp);
    const now = new Date();
    
    const isToday = date.toDateString() === now.toDateString();
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    const isYesterday = date.toDateString() === yesterday.toDateString();
    
    const timeString = date.toLocaleTimeString('vi-VN', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    });
    
    if (isToday) {
      return timeString;
    } else if (isYesterday) {
      return `Hôm qua ${timeString}`;
    } else {
      const dateString = date.toLocaleDateString('vi-VN', {
        day: '2-digit',
        month: '2-digit'
      });
      return `${dateString} ${timeString}`;
    }
  }

  formatConversationTime(timestamp?: string): string {
    if (!timestamp) return '';
    
    const date = new Date(timestamp);
    const now = new Date();
    
    const isToday = date.toDateString() === now.toDateString();
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    const isYesterday = date.toDateString() === yesterday.toDateString();
    
    if (isToday) {
      return date.toLocaleTimeString('vi-VN', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
      });
    } else if (isYesterday) {
      return 'Hôm qua';
    } else {
      return date.toLocaleDateString('vi-VN', {
        day: '2-digit',
        month: '2-digit'
      });
    }
  }
}
