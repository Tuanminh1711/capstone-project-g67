import { Component, OnInit, OnDestroy, ChangeDetectorRef, NgZone, AfterViewChecked, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { Router, ActivatedRoute } from '@angular/router';
import { AuthService } from '../../../auth/auth.service';
import { ExpertLayoutComponent } from '../shared/expert-layout/expert-layout.component';
import { ExpertChatStompService } from './expert-chat-stomp.service';
import { ChatMessage } from '../../vip/chat/chat-stomp.service';
import { Subscription, BehaviorSubject, Subject } from 'rxjs';
import { UrlService } from '../../../shared/services/url.service';
import { ChatService } from '../../../shared/services/chat.service';
import { ToastService } from '../../../shared/toast/toast.service';
import { UnifiedChatService } from '../../../shared/services/unified-chat.service';

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
  imports: [CommonModule, FormsModule],
  templateUrl: './expert-private-chat.component.html',
  styleUrls: ['./expert-private-chat.component.scss']
})
export class ExpertPrivateChatComponent implements OnInit, OnDestroy, AfterViewChecked {
  // Enhanced chat state management
  private messagesSubject = new BehaviorSubject<ChatMessage[]>([]);
  public messages$ = this.messagesSubject.asObservable();
  
  // Private chat state
  private conversationsSubject = new BehaviorSubject<PrivateConversation[]>([]);
  public conversations$ = this.conversationsSubject.asObservable();
  
  // UI state
  public loading = false;
  public error = '';
  public newMessage = '';
  public showConversationList = true;
  public isTyping = false;
  public typingUsers = new Set<string>();
  
  // Scroll management
  private shouldScrollToBottom = false;
  
  // View references
  @ViewChild('messagesContainer', { static: false }) messagesContainer!: ElementRef;
  
  // Private properties
  private destroy$ = new Subject<void>();
  private typingTimeout?: any;
  
  // WebSocket subscriptions
  private wsSub?: Subscription;
  private wsErrSub?: Subscription;
  private wsPrivateSub?: Subscription;
  private wsTypingSub?: Subscription;
  
  // User info
  public currentUserId: string | null = null;
  public currentUserRole: string | null = null;
  
  // Selected conversation
  public selectedConversation: PrivateConversation | null = null;
  
  // Getters for template access
  get conversations(): PrivateConversation[] {
    return this.conversationsSubject.value;
  }

  get messages(): ChatMessage[] {
    return this.messagesSubject.value;
  }

  // Enhanced filtering with better message type handling
  public get filteredMessages(): ChatMessage[] {
    if (!this.showConversationList && this.selectedConversation && this.currentUserId) {
      const otherUserId = this.selectedConversation.otherUserId;
      const currentUserId = +this.currentUserId;
      const conversationId = this.selectedConversation.conversationId;
      
      console.log('=== Expert: Filtering PRIVATE messages ===');
      console.log('Selected conversation:', this.selectedConversation);
      console.log('Total messages in subject:', this.messagesSubject.value.length);
      
      // Chỉ hiển thị private messages của conversation hiện tại
      const privateMessages = this.messagesSubject.value.filter(
        (m: ChatMessage) =>
          m.chatType === 'PRIVATE' &&
          m.conversationId === conversationId &&
          ((m.senderId === otherUserId && m.receiverId === currentUserId) ||
           (m.receiverId === otherUserId && m.senderId === currentUserId))
      );
      
      console.log('Filtered private messages:', privateMessages);
      return privateMessages;
      
    } else {
      console.log('=== Expert: Filtering COMMUNITY messages ===');
      console.log('Total messages in subject:', this.messagesSubject.value.length);
      
      // Chỉ hiển thị community messages (không có conversationId và receiverId)
      const communityMessages = this.messagesSubject.value.filter(
        (m: ChatMessage) => 
          m.chatType === 'COMMUNITY' && 
          !m.conversationId &&
          !m.receiverId
      );
      
      console.log('Filtered community messages:', communityMessages);
      return communityMessages;
    }
  }

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private authService: AuthService,
    private cdr: ChangeDetectorRef,
    private zone: NgZone,
    private http: HttpClient,
    private urlService: UrlService,
    private chatService: ChatService,
    private toastService: ToastService,
    private unifiedChat: UnifiedChatService // Thay thế ExpertChatStompService
  ) {}

  ngOnInit(): void {
    this.initializeChat();
  }

  private initializeChat(): void {
    // Kiểm tra quyền truy cập Expert
    const userRole = this.authService.getCurrentUserRole();
    if (userRole !== 'EXPERT') {
      this.error = 'Bạn cần có tài khoản Chuyên gia để truy cập phòng chat này.';
      this.cdr.markForCheck();
      return;
    }

    this.currentUserId = this.authService.getCurrentUserId();
    this.currentUserRole = this.authService.getCurrentUserRole();
    
    if (!this.currentUserId) {
      this.error = 'Không thể xác định người dùng. Vui lòng đăng nhập lại.';
      this.cdr.markForCheck();
      return;
    }

    // Load initial data
    this.loadConversations();
    // this.loadExperts(); // Method này không tồn tại trong Expert component

    // Connect to Unified Chat Service
    this.connectToUnifiedChat();
  }

  private async connectToUnifiedChat(): Promise<void> {
    try {
      console.log('=== Expert: Connecting to Unified Chat Service ===');
      
      // Get auth token if available - sử dụng localStorage hoặc sessionStorage
      const token = localStorage.getItem('authToken') || sessionStorage.getItem('authToken') || undefined;
      
      await this.unifiedChat.connect(this.currentUserId!, token);
      
      console.log('=== Expert: Connected to Unified Chat Service successfully ===');
      
      // Setup message subscriptions
      this.setupUnifiedChatSubscriptions();
      
      this.error = '';
      this.cdr.markForCheck();
      
    } catch (err) {
      console.error('Failed to connect to Unified Chat Service:', err);
      this.error = 'Không thể kết nối chat: ' + (err instanceof Error ? err.message : err);
      this.cdr.markForCheck();
    }
  }

  private setupUnifiedChatSubscriptions(): void {
    console.log('=== Expert: Setting up Unified Chat subscriptions ===');
    
    // Subscribe to community messages
    this.unifiedChat.communityMessages$.subscribe((msg: ChatMessage) => {
      console.log('=== Expert: Received community message from Unified Chat ===');
      console.log('Message:', msg);
      
      this.zone.run(() => {
        console.log('Received community message:', msg);
        
        // Chỉ add community message khi đang ở community chat
        if (this.showConversationList) {
          console.log('Adding community message to chat');
          this.addMessageToChat(msg);
        } else {
          console.log('Skipping community message - currently in private chat');
        }
        
        this.cdr.markForCheck();
      });
    });

    // Subscribe to private messages
    this.unifiedChat.privateMessages$.subscribe((msg: ChatMessage) => {
      console.log('=== Expert: Received private message from Unified Chat ===');
      console.log('Message:', msg);
      console.log('Message details:', {
        senderId: msg.senderId,
        receiverId: msg.receiverId,
        content: msg.content,
        chatType: msg.chatType,
        conversationId: msg.conversationId
      });
      
      this.zone.run(() => {
        console.log('Received private message:', msg);
        
        // Chỉ add private message khi đang ở private chat
        if (!this.showConversationList && this.selectedConversation) {
          console.log('Adding private message to chat');
          this.addMessageToChat(msg);
          
          // Update conversation and scroll if we're in the right private chat
          if (this.currentUserId && this.isMessageInCurrentConversation(msg)) {
            this.scrollToBottom();
          }
        } else {
          console.log('Skipping private message - currently in community chat or no conversation selected');
        }
        
        this.cdr.markForCheck();
      });
    });

    // Subscribe to errors
    this.unifiedChat.errors$.subscribe((error: string) => {
      console.error('=== Expert: Received error from Unified Chat ===');
      console.error('Error:', error);
      
      this.zone.run(() => {
        console.error('Unified Chat error:', error);
        this.error = error;
        this.toastService.error(error, 5000);
        this.cdr.markForCheck();
      });
    });

    // Subscribe to connection status
    this.unifiedChat.connectionStatus$.subscribe((status) => {
      console.log('=== Expert: Unified Chat connection status changed ===');
      console.log('Status:', status);
      
      if (status.error) {
        this.error = `Chat connection error: ${status.error}`;
        this.cdr.markForCheck();
      } else if (status.connected) {
        this.error = '';
        this.cdr.markForCheck();
      }
    });

    console.log('=== Expert: Unified Chat subscriptions setup completed ===');
  }

  // Enhanced message management
  private addMessageToChat(message: ChatMessage): void {
    if (!message) return;
    
    // Ensure message has required fields
    if (!message.timestamp) {
      message.timestamp = new Date().toISOString();
    }
    
    // Kiểm tra duplicate trước khi add với logic mạnh mẽ hơn
    const currentMessages = this.messagesSubject.value;
    const isDuplicate = currentMessages.some(existingMsg => {
      // Kiểm tra theo messageId nếu có
      if (message.messageId && existingMsg.messageId) {
        return message.messageId === existingMsg.messageId;
      }
      // Fallback: kiểm tra theo tất cả thuộc tính quan trọng
      return existingMsg.timestamp === message.timestamp &&
             existingMsg.senderId === message.senderId &&
             existingMsg.receiverId === message.receiverId &&
             existingMsg.content === message.content &&
             existingMsg.chatType === message.chatType &&
             existingMsg.conversationId === message.conversationId;
    });
    
    if (isDuplicate) {
      console.log('Message already exists, skipping duplicate:', message);
      return;
    }
    
    // Add message locally for immediate feedback
    const updatedMessages = [...currentMessages, message];
    this.messagesSubject.next(updatedMessages);
  }

  private isMessageInCurrentConversation(message: ChatMessage): boolean {
    if (!this.selectedConversation || !message.senderId || !message.receiverId) {
      return false;
    }
    
    const currentUserId = +this.currentUserId!;
    const otherUserId = this.selectedConversation.otherUserId;
    
    return (message.senderId === otherUserId && message.receiverId === currentUserId) ||
           (message.receiverId === otherUserId && message.senderId === currentUserId);
  }

  private updateConversationWithMessage(message: ChatMessage): void {
    if (!this.currentUserId || !message.senderId || !message.receiverId) return;
    
    const conversationId = this.generateConversationId(message.senderId, message.receiverId);
    const otherUserId = message.senderId === +this.currentUserId ? message.receiverId : message.senderId;
    
    const conversations = this.conversationsSubject.value;
    let conversation = conversations.find(c => c.conversationId === conversationId);
    
    if (!conversation) {
      // Create new conversation
      conversation = {
        conversationId: conversationId,
        otherUserId: otherUserId,
        otherUsername: `User ${otherUserId}`,
        otherUserRole: message.senderRole || 'VIP',
        lastMessage: message.content,
        lastMessageTime: message.timestamp || new Date().toISOString(),
        hasUnreadMessages: true
      };
      const updatedConversations = [conversation, ...conversations];
      this.conversationsSubject.next(updatedConversations);
    } else {
      // Update existing conversation
      const updatedConversations = conversations.map(c => 
        c.conversationId === conversationId 
          ? { ...c, lastMessage: message.content, lastMessageTime: message.timestamp || new Date().toISOString(), hasUnreadMessages: true }
          : c
      );
      
      // Move to top
      const conversationToMove = updatedConversations.find(c => c.conversationId === conversationId);
      if (conversationToMove) {
        const filteredConversations = updatedConversations.filter(c => c.conversationId !== conversationId);
        this.conversationsSubject.next([conversationToMove, ...filteredConversations]);
      }
    }
    
    this.cdr.markForCheck();
  }

  // Load conversations và tự động chọn nếu có conversationId
  public loadConversationsWithSelect(conversationId?: string): void {
    this.loading = true;
    
    this.chatService.getConversations().subscribe({
      next: (data) => {
        // Convert ConversationDTO[] to PrivateConversation[]
        const conversations = data.map(conv => this.convertToPrivateConversation(conv));
        
        // Update conversations
        this.conversationsSubject.next(conversations);
        this.loading = false;
        
        // Force UI update
        this.cdr.detectChanges();
        
        if (conversationId) {
          const found = conversations.find(c => c.conversationId === conversationId);
          if (found) {
            this.selectConversation(found);
          } else {
            // Conversation not found
          }
        }
      },
      error: (err) => {
        this.error = 'Không thể tải danh sách trò chuyện';
        this.loading = false;
        this.cdr.detectChanges();
      }
    });
  }

  // Load conversations for expert
  public loadConversations(): void {
    this.loading = true;
    
    this.chatService.getConversations().subscribe({
      next: (data) => {
        // Convert ConversationDTO[] to PrivateConversation[]
        const conversations = data.map(conv => this.convertToPrivateConversation(conv));
        this.conversationsSubject.next(conversations);
        this.loading = false;
        this.cdr.markForCheck();
      },
      error: (err) => {
        this.error = 'Không thể tải danh sách trò chuyện';
        this.loading = false;
        this.cdr.markForCheck();
      }
    });
  }

  // Touch event handlers cho mobile
  public onTouchStart(event: TouchEvent, conversation: PrivateConversation): void {
    event.preventDefault();
  }

  public onTouchEnd(event: TouchEvent, conversation: PrivateConversation): void {
    event.preventDefault();
    this.selectConversation(conversation);
  }

  // Select conversation and load messages
  public selectConversation(conversation: PrivateConversation): void {
    // Update UI state FIRST
    this.selectedConversation = conversation;
    this.showConversationList = false;
    
    // Force change detection
    this.cdr.detectChanges();
    
    // Then load messages
    this.loadPrivateMessages(conversation.otherUserId);
    
    // Bỏ tính năng mark messages as read để tránh lỗi
    // this.markMessagesAsRead();
  }

  // Load private messages for specific conversation
  public loadPrivateMessages(otherUserId: number): void {
    this.loading = true;
    
    console.log('=== Expert: Loading private messages for user:', otherUserId);
    
    // TEMP FIX: Clear messages trước khi load để tránh duplicate
    console.log('=== TEMP FIX: Clearing messages before loading private messages ===');
    this.messagesSubject.next([]);
    
    this.chatService.getPrivateMessages(otherUserId).subscribe({
      next: (data) => {
        // Chỉ hiển thị tin nhắn PRIVATE
        const privateMessages = (data || []).filter((m: any) => m.chatType === 'PRIVATE');
        
        console.log('=== Expert: Loaded private messages:', privateMessages);
        
        // Ensure all private messages have proper chatType
        const processedMessages = privateMessages.map((msg: any) => ({
          ...msg,
          chatType: 'PRIVATE' as const,
          timestamp: msg.timestamp || new Date().toISOString()
        }));
        
        // Update messages (giống VIP - không merge, chỉ replace)
        this.messagesSubject.next(processedMessages);
        this.loading = false;
        
        // Force UI update
        this.cdr.detectChanges();
        
        // Scroll to bottom
        setTimeout(() => {
          this.scrollToBottom();
        }, 100);
      },
      error: (err) => {
        this.error = 'Không thể tải tin nhắn';
        this.loading = false;
        this.cdr.detectChanges();
      }
    });
  }

  // Go back to conversation list
  public backToConversations(): void {
    console.log('=== Expert: backToConversations called ===');
    console.log('Current showConversationList:', this.showConversationList);
    console.log('Current selectedConversation:', this.selectedConversation);
    
    this.selectedConversation = null;
    this.showConversationList = true;
    
    console.log('After update - showConversationList:', this.showConversationList);
    
    // TEMP FIX: Clear messages và load community messages
    console.log('=== TEMP FIX: Clearing messages and loading community ===');
    this.messagesSubject.next([]);
    
    // Load community messages
    this.loadCommunityMessages();
  }
  
  // Load community messages
  private loadCommunityMessages(): void {
    console.log('=== Expert: Loading community messages ===');
    
    // Clear tất cả messages để chỉ hiển thị community
    this.messagesSubject.next([]);
    
    // Load community messages từ backend
    this.chatService.getChatHistory().subscribe({
      next: (data: any) => {
        const messages = Array.isArray(data) ? data : data?.data || [];
        
        // Chỉ lấy COMMUNITY messages
        const communityMessages = messages.filter((msg: any) => 
          msg.chatType === 'COMMUNITY' || 
          (!msg.chatType && !msg.conversationId && !msg.receiverId) // Fallback cho messages cũ
        );
        
        console.log('=== Expert: Loaded community messages from backend:', communityMessages);
        
        // Ensure all messages have proper chatType
        const processedMessages = communityMessages.map((msg: any) => ({
          ...msg,
          chatType: 'COMMUNITY' as const,
          timestamp: msg.timestamp || new Date().toISOString()
        }));
        
        // Update messages
        this.messagesSubject.next(processedMessages);
        this.cdr.markForCheck();
      },
      error: (err) => {
        console.error('Failed to load community messages:', err);
        this.error = 'Không thể tải tin nhắn cộng đồng';
        this.cdr.markForCheck();
      }
    });
  }

  // Generate conversation ID
  private generateConversationId(user1Id: number, user2Id: number): string {
    const minId = Math.min(user1Id, user2Id);
    const maxId = Math.max(user1Id, user2Id);
    return `conv_${minId}_${maxId}`;
  }

  // Enhanced message sending with Unified Chat Service
  public sendMessage(): void {
    if (!this.newMessage.trim()) return;

    const userId = this.authService.getCurrentUserId();
    const userRole = this.authService.getCurrentUserRole();

    if (!userId) {
      this.error = 'Không thể xác định người dùng. Vui lòng đăng nhập lại.';
      this.cdr.markForCheck();
      return;
    }

    if (!userRole || (userRole !== 'VIP' && userRole !== 'EXPERT')) {
      this.error = 'Chỉ tài khoản VIP hoặc Chuyên gia mới được chat.';
      this.cdr.markForCheck();
      return;
    }

    // Xác định chatType dựa trên context hiện tại
    let chatType: 'COMMUNITY' | 'PRIVATE';
    let conversationId: string | undefined;
    let receiverId: number | undefined;

    if (!this.showConversationList && this.selectedConversation) {
      chatType = 'PRIVATE';
      conversationId = this.selectedConversation.conversationId;
      receiverId = this.selectedConversation.otherUserId;
    } else {
      chatType = 'COMMUNITY';
      // Community messages không có conversationId và receiverId
    }

    const message: ChatMessage = {
      senderId: +userId,
      content: this.newMessage.trim(),
      senderRole: userRole,
      timestamp: new Date().toISOString(),
      chatType: chatType,
      conversationId: conversationId,
      receiverId: receiverId
    };

    if (chatType === 'PRIVATE') {
      // Private chat - không add locally, chỉ gửi và chờ nhận từ WebSocket
      console.log('Sending private message via Unified Chat Service:', message);
      
      // Send via Unified Chat Service
      this.unifiedChat.sendPrivateMessage(message).catch(err => {
        console.error('Failed to send private message via Unified Chat Service:', err);
        this.error = 'Không thể gửi tin nhắn: ' + err;
        this.toastService.error(this.error, 5000);
        this.cdr.markForCheck();
      });
    } else {
      // Community chat - không add locally, chỉ gửi và chờ nhận từ WebSocket
      console.log('Sending community message via Unified Chat Service:', message);
      
      // Send via Unified Chat Service
      this.unifiedChat.sendCommunityMessage(message).catch(err => {
        console.error('Failed to send community message via Unified Chat Service:', err);
        this.toastService.error('Failed to send message: ' + err, 5000);
        this.cdr.markForCheck();
      });
    }

    this.newMessage = '';
    this.error = '';
    
    // Scroll to bottom after sending message
    setTimeout(() => {
      this.scrollToBottom();
    }, 100);
    this.cdr.markForCheck();
  }

  // Typing indicators
  public onTyping(): void {
    if (this.typingTimeout) {
      clearTimeout(this.typingTimeout);
    }
    
    this.isTyping = true;
    this.cdr.markForCheck();
    
    // Send typing indicator via Unified Chat Service
    if (this.selectedConversation) {
      this.unifiedChat.sendTypingIndicator({
        conversationId: this.selectedConversation.conversationId,
        isTyping: true
      });
    }
    
    // Clear typing indicator after delay
    this.typingTimeout = setTimeout(() => {
      this.isTyping = false;
      if (this.selectedConversation) {
        this.unifiedChat.sendTypingIndicator({
          conversationId: this.selectedConversation.conversationId,
          isTyping: false
        });
      }
      this.cdr.markForCheck();
    }, 3000);
  }



  // Message ownership detection
  public isOwnMessage(message: ChatMessage): boolean {
    if (!this.currentUserId || !message?.senderId) {
      return false;
    }
    
    const currentId = this.currentUserId.toString().trim();
    const senderId = message.senderId.toString().trim();
    return currentId === senderId;
  }

  // UI Helper methods
  public onEnterPress(event: Event): void {
    const keyboardEvent = event as KeyboardEvent;
    if (keyboardEvent.key === 'Enter' && !keyboardEvent.shiftKey) {
      event.preventDefault();
      this.sendMessage();
    }
  }

  // Removed duplicate public scrollToBottom method

  // Utility methods for template
  public trackMessage(index: number, message: ChatMessage): any {
    return message.timestamp || index;
  }

  public getAvatarUrl(message: ChatMessage): string {
    return 'assets/image/default-avatar.png';
  }

  public getAvatarInitial(message: ChatMessage): string {
    const senderName = this.getSenderName(message);
    if (senderName && senderName.length > 0) {
      return senderName.charAt(0).toUpperCase();
    }
    return '?';
  }

  public getSenderName(message: ChatMessage): string {
    // For own messages, use a simple label
    if (this.isOwnMessage(message)) {
      return 'Bạn';
    }
    // For other messages in private chat, use the other user's username
    if (this.selectedConversation) {
      return this.selectedConversation.otherUsername;
    }
    // Fallback
    return 'Thành viên';
  }

  public getRoleBadgeClass(role?: string): string {
    switch (role) {
      case 'VIP': return 'vip-badge';
      case 'EXPERT': return 'expert-badge';
      case 'STAFF': return 'expert-badge';
      case 'ADMIN': return 'expert-badge';
      default: return 'user-badge';
    }
  }

  public getRoleDisplayName(role?: string): string {
    switch (role) {
      case 'VIP': return 'VIP';
      case 'EXPERT': return 'Chuyên gia';
      case 'STAFF': return 'Nhân viên';
      case 'ADMIN': return 'Quản trị';
      default: return 'Thành viên';
    }
  }

  public formatTime(timestamp?: string): string {
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

  public formatConversationTime(timestamp?: string): string {
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

  /**
   * Convert ConversationDTO to PrivateConversation
   */
  private convertToPrivateConversation(conv: any): PrivateConversation {
    return {
      conversationId: conv.conversationId || '',
      otherUserId: conv.otherUserId || 0,
      otherUsername: conv.otherUsername || '',
      otherUserRole: conv.otherUserRole || '',
      lastMessage: conv.lastMessage || '',
      lastMessageTime: conv.lastMessageTime || '',
      hasUnreadMessages: conv.hasUnreadMessages || false
    };
  }

  ngOnDestroy(): void {
    if (this.typingTimeout) {
      clearTimeout(this.typingTimeout);
    }
    
    this.unifiedChat.disconnect();
  }

  // Update WebSocket test methods to use Unified Chat Service
  public testWebSocketConnection(): void {
    console.log('=== Expert: Testing Unified Chat Service connection ===');
    
    if (this.unifiedChat.isConnected()) {
      console.log('✅ Unified Chat Service is connected');
      this.unifiedChat.testConnection();
      this.toastService.success('Unified Chat Service connection test successful', 3000);
    } else {
      console.log('❌ Unified Chat Service not connected, attempting to connect...');
      this.connectToUnifiedChat().then(() => {
        this.toastService.success('Connected to Unified Chat Service successfully', 3000);
      }).catch(err => {
        console.error('Failed to connect to Unified Chat Service:', err);
        this.toastService.error('Failed to connect: ' + err, 5000);
      });
    }
  }

  public testWebSocketUrlDetection(): void {
    console.log('=== Expert: Testing WebSocket URL Detection ===');
    this.unifiedChat.testWebSocketUrlDetection();
    this.toastService.success('WebSocket URL detection test completed', 3000);
  }

  public testCspBypass(): void {
    console.log('=== Expert: Testing CSP Bypass ===');
    this.unifiedChat.testCspBypass();
    this.toastService.success('CSP bypass test completed', 3000);
  }

  public testSubscriptionStatus(): void {
    console.log('=== Expert: Testing Subscription Status ===');
    this.unifiedChat.testSubscriptionStatus();
    this.toastService.success('Subscription status test completed', 3000);
  }

  public debugSubscriptions(): void {
    console.log('=== Expert: Debug Subscriptions ===');
    this.unifiedChat.debugSubscriptions();
    this.toastService.success('Subscription debug completed', 3000);
  }

  public checkWebSocketStatus(): void {
    console.log('=== Expert: Unified Chat Service Status Check ===');
    
    const status = this.unifiedChat.getConnectionStatus();
    const stats = this.unifiedChat.getConnectionStats();
    
    console.log('Connection status:', status);
    console.log('Connection stats:', stats);
    console.log('Current user ID:', this.currentUserId);
    console.log('Selected conversation:', this.selectedConversation);
  }

  public forceSetupSubscriptions(): void {
    console.log('=== Expert: Force setting up Unified Chat subscriptions ===');
    
    if (this.unifiedChat.isConnected()) {
      console.log('Unified Chat Service is connected, setting up subscriptions...');
      this.setupUnifiedChatSubscriptions();
      this.toastService.success('Unified Chat subscriptions setup completed', 3000);
    } else {
      console.log('Unified Chat Service not connected, attempting to connect...');
      this.connectToUnifiedChat().catch(err => {
        console.error('Failed to connect to Unified Chat Service:', err);
        this.toastService.error('Failed to connect: ' + err, 5000);
      });
    }
  }

  public debugPrivateMessageRouting(): void {
    console.log('=== Expert: Debug Private Message Routing ===');
    console.log('Current user ID:', this.currentUserId);
    console.log('Selected conversation:', this.selectedConversation);
    console.log('Unified Chat Service connected:', this.unifiedChat.isConnected());
    console.log('Unified Chat Service status:', this.unifiedChat.getConnectionStatus());
    
    if (this.selectedConversation) {
      console.log('Conversation details:', {
        conversationId: this.selectedConversation.conversationId,
        otherUserId: this.selectedConversation.otherUserId,
        otherUsername: this.selectedConversation.otherUsername
      });
    }
    
    this.toastService.success('Private message routing debug completed', 3000);
  }

  // Scroll management
  ngAfterViewChecked(): void {
    if (this.shouldScrollToBottom) {
      this.scrollToBottom();
      this.shouldScrollToBottom = false;
    }
  }

  private scrollToBottom(): void {
    try {
      if (this.messagesContainer) {
        const element = this.messagesContainer.nativeElement;
        element.scrollTop = element.scrollHeight;
      }
    } catch (err) {
      // Error scrolling to bottom
    }
  }

  private checkIfShouldScroll(): void {
    this.shouldScrollToBottom = true;
  }
}
