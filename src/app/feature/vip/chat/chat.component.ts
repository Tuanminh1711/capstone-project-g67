
import {
  Component,
  OnInit,
  OnDestroy,
  ChangeDetectorRef,
  NgZone,
  ChangeDetectionStrategy,
  TrackByFunction,
  ViewChild,
  ElementRef,
  AfterViewChecked,
} from '@angular/core';
import { TopNavigatorComponent } from '../../../shared/top-navigator/top-navigator.component';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { Subscription, Subject, BehaviorSubject } from 'rxjs';
import { takeUntil, debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { ChatStompService, ChatMessage } from './chat-stomp.service';
import { AuthService } from '../../../auth/auth.service';
import { trackByMessageId } from '../../../shared/services/performance';
import { environment } from '../../../../environments/environment';
import { UrlService } from '../../../shared/services/url.service';
import { ChatService, ExpertDTO } from '../../../shared/services/chat.service';
import { ConversationDTO } from './conversation.interface';
import { ToastService } from '../../../shared/toast/toast.service';
import { FooterComponent } from '../../../shared/footer/footer.component';
import { UnifiedChatService } from '../../../shared/services/unified-chat.service';
import { JwtUserUtilService } from '../../../auth/jwt-user-util.service';

// Interface cho thông tin user từ API admin (chỉ lấy thông tin cần thiết)
interface UserProfile {
  id: number;
  username: string;
  fullName: string;
  avatarUrl: string | null;
}

// Cập nhật ExpertDTO để bao gồm avatar và fullName
interface EnhancedExpertDTO extends ExpertDTO {
  fullName?: string;
  avatarUrl?: string | null;
}

// Cập nhật ConversationDTO để bao gồm avatar
interface EnhancedConversationDTO extends ConversationDTO {
  otherUserAvatar?: string | null;
}

@Component({
  selector: 'app-vip-chat',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, TopNavigatorComponent, FooterComponent],
  templateUrl: './chat.component.html',
  styleUrls: ['./chat.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ChatComponent implements OnInit, OnDestroy, AfterViewChecked {
  // Đánh dấu đã scroll lần đầu để không scroll lại khi không cần thiết
  private _hasScrolledOnce = false;
  // Mobile responsive properties for template
  public isMobile = window.innerWidth <= 768;
  public sidebarVisible = window.innerWidth > 768;
  public showChatView = false;

  // Enhanced chat state management
  private messagesSubject = new BehaviorSubject<ChatMessage[]>([]);
  public messages$ = this.messagesSubject.asObservable();
  
  // Private chat state
  private conversationsSubject = new BehaviorSubject<ConversationDTO[]>([]);
  public conversations$ = this.conversationsSubject.asObservable();
  
  // UI state
  public loading = false;
  public error = '';
  public currentUserId: string | null = null;
  public selectedConversation: ConversationDTO | null = null;
  public showPrivateChat = false;
  public chatType: 'COMMUNITY' | 'PRIVATE' = 'COMMUNITY';
  public newMessage = '';
  public isTyping = false;
  public typingUsers = new Set<string>();
  
  // Expert list
  public experts: EnhancedExpertDTO[] = [];
  public searchQuery = '';
  
  // View references
  @ViewChild('messagesContainer', { static: false }) messagesContainer!: ElementRef;
  
  // Private properties
  private shouldScrollToBottom = false;
  private lastMessageCount = 0;
  private destroy$ = new Subject<void>();
  private typingTimeout?: any;
  private wsSub?: Subscription;
  private wsErrSub?: Subscription;
  private wsPrivateSub?: Subscription;
  private wsTypingSub?: Subscription;
  
  // Cache cho user profiles để tránh gọi API nhiều lần
  private userProfileCache = new Map<number, UserProfile>();
  
  // Track processed messages to avoid duplicates - REMOVED (giống expert)
  // private processedMessageKeys = new Set<string>();

  // Getters for template access
  get conversations(): ConversationDTO[] {
    return this.conversationsSubject.value;
  }

  get messages(): ChatMessage[] {
    return this.messagesSubject.value;
  }

  // Method để lấy thông tin user từ API (sử dụng endpoint từ config)
  private getUserProfile(userId: number): Promise<UserProfile> {
    // Kiểm tra cache trước
    if (this.userProfileCache.has(userId)) {
      return Promise.resolve(this.userProfileCache.get(userId)!);
    }
    
    // Sử dụng endpoint từ config thay vì hardcode
    const url = `${this.chatService.currentConfig.environment.apiBaseUrl}${this.chatService.currentConfig.endpoints.userDetail}/${userId}`;
    console.log('🔗 getUserProfile URL:', url);
    
    return this.http.get<any>(url, { withCredentials: true })
      .toPromise()
      .then(response => {
        // Handle cả trường hợp response trực tiếp và response có field data
        const profile = response?.data || response;
        if (profile && profile.id) {
          // Chỉ lấy thông tin cần thiết để tránh lộ thông tin nhạy cảm
          const userProfile: UserProfile = {
            id: profile.id,
            username: profile.username || `user${userId}`,
            fullName: profile.fullName || profile.username || `User ${userId}`,
            avatarUrl: profile.avatarUrl || null
          };
          
          // Cache thông tin user
          this.userProfileCache.set(userId, userProfile);
          return userProfile;
        }
        throw new Error('Invalid profile data');
      })
      .catch(error => {
        // Log lỗi để debug (không log thông tin nhạy cảm)
        console.warn(`Không thể lấy thông tin user ${userId}:`, error.status || 'Unknown error');
        
        // Trả về thông tin mặc định nếu có lỗi
        const defaultProfile: UserProfile = {
          id: userId,
          username: `user${userId}`,
          fullName: `User ${userId}`,
          avatarUrl: null
        };
        return defaultProfile;
      });
  }

  // Method để cập nhật experts với thông tin thực từ API
  private updateExpertsWithRealInfo(): void {
    console.log('🔄 Updating experts with real info...');
    
    // Chỉ update những expert chưa có thông tin đầy đủ
    const expertsToUpdate = this.experts.filter(expert => 
      expert.id > 0 && 
      (!expert.fullName || expert.fullName === expert.username || !expert.avatarUrl)
    );
    
    console.log(`📋 Found ${expertsToUpdate.length} experts to update`);
    
    expertsToUpdate.forEach(expert => {
      if (expert.id > 0) {
        this.getUserProfile(expert.id).then(userProfile => {
          console.log(`✅ Updated expert ${expert.id}:`, {
            oldName: expert.fullName,
            newName: userProfile.fullName,
            oldAvatar: expert.avatarUrl,
            newAvatar: userProfile.avatarUrl
          });
          
          expert.fullName = userProfile.fullName;
          expert.avatarUrl = userProfile.avatarUrl;
          this.cdr.markForCheck();
        }).catch(error => {
          console.warn(`⚠️ Failed to get profile for expert ${expert.id}:`, error);
          this.cdr.markForCheck();
        });
      }
    });
  }

  // Method để cập nhật conversations với thông tin user thực từ API
  private updateConversationsWithRealInfo(): void {
    const conversations = this.conversationsSubject.value;
    conversations.forEach(conversation => {
      if (conversation.otherUserId > 0) {
        this.getUserProfile(conversation.otherUserId).then(userProfile => {
          // Chỉ cập nhật nếu có thông tin thực từ API
          if (userProfile.fullName !== `User ${conversation.otherUserId}`) {
            conversation.otherUsername = userProfile.fullName;
            // Thêm avatar vào conversation nếu cần
            (conversation as any).otherUserAvatar = userProfile.avatarUrl;
          }
          this.cdr.markForCheck();
        }).catch(error => {
          console.warn(`Failed to get profile for conversation user ${conversation.otherUserId}:`, error);
          // Nếu API thất bại, giữ nguyên thông tin có sẵn
          this.cdr.markForCheck();
        });
      }
    });
  }

  // Method để kiểm tra duplicate experts chi tiết
  public checkDuplicateExperts(): void {
    console.log('🔍 Checking for duplicate experts...');
    console.log('📱 Mobile view - Current experts array:', this.experts);
    console.log('📱 Mobile view - Experts length:', this.experts.length);
    console.log('💬 Mobile view - Current conversations array:', this.conversations);
    console.log('💬 Mobile view - Conversations length:', this.conversations.length);
    
    const idMap = new Map<number, any[]>();
    const usernameMap = new Map<string, any[]>();
    
    this.experts.forEach(expert => {
      // Group by ID
      if (!idMap.has(expert.id)) {
        idMap.set(expert.id, []);
      }
      idMap.get(expert.id)!.push(expert);
      
      // Group by username
      if (!usernameMap.has(expert.username)) {
        usernameMap.set(expert.username, []);
      }
      usernameMap.get(expert.username)!.push(expert);
    });
    
    // Check ID duplicates
    idMap.forEach((experts, id) => {
      if (experts.length > 1) {
        console.warn(`⚠️ Duplicate ID ${id}:`, experts);
      }
    });
    
    // Check username duplicates
    usernameMap.forEach((experts, username) => {
      if (experts.length > 1) {
        console.warn(`⚠️ Duplicate username "${username}":`, experts);
      }
    });
    
    console.log('📊 Summary:', {
      totalExperts: this.experts.length,
      totalConversations: this.conversations.length,
      uniqueIDs: idMap.size,
      uniqueUsernames: usernameMap.size,
      experts: this.experts.map(e => ({ id: e.id, username: e.username, fullName: e.fullName })),
      conversations: this.conversations.map(c => ({ 
        otherUserId: c.otherUserId, 
        otherUsername: c.otherUsername 
      }))
    });
    
    // Nếu có duplicate, gợi ý force clear
    if (this.experts.length > usernameMap.size) {
      console.warn('🚨 Duplicate experts detected! Consider using forceClearAndReloadExperts()');
    }
  }

  // Method để track experts trong ngFor
  public trackExpertById(index: number, expert: any): number {
    return expert.id;
  }

  // Method để force clear và reload hoàn toàn experts
  public forceClearAndReloadExperts(): void {
    console.log('🔄 Force clearing and reloading experts...');
    
    // Clear hoàn toàn
    this.experts = [];
    this.userProfileCache.clear();
    this.loading = false;
    this.error = '';
    
    // Delay một chút để đảm bảo clear hoàn toàn
    setTimeout(() => {
      this.loadExperts();
    }, 100);
  }

  // Method để force refresh experts (clear hoàn toàn và load lại)
  public forceRefreshExperts(): void {
    console.log('🔄 Force refreshing experts...');
    
    // Clear hoàn toàn
    this.experts = [];
    this.userProfileCache.clear();
    this.loading = false;
    this.error = '';
    
    // Load lại từ đầu
    this.loadExperts();
  }

  // Debug method để kiểm tra trạng thái experts
  public debugExperts(): void {
    console.log('🔍 Current experts state:');
    console.log('📊 Total experts:', this.experts.length);
    console.log('📋 Experts details:', this.experts);
    console.log('💾 Cache size:', this.userProfileCache.size);
    console.log('🗂️ Cache keys:', Array.from(this.userProfileCache.keys()));
  }

  // Method để lấy avatar của conversation
  public getConversationAvatar(conversation: ConversationDTO): string | null {
    if (!conversation) return null;
    
    // Thử lấy avatar từ cache trước
    if (conversation.otherUserId > 0) {
      const cachedProfile = this.userProfileCache.get(conversation.otherUserId);
      if (cachedProfile && cachedProfile.avatarUrl) {
        return cachedProfile.avatarUrl;
      }
    }
    
    // Fallback về otherUserAvatar nếu có
    return (conversation as any).otherUserAvatar || null;
  }

  constructor(
    private http: HttpClient,
    private cdr: ChangeDetectorRef,
    private unifiedChat: UnifiedChatService, // Thay thế ChatStompService
    private zone: NgZone,
    private authService: AuthService,
    private urlService: UrlService,
    private chatService: ChatService,
    private toastService: ToastService,
    private jwtUserUtil: JwtUserUtilService
  ) {}

  ngOnInit(): void {
    this.initializeChat();
    this.setupSearchFilter();
    
    // Setup automatic cleanup every 30 minutes
    this.setupAutoCleanup();
  }

  private initializeChat(): void {
    // Kiểm tra quyền truy cập VIP
    const userRole = this.authService.getCurrentUserRole();
    if (userRole !== 'VIP' && userRole !== 'EXPERT') {
      this.error = 'Bạn cần có tài khoản VIP để truy cập phòng chat này.';
      this.cdr.markForCheck();
      return;
    }

    this.currentUserId = this.authService.getCurrentUserId();
    if (!this.currentUserId) {
      // No current user ID found
    }

    // Subscribe to chat API availability
    this.chatService.chatApisAvailable$.subscribe(available => {
      if (!available && this.urlService.isProduction()) {
        this.toastService.warning('Chat APIs are temporarily unavailable. Some features may not work properly.', 8000);
      }
    });

    // Load initial data
    this.loadExperts();
    this.loadConversations();
    this.fetchHistory();

    // Connect to Unified Chat Service
    this.connectToUnifiedChat();
  }

  private async connectToUnifiedChat(): Promise<void> {
    try {
      // Kiểm tra user đã đăng nhập chưa
      if (!this.currentUserId) {
        this.error = 'Không xác định được tài khoản. Vui lòng đăng nhập lại.';
        this.cdr.markForCheck();
        return;
      }

      // Lấy token từ JwtUserUtilService thay vì localStorage
      const token = this.jwtUserUtil.getAuthToken();
      if (!token) {
        this.error = 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.';
        this.cdr.markForCheck();
        return;
      }

      // Thử kết nối với Unified Chat Service
      await this.unifiedChat.connect(this.currentUserId, token);
      
      // Setup message subscriptions
      this.setupUnifiedChatSubscriptions();
      this.error = '';
      this.cdr.markForCheck();
    } catch (err) {
      const errMsg = (typeof err === 'string') ? err : (err instanceof Error ? err.message : JSON.stringify(err));
      if (errMsg && (errMsg.includes('No authentication token') || errMsg.includes('jwt expired') || errMsg.includes('401') || errMsg.toLowerCase().includes('unauthorized'))) {
        this.error = 'Phiên đăng nhập đã hết hạn hoặc không hợp lệ. Vui lòng đăng nhập lại.';
        this.cdr.markForCheck();
        return;
      }
      this.error = 'Không thể kết nối chat: ' + errMsg;
      this.cdr.markForCheck();
    }
  }

  private setupUnifiedChatSubscriptions(): void {
    // Subscribe to community messages
    this.unifiedChat.communityMessages$.subscribe((msg: ChatMessage) => {
      this.zone.run(() => {
        this.addMessageToChat(msg);
        // Only scroll if we're in community chat view
        if (!this.showPrivateChat) {
          this.scrollToBottom();
        }
        this.cdr.markForCheck();
      });
    });

    // Subscribe to private messages
    this.unifiedChat.privateMessages$.subscribe((msg: ChatMessage) => {
      this.zone.run(() => {
        this.addMessageToChat(msg);
        // Update conversation and scroll if we're in the right private chat
        if (this.showPrivateChat && 
            this.selectedConversation && 
            this.currentUserId &&
            this.isMessageInCurrentConversation(msg)) {
          this.scrollToBottom();
        }
        this.cdr.markForCheck();
      });
    });

    // Subscribe to errors
    this.unifiedChat.errors$.subscribe((error: string) => {
      this.zone.run(() => {
        if (typeof error === 'string' && (error.includes('authentication token') || error.includes('Cần đăng nhập') || error.includes('jwt expired') || error.includes('401') || error.toLowerCase().includes('unauthorized'))) {
          this.error = 'Phiên đăng nhập đã hết hạn hoặc không hợp lệ. Vui lòng đăng nhập lại.';
          this.toastService.error(this.error, 5000);
          this.cdr.markForCheck();
          return;
        }
        this.error = error;
        this.toastService.error(error, 5000);
        this.cdr.markForCheck();
      });
    });

    // Subscribe to connection status
    this.unifiedChat.connectionStatus$.subscribe((status) => {
      if (status.error) {
        this.error = `Chat connection error: ${status.error}`;
        this.cdr.markForCheck();
      } else if (status.connected) {
        this.error = '';
        this.cdr.markForCheck();
      }
    });
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

    if (this.showPrivateChat && this.selectedConversation) {
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
  // ...existing code...
      
      // Send via Unified Chat Service
      this.unifiedChat.sendPrivateMessage(message).catch(err => {
  // ...existing code...
        this.error = 'Không thể gửi tin nhắn: ' + err;
        this.toastService.error(this.error, 5000);
        this.cdr.markForCheck();
      });
    } else {
      // Community chat - không add locally, chỉ gửi và chờ nhận từ WebSocket
  // ...existing code...
      
      // Send via Unified Chat Service
      this.unifiedChat.sendCommunityMessage(message).catch(err => {
  // ...existing code...
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

  // Enhanced WebSocket subscription setup - giống logic expert
  private setupWebSocketSubscriptions(): void {
  // ...existing code...
    
    // Community messages subscription
    this.wsSub = this.unifiedChat.communityMessages$.subscribe((msg: ChatMessage) => {
  // ...existing code...
      this.zone.run(() => {
        // Add message directly (giống expert)
        this.addMessageToChat(msg);
        
        // Only scroll if we're in community chat view
        if (!this.showPrivateChat) {
          this.scrollToBottom();
        }
        this.cdr.markForCheck();
      });
    });

    // Private messages subscription
    this.wsPrivateSub = this.unifiedChat.privateMessages$.subscribe((msg: ChatMessage) => {
  // ...existing code...
      
      this.zone.run(() => {
  // ...existing code...
        // Add message directly (giống expert)
        this.addMessageToChat(msg);
        
        // Update conversation and scroll if we're in the right private chat
        if (this.showPrivateChat && 
            this.selectedConversation && 
            this.currentUserId &&
            this.isMessageInCurrentConversation(msg)) {
          this.scrollToBottom();
        }
        this.cdr.markForCheck();
      });
    });

    // Error subscription
    this.wsErrSub = this.unifiedChat.errors$.subscribe((err: string) => {
  // ...existing code...
      this.zone.run(() => {
  // ...existing code...
        this.error = err;
        this.toastService.error(err, 5000);
        this.cdr.markForCheck();
      });
    });
    
  // ...existing code...
  }

  private setupSearchFilter(): void {
    // Filter experts based on search query with debounce
    // This will be handled by the getter
  }

  // Enhanced message management - giống logic expert
  // Merge new messages (community or private) into messagesSubject
  private mergeMessages(newMessages: ChatMessage[]): void {
    if (!newMessages || newMessages.length === 0) return;
    
    const currentMessages = this.messagesSubject.value;
    const all = [...currentMessages, ...newMessages];
    
    // Remove duplicates với logic mạnh mẽ hơn
    const unique = Array.from(new Map(all.map(m => {
      // Tạo key unique từ tất cả thuộc tính quan trọng
      const key = m.messageId || 
                  `${m.timestamp}_${m.senderId}_${m.receiverId || 'null'}_${m.content?.substring(0, 100)}_${m.chatType}_${m.conversationId || 'null'}`;
      return [key, m];
    })).values());
    
    // Cleanup: keep only the X most recent messages per conversation type
    const MAX_MESSAGES_PER_TYPE = 200; // Giảm từ 500 xuống 200 để tiết kiệm RAM
    const MAX_TOTAL_MESSAGES = 1000; // Giới hạn tổng số tin nhắn
    
    let cleaned = unique;
    
    // Nếu có quá nhiều tin nhắn, ưu tiên giữ tin nhắn gần nhất
    if (cleaned.length > MAX_TOTAL_MESSAGES) {
      // Sort by timestamp (newest first)
      cleaned.sort((a, b) => {
        const timeA = new Date(a.timestamp || 0).getTime();
        const timeB = new Date(b.timestamp || 0).getTime();
        return timeB - timeA;
      });
      
      // Keep only the most recent messages
      cleaned = cleaned.slice(0, MAX_TOTAL_MESSAGES);
    }
  
    this.messagesSubject.next(cleaned);
    this.checkIfShouldScroll();
  }

  // Add a single message (community or private) - giống logic expert
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
      return;
    }
    
    // Add message locally for immediate feedback (giống expert)
    const updatedMessages = [...currentMessages, message];
    this.messagesSubject.next(updatedMessages);
    
    // Update conversation if it's a private message from other user
    if (message.chatType === 'PRIVATE' && 
        message.senderId !== +this.currentUserId! && 
        this.selectedConversation) {
      this.updateConversationWithMessage(message);
    }
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

  // Enhanced conversation update with better message handling
  private updateConversationWithMessage(message: ChatMessage): void {
    if (!message || !this.selectedConversation) return;
    const conversations = this.conversationsSubject.value;
    const conversationId = this.generateConversationId(
      message.senderId || 0, 
      message.receiverId || 0
    );
    
    const conversationIndex = conversations.findIndex(c => c.conversationId === conversationId);
    
    if (conversationIndex !== -1) {
      const updatedConversations = [...conversations];
      const currentConversation = updatedConversations[conversationIndex];
      
      // Update conversation with new message info
      updatedConversations[conversationIndex] = {
        ...currentConversation,
        lastMessage: message.content,
        lastMessageTime: message.timestamp || new Date().toISOString(),
        hasUnreadMessages: message.senderId !== +this.currentUserId! // Mark as unread if message is from other user
      };
      
      // Move conversation to top (most recent)
      const conversation = updatedConversations.splice(conversationIndex, 1)[0];
      updatedConversations.unshift(conversation);
      
      this.conversationsSubject.next(updatedConversations);
    } else {
    }
  }

  // Enhanced conversation management
  public loadConversations(): void {
    this.loading = true;
    
    this.chatService.getConversations().subscribe({
      next: (data) => {
        this.conversationsSubject.next(data);
        this.loading = false;
        
        // Cập nhật conversations với thông tin user thực từ API
        this.updateConversationsWithRealInfo();
        
        this.cdr.markForCheck();
      },
      error: (err) => {
        this.error = 'Không thể tải danh sách trò chuyện';
        this.loading = false;
        this.cdr.markForCheck();
      }
    });
  }

  // Enhanced conversation selection with better message handling
  public selectConversation(conversation: ConversationDTO): void {
    this.selectedConversation = conversation;
    this.showPrivateChat = true;
    this.chatType = 'PRIVATE';
    
    // Load private messages for this conversation
    this.loadPrivateMessages(conversation.otherUserId);
    
    // Mark messages as read after a short delay
    setTimeout(() => {
      this.markMessagesAsRead();
    }, 500);
    
    // Scroll tới cuối khi vào phòng chat
    setTimeout(() => this.scrollToBottom(), 200);
  }

  // Enhanced private message loading with better cache management
  public loadPrivateMessages(otherUserId: number): void {
    this.loading = true;
    this._hasScrolledOnce = false; // Reset scroll flag khi load lại tin nhắn
    
    // TEMP FIX: Clear messages trước khi load để tránh duplicate
    this.messagesSubject.next([]);
    
    this.chatService.getPrivateMessages(otherUserId).subscribe({
      next: (data) => {
        const privateMessages = (data || []).filter(
          (m: any) => m.chatType === 'PRIVATE'
        );   
        // Ensure all private messages have proper chatType
        const processedMessages = privateMessages.map((msg: any) => ({
          ...msg,
          chatType: 'PRIVATE' as const,
          timestamp: msg.timestamp || new Date().toISOString()
        }));
        
        // Merge messages into the main messagesSubject
        this.mergeMessages(processedMessages);
        
        this.loading = false;
        
        // Scroll tới cuối khi load tin nhắn
        setTimeout(() => this.scrollToBottom(), 200);
        this.cdr.markForCheck();
      },
      error: (err) => {
        this.error = 'Không thể tải tin nhắn';
        this.loading = false;
        this.cdr.markForCheck();
      }
    });
  }

  public startConversationWithExpert(expert: ExpertDTO): void {
    if (!this.currentUserId) {
      this.error = 'Không thể xác định người dùng';
      this.cdr.markForCheck();
      return;
    }

    const conversationId = this.generateConversationId(this.currentUserId, expert.id);
    
    // Check if conversation already exists
    const existingConversation = this.conversationsSubject.value.find(c => c.conversationId === conversationId);
    
    if (existingConversation) {
      this.selectConversation(existingConversation);
    } else {
      // Create new conversation
      const newConversation: ConversationDTO = {
        conversationId: conversationId,
        otherUserId: expert.id,
        otherUsername: (expert as EnhancedExpertDTO).fullName || expert.username,
        otherUserRole: expert.role,
        lastMessage: '',
        lastMessageTime: '',
        hasUnreadMessages: false
      };
      
      const currentConversations = this.conversationsSubject.value;
      this.conversationsSubject.next([newConversation, ...currentConversations]);
      this.selectConversation(newConversation);
    }
  }

  // Touch event handlers cho mobile
  public onTouchStart(event: TouchEvent, expert: ExpertDTO): void {
    event.preventDefault();
  }

  public onTouchEnd(event: TouchEvent, expert: ExpertDTO): void {
    event.preventDefault();
    this.startConversationWithExpert(expert);
    // Ensure mobile switches to chat view
    if (this.isMobile) {
      this.showChatView = true;
      this.showPrivateChat = true;
    }
  }

  public onTouchStartConversation(event: TouchEvent, conversation: ConversationDTO): void {
    event.preventDefault();
  }

  public onTouchEndConversation(event: TouchEvent, conversation: ConversationDTO): void {
    event.preventDefault();
    this.selectConversation(conversation);
    // Ensure mobile switches to chat view
    if (this.isMobile) {
      this.showChatView = true;
      this.showPrivateChat = true;
    }
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

  // Enhanced filtering with better message type handling
  public get filteredMessages(): ChatMessage[] {
    if (this.showPrivateChat && this.selectedConversation && this.currentUserId) {
      const otherUserId = this.selectedConversation.otherUserId;
      const currentUserId = +this.currentUserId;
      const conversationId = this.selectedConversation.conversationId;
      
      // Chỉ hiển thị private messages của conversation hiện tại
      return this.messagesSubject.value.filter(
        (m: ChatMessage) =>
          m.chatType === 'PRIVATE' &&
          m.conversationId === conversationId &&
          ((m.senderId === otherUserId && m.receiverId === currentUserId) ||
           (m.receiverId === otherUserId && m.senderId === currentUserId))
      );
    } else {
      // Chỉ hiển thị community messages (không có conversationId và receiverId)
      return this.messagesSubject.value.filter(
        (m: ChatMessage) => 
          m.chatType === 'COMMUNITY' && 
          !m.conversationId &&
          !m.receiverId
      );
    }
  }

  public get filteredExperts(): EnhancedExpertDTO[] {
    if (!this.searchQuery.trim()) {
      return this.experts;
    }
    
    const query = this.searchQuery.toLowerCase();
    return this.experts.filter(expert => 
      (expert.fullName && expert.fullName.toLowerCase().includes(query)) ||
      expert.username.toLowerCase().includes(query) ||
      expert.role.toLowerCase().includes(query)
    );
  }

  // Utility methods
  public trackMessage(index: number, message: ChatMessage): any {
    return message.timestamp || index;
  }

  public isOwnMessage(message: ChatMessage): boolean {
    if (!this.currentUserId || !message.senderId) {
      return false;
    }
    return this.currentUserId.toString().trim() === message.senderId.toString().trim();
  }

  public getAvatarUrl(message: ChatMessage): string {
    // Thử lấy avatar thực từ cache nếu có
    if (message.senderId) {
      const cachedProfile = this.userProfileCache.get(message.senderId);
      if (cachedProfile && cachedProfile.avatarUrl) {
        return cachedProfile.avatarUrl;
      }
    }
    
    // Fallback về avatar mặc định
    return 'assets/image/default-avatar.png';
  }

  public getRoleBadgeClass(role?: string): string {
    switch (role) {
      case 'VIP': return 'vip-badge';
      case 'EXPERT': return 'expert-badge';
      default: return 'user-badge';
    }
  }

  public getRoleDisplayName(role?: string): string {
    switch (role) {
      case 'VIP': return 'VIP';
      case 'EXPERT': return 'Chuyên gia';
      default: return 'Thành viên';
    }
  }

  public getSenderName(msg: ChatMessage): string {
    if (this.isOwnMessage(msg)) {
      return '';
    } else {
      if (this.selectedConversation && this.showPrivateChat) {
        return this.selectedConversation.otherUsername;
      }
      // Thử lấy tên thực từ cache nếu có
      if (msg.senderId) {
        const cachedProfile = this.userProfileCache.get(msg.senderId);
        if (cachedProfile) {
          return cachedProfile.fullName;
        }
      }
      return `User ${msg.senderId}`;
    }
  }

  // Navigation methods
  public openCommunityChat(): void {
    this.showPrivateChat = false;
    this.selectedConversation = null;
    this.chatType = 'COMMUNITY';
    this.showChatView = true;
    this.fetchHistory();
    this.cdr.markForCheck();
  }

  public goBackToList(): void {
    this.showChatView = false;
    this.selectedConversation = null;
    this.showPrivateChat = false;
    this.cdr.markForCheck();
  }

  // Enhanced conversation switching with better message management
  public switchToPrivateChat(): void {
    this.showPrivateChat = true;
    this.chatType = 'PRIVATE';
    this.selectedConversation = null;
    
    // Don't clear messagesSubject - keep all messages for better UX
    // Just load conversations and experts
    this.loadConversations();
    this.loadExperts();
  }

  public switchToCommunityChat(): void {
    this.showPrivateChat = false;
    this.chatType = 'COMMUNITY';
    this.selectedConversation = null;
    this.messagesSubject.next([]);
    
    // Load experts, conversations and fetch community history
    this.loadExperts();
    this.loadConversations();
    this.fetchHistory();
    this.shouldScrollToBottom = true;
  }

  // Enhanced history fetching with better message processing
  public fetchHistory(): void {
    this.loading = true;
    this.error = '';

    this.chatService.getChatHistory().subscribe({
      next: (data: any) => {
        const messages = Array.isArray(data) ? data : data?.data || [];
        // Chỉ lấy tin nhắn cộng đồng khi load lịch sử
        const processedMessages = messages
          .filter((msg: any) => msg.chatType === 'COMMUNITY' || !msg.chatType)
          .map((msg: any) => ({
            ...msg,
            chatType: msg.chatType || 'COMMUNITY',
            timestamp: msg.timestamp || new Date().toISOString()
          }));
        this.mergeMessages(processedMessages);
        this.loading = false;
        this.shouldScrollToBottom = true;
        this.cdr.markForCheck();
      },
      error: (err) => {
        this.error = 'Không thể tải lịch sử chat';
        this.loading = false;
        this.cdr.markForCheck();
      },
    });
  }

  public loadExperts(): void {
    this.loading = true;
    
    this.chatService.getExperts().subscribe({
      next: (data) => {
        console.log('🔍 API Response - Total experts:', data.length);
        console.log('🔍 API Response - Expert IDs:', data.map(e => e.id));
        console.log('🔍 API Response - Expert usernames:', data.map(e => e.username));
        
        // Clear cache cũ và tạo danh sách mới
        this.userProfileCache.clear();
        
        // Map data và loại bỏ duplicate theo ID VÀ username
        const uniqueExperts = data.reduce((acc: any[], expert) => {
          // Kiểm tra duplicate theo ID
          const existingById = acc.find(e => e.id === expert.id);
          if (existingById) {
            console.warn(`⚠️ Duplicate expert found with ID ${expert.id}:`, {
              existing: existingById,
              new: expert
            });
            return acc; // Bỏ qua duplicate
          }
          
          // Kiểm tra duplicate theo username (nếu ID khác nhau)
          const existingByUsername = acc.find(e => e.username === expert.username);
          if (existingByUsername) {
            console.warn(`⚠️ Duplicate expert found with username "${expert.username}":`, {
              existing: existingByUsername,
              new: expert
            });
            // Nếu có username giống nhau, ưu tiên giữ lại expert có ID nhỏ hơn (thường là expert gốc)
            if (expert.id < existingByUsername.id) {
              // Thay thế expert cũ bằng expert mới (ID nhỏ hơn)
              const index = acc.findIndex(e => e.id === existingByUsername.id);
              acc[index] = {
                ...expert,
                fullName: expert.username,
                avatarUrl: null
              };
            }
            return acc; // Không thêm expert mới
          }
          
          // Thêm expert mới
          acc.push({
            ...expert,
            fullName: expert.username, // Placeholder, will be fetched from cache or API
            avatarUrl: null // Placeholder, will be fetched from cache or API
          });
          return acc;
        }, []);
        
        console.log('✅ After deduplication - Total experts:', uniqueExperts.length);
        console.log('✅ After deduplication - Expert IDs:', uniqueExperts.map(e => e.id));
        this.experts = uniqueExperts;
        this.loading = false;
        
        // Cập nhật experts với thông tin thực từ API
        this.updateExpertsWithRealInfo();
        
        this.cdr.markForCheck();
      },
      error: (err) => {
        console.error('❌ Error loading experts:', err);
        this.error = 'Không thể tải danh sách chuyên gia';
        this.loading = false;
        this.cdr.markForCheck();
      }
    });
  }

  // Helper methods
  private generateConversationId(user1Id: string | number, user2Id: number): string {
    const minId = Math.min(+user1Id, user2Id);
    const maxId = Math.max(+user1Id, user2Id);
    return `conv_${minId}_${maxId}`;
  }

  public onEnterPress(event: KeyboardEvent): void {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      this.sendMessage();
    }
  }

  public getInputPlaceholder(): string {
    if (this.selectedConversation) {
      return `Nhập tin nhắn cho ${this.selectedConversation.otherUsername}...`;
    }
    return 'Nhập tin nhắn VIP của bạn...';
  }

  // Mobile responsive methods
  public closeSidebarOnMobile(): void {
    if (this.isMobile) {
      this.sidebarVisible = false;
      this.cdr.detectChanges();
    }
  }

  // Time formatting methods
  public formatTimePretty(timestamp?: string): string {
    if (!timestamp) return '';
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffSec = Math.floor(diffMs / 1000);
    const diffMin = Math.floor(diffSec / 60);
    const diffHour = Math.floor(diffMin / 60);
    const diffDay = Math.floor(diffHour / 24);

    if (diffSec < 10) return 'Vừa xong';
    if (diffSec < 60) return `${diffSec} giây trước`;
    if (diffMin < 60) return `${diffMin} phút trước`;
    if (diffHour < 24 && date.toDateString() === now.toDateString()) {
      return `${diffHour} giờ trước`;
    }
    
    const yesterday = new Date(now);
    yesterday.setDate(now.getDate() - 1);
    if (date.toDateString() === yesterday.toDateString()) {
      return `Hôm qua ${date.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', hour12: false })}`;
    }
    
    return `${date.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' })} ${date.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', hour12: false })}`;
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
      hour12: false,
    });

    if (isToday) {
      return timeString;
    } else if (isYesterday) {
      return `Hôm qua ${timeString}`;
    } else {
      const dateString = date.toLocaleDateString('vi-VN', {
        day: '2-digit',
        month: '2-digit',
      });
      return `${dateString} ${timeString}`;
    }
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
    if (this.messagesSubject.value.length !== this.lastMessageCount) {
      this.shouldScrollToBottom = true;
      this.lastMessageCount = this.messagesSubject.value.length;
    }
  }

  // Setup automatic cleanup for old messages
  private setupAutoCleanup(): void {
    // Cleanup old messages every 30 minutes
    setInterval(() => {
      this.cleanupOldMessages();
    }, 30 * 60 * 1000); // 30 minutes
    
    // Also cleanup when switching between chat types
    this.messages$.pipe(
      takeUntil(this.destroy$),
      debounceTime(1000) // Wait 1 second after changes
    ).subscribe(() => {
      // If we have too many messages, cleanup
      if (this.messagesSubject.value.length > 800) {
        this.cleanupOldMessages();
      }
    });

    // Memory pressure cleanup - check every 5 minutes
    setInterval(() => {
      const stats = this.getMessageStats();
      if (stats.total > 1500) {
        this.cleanupOldMessages();
      }
    }, 5 * 60 * 1000); // 5 minutes
  }

  // Enhanced cleanup with better memory management
  public cleanupOldMessages(): void {
    const currentMessages = this.messagesSubject.value;
    const MAX_AGE_HOURS = 24; // Keep messages for 24 hours
    const MAX_MESSAGES_PER_CONVERSATION = 100; // Keep max 100 messages per conversation
    const MAX_COMMUNITY_MESSAGES = 300; // Keep max 300 community messages
    
    const cutoffTime = new Date();
    cutoffTime.setHours(cutoffTime.getHours() - MAX_AGE_HOURS);
    
    // Group messages by conversation
    const messagesByConversation = new Map<string, ChatMessage[]>();
    const communityMessages: ChatMessage[] = [];
    
    currentMessages.forEach(msg => {
      if (msg.chatType === 'PRIVATE' && msg.conversationId) {
        if (!messagesByConversation.has(msg.conversationId)) {
          messagesByConversation.set(msg.conversationId, []);
        }
        messagesByConversation.get(msg.conversationId)!.push(msg);
      } else if (msg.chatType === 'COMMUNITY') {
        communityMessages.push(msg);
      }
    });
    
    // Cleanup each conversation
    const cleanedPrivateMessages: ChatMessage[] = [];
    messagesByConversation.forEach((messages, conversationId) => {
      // Sort by timestamp (newest first)
      const sortedMessages = messages.sort((a, b) => {
        const timeA = new Date(a.timestamp || 0).getTime();
        const timeB = new Date(b.timestamp || 0).getTime();
        return timeB - timeA;
      });
      
      // Keep only the most recent messages
      const keptMessages = sortedMessages.slice(0, MAX_MESSAGES_PER_CONVERSATION);
      cleanedPrivateMessages.push(...keptMessages);
    });
    
    // Cleanup community messages
    const cleanedCommunityMessages = communityMessages
      .filter(msg => {
        if (!msg.timestamp) return true;
        const messageTime = new Date(msg.timestamp);
        return messageTime > cutoffTime;
      })
      .slice(0, MAX_COMMUNITY_MESSAGES);
    
    // Combine and update
    const allCleanedMessages = [...cleanedPrivateMessages, ...cleanedCommunityMessages];
    
    if (allCleanedMessages.length < currentMessages.length) {
      this.messagesSubject.next(allCleanedMessages);
      this.cdr.markForCheck();
      
    }
  }

  // Add method to force cleanup when memory pressure is high
  public forceCleanup(): void {
    const currentMessages = this.messagesSubject.value;
    const targetCount = Math.floor(currentMessages.length * 0.7); // Keep 70% of messages
    
    if (currentMessages.length > targetCount) {
      // Sort by timestamp and keep only the most recent
      const sortedMessages = currentMessages.sort((a, b) => {
        const timeA = new Date(a.timestamp || 0).getTime();
        const timeB = new Date(b.timestamp || 0).getTime();
        return timeB - timeA;
      });
      



      const keptMessages = sortedMessages.slice(0, targetCount);
      this.messagesSubject.next(keptMessages);
      this.cdr.markForCheck();
      
    }
  }

  // Add method to get memory usage info
  public getMemoryInfo(): { messageCount: number; estimatedSize: string; recommendations: string[] } {
    const messageCount = this.messagesSubject.value.length;
    const estimatedSizeKB = Math.round(messageCount * 0.5); // Rough estimate: 0.5KB per message
    const recommendations: string[] = [];
    
    if (messageCount > 1000) {
      recommendations.push('Consider cleaning up old messages');
    }
    if (messageCount > 1500) {
      recommendations.push('High memory usage - cleanup recommended');
    }
    if (messageCount > 2000) {
      recommendations.push('Critical memory usage - force cleanup needed');
    }
    
    return {
      messageCount,
      estimatedSize: `${estimatedSizeKB} KB`,
      recommendations
    };
  }

  

  // Enhanced message read status management
  public markMessagesAsRead(): void {
    if (!this.selectedConversation || !this.currentUserId) return;
    
    const conversations = this.conversationsSubject.value;
    const conversationIndex = conversations.findIndex(c => 
      c.conversationId === this.selectedConversation!.conversationId
    );
    
    if (conversationIndex !== -1) {
      const updatedConversations = [...conversations];
      updatedConversations[conversationIndex] = {
        ...updatedConversations[conversationIndex],
        hasUnreadMessages: false
      };
      
      this.conversationsSubject.next(updatedConversations);
    }
  }

  // Add method to get unread message count
  public getUnreadMessageCount(): number {
    if (!this.currentUserId) return 0;
    
    return this.conversationsSubject.value.reduce((total, conversation) => {
      return total + (conversation.hasUnreadMessages ? 1 : 0);
    }, 0);
  }

  // Add method to get unread messages for a specific conversation
  public getUnreadMessagesForConversation(conversationId: string): ChatMessage[] {
    if (!this.currentUserId) return [];
    
    const currentUserId = +this.currentUserId;
    return this.messagesSubject.value.filter(msg => 
      msg.chatType === 'PRIVATE' &&
      msg.conversationId === conversationId &&
      msg.senderId !== currentUserId
      // Note: We don't have isRead property, so we'll use conversation.hasUnreadMessages instead
    );
  }

  // Add method to get message statistics
  public getMessageStats(): { total: number; community: number; private: number } {
    const messages = this.messagesSubject.value;
    const community = messages.filter(m => m.chatType === 'COMMUNITY').length;
    const privateCount = messages.filter(m => m.chatType === 'PRIVATE').length;
    
    return {
      total: messages.length,
      community,
      private: privateCount
    };
  }

  // Add method to search messages
  public searchMessages(query: string): ChatMessage[] {
    if (!query.trim()) return [];
    
    const searchTerm = query.toLowerCase();
    return this.messagesSubject.value.filter(msg => 
      msg.content.toLowerCase().includes(searchTerm) ||
      (msg.senderRole && msg.senderRole.toLowerCase().includes(searchTerm))
    );
  }

  // Add method to get recent conversations with unread count
  public getRecentConversationsWithUnreadCount(): Array<ConversationDTO & { unreadCount: number }> {
    return this.conversationsSubject.value.map(conversation => {
      const unreadCount = this.getUnreadMessagesForConversation(conversation.conversationId).length;
      return {
        ...conversation,
        unreadCount
      };
    });
  }

  // Add method to clear specific conversation messages
  public clearConversationMessages(conversationId: string): void {
    const currentMessages = this.messagesSubject.value;
    const filteredMessages = currentMessages.filter(msg => 
      !(msg.chatType === 'PRIVATE' && msg.conversationId === conversationId)
    );
    
    if (filteredMessages.length < currentMessages.length) {
      this.messagesSubject.next(filteredMessages);
      this.cdr.markForCheck();
    }
  }

  // Add method to export chat history
  public exportChatHistory(conversationId?: string): string {
    let messagesToExport: ChatMessage[];
    
    if (conversationId) {
      // Export specific conversation
      messagesToExport = this.messagesSubject.value.filter(msg => 
        msg.chatType === 'PRIVATE' && msg.conversationId === conversationId
      );
    } else {
      // Export all messages
      messagesToExport = this.messagesSubject.value;
    }
    
    // Sort by timestamp
    const sortedMessages = messagesToExport.sort((a, b) => {
      const timeA = new Date(a.timestamp || 0).getTime();
      const timeB = new Date(b.timestamp || 0).getTime();
      return timeA - timeB;
    });
    
    // Format for export
    const exportData = sortedMessages.map(msg => ({
      timestamp: msg.timestamp,
      sender: msg.senderId,
      role: msg.senderRole,
      content: msg.content,
      type: msg.chatType
    }));
    
    return JSON.stringify(exportData, null, 2);
  }

  // Add method to check if user has unread messages
  public hasUnreadMessages(): boolean {
    return this.conversationsSubject.value.some(conversation => conversation.hasUnreadMessages);
  }

  // Add method to mark all messages as read
  public markAllMessagesAsRead(): void {
    const conversations = this.conversationsSubject.value.map(conversation => ({
      ...conversation,
      hasUnreadMessages: false
    }));
    
    this.conversationsSubject.next(conversations);
    this.cdr.markForCheck();
  }

  // Add method to force refresh private messages
  public forceRefreshPrivateMessages(): void {
    if (!this.selectedConversation) {
      this.toastService.warning('No conversation selected', 2000);
      return;
    }
    
    this.loadPrivateMessages(this.selectedConversation.otherUserId);
    this.toastService.success('Refreshing private messages...', 2000);
  }

  // Update WebSocket test methods to use Unified Chat Service
  public testWebSocketConnection(): void {
    
    if (this.unifiedChat.isConnected()) {
      this.unifiedChat.testConnection();
      this.toastService.success('Unified Chat Service connection test successful', 3000);
    } else {
      this.connectToUnifiedChat().then(() => {
        this.toastService.success('Connected to Unified Chat Service successfully', 3000);
      }).catch(err => {
        this.toastService.error('Failed to connect: ' + err, 5000);
      });
    }
  }

  public testWebSocketUrlDetection(): void {
    this.unifiedChat.testWebSocketUrlDetection();
    this.toastService.success('WebSocket URL detection test completed', 3000);
  }

  public testCspBypass(): void {
    this.unifiedChat.testCspBypass();
    this.toastService.success('CSP bypass test completed', 3000);
  }

  public testSubscriptionStatus(): void {
    this.unifiedChat.testSubscriptionStatus();
    this.toastService.success('Subscription status test completed', 3000);
  }

  public debugSubscriptions(): void {
    console.log('=== VIP: Debug Subscriptions ===');
    this.unifiedChat.debugSubscriptions();
    this.toastService.success('Subscription debug completed', 3000);
  }

  public checkWebSocketStatus(): void {
    console.log('=== VIP: Unified Chat Service Status Check ===');
    
    const status = this.unifiedChat.getConnectionStatus();
    const stats = this.unifiedChat.getConnectionStats();
    
    console.log('Connection status:', status);
    console.log('Connection stats:', stats);
    console.log('Current user ID:', this.currentUserId);
    console.log('Selected conversation:', this.selectedConversation);
    console.log('Show private chat:', this.showPrivateChat);
  }

  public reconnectWebSocket(): void {
    console.log('Reconnecting to Unified Chat Service...');
    this.error = 'Đang kết nối lại...';
    this.cdr.markForCheck();
    
    this.unifiedChat.forceReconnect().then(() => {
      console.log('Reconnected to Unified Chat Service successfully');
      this.error = '';
      this.toastService.success('Kết nối chat đã được khôi phục', 3000);
      this.cdr.markForCheck();
    }).catch((err) => {
      console.error('Failed to reconnect to Unified Chat Service:', err);
      this.error = 'Không thể kết nối lại chat: ' + (err instanceof Error ? err.message : err);
      this.toastService.error('Không thể kết nối lại chat', 5000);
      this.cdr.markForCheck();
    });
  }

  public forceSetupSubscriptions(): void {
    
    if (this.unifiedChat.isConnected()) {
      this.setupUnifiedChatSubscriptions();
      this.toastService.success('Unified Chat subscriptions setup completed', 3000);
    } else {
      this.reconnectWebSocket();
    }
  }

  // Add method to test private chat flow - giống logic expert
  public testPrivateChatFlow(): void {
    if (!this.selectedConversation) {
      this.toastService.warning('No conversation selected', 2000);
      return;
    }
    
    // Test message structure
    const testMessage: ChatMessage = {
      senderId: +this.currentUserId!,
      content: 'Test private message',
      senderRole: this.authService.getCurrentUserRole() || 'VIP',
      timestamp: new Date().toISOString(),
      chatType: 'PRIVATE',
      conversationId: this.selectedConversation.conversationId,
      receiverId: this.selectedConversation.otherUserId
    };
  }

  // Add method to simulate incoming private message (for testing)
  public simulateIncomingPrivateMessage(content: string = 'Simulated message'): void {
    if (!this.selectedConversation) {
      this.toastService.warning('No conversation selected', 2000);
      return;
    }
    
    const simulatedMessage: ChatMessage = {
      senderId: this.selectedConversation.otherUserId,
      content: content,
      senderRole: this.selectedConversation.otherUserRole,
      timestamp: new Date().toISOString(),
      chatType: 'PRIVATE',
      conversationId: this.selectedConversation.conversationId,
      receiverId: +this.currentUserId!
    };
    
    console.log('Simulating incoming private message:', simulatedMessage);
    
    // Add message locally (simulate WebSocket reception)
    this.addMessageToChat(simulatedMessage);
    
    // Update conversation
    this.updateConversationWithMessage(simulatedMessage);
    
    this.toastService.success('Simulated message added', 2000);
  }

  // Add method to debug private message routing
  public debugPrivateMessageRouting(): void {
    if (this.selectedConversation) {
      console.log('Conversation details:', {
        conversationId: this.selectedConversation.conversationId,
        otherUserId: this.selectedConversation.otherUserId,
        otherUsername: this.selectedConversation.otherUsername
      });
    }
    
    this.toastService.success('Private message routing debug completed', 3000);
  }

  // Cleanup
  ngOnDestroy(): void {
    if (this.typingTimeout) {
      clearTimeout(this.typingTimeout);
    }
    
    // Disconnect from Unified Chat Service
    this.unifiedChat.disconnect();
    
    this.destroy$.next();
    this.destroy$.complete();
  }
}
