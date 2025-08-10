import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, combineLatest } from 'rxjs';
import { map, distinctUntilChanged } from 'rxjs/operators';
import { ChatService } from './chat.service';
import { getCurrentChatConfig, CHAT_FEATURES } from './chat-environment.config';

export interface ChatState {
  // API Status
  apisAvailable: boolean;
  lastCheckTime: Date | null;
  
  // Feature Status
  communityChatEnabled: boolean;
  privateChatEnabled: boolean;
  expertListEnabled: boolean;
  
  // Connection Status
  websocketConnected: boolean;
  lastMessageTime: Date | null;
  
  // User Status
  currentUserId: string | null;
  currentUserRole: string | null;
  
  // Error Status
  hasErrors: boolean;
  lastErrorMessage: string | null;
}

@Injectable({
  providedIn: 'root'
})
export class ChatStateService {
  private readonly initialState: ChatState = {
    apisAvailable: true,
    lastCheckTime: null,
    communityChatEnabled: CHAT_FEATURES.COMMUNITY_CHAT,
    privateChatEnabled: CHAT_FEATURES.PRIVATE_CHAT,
    expertListEnabled: CHAT_FEATURES.EXPERT_LIST,
    websocketConnected: false,
    lastMessageTime: null,
    currentUserId: null,
    currentUserRole: null,
    hasErrors: false,
    lastErrorMessage: null
  };

  private state = new BehaviorSubject<ChatState>(this.initialState);
  private config = getCurrentChatConfig();

  constructor(private chatService: ChatService) {
    this.initializeState();
  }

  /**
   * Get current chat state
   */
  get currentState(): ChatState {
    return this.state.value;
  }

  /**
   * Get chat state as observable
   */
  get state$(): Observable<ChatState> {
    return this.state.asObservable();
  }

  /**
   * Get specific state properties as observables
   */
  get apisAvailable$(): Observable<boolean> {
    return this.state$.pipe(
      map(state => state.apisAvailable),
      distinctUntilChanged()
    );
  }

  get websocketConnected$(): Observable<boolean> {
    return this.state$.pipe(
      map(state => state.websocketConnected),
      distinctUntilChanged()
    );
  }

  get hasErrors$(): Observable<boolean> {
    return this.state$.pipe(
      map(state => state.hasErrors),
      distinctUntilChanged()
    );
  }

  get currentUser$(): Observable<{ userId: string | null; role: string | null }> {
    return this.state$.pipe(
      map(state => ({
        userId: state.currentUserId,
        role: state.currentUserRole
      })),
      distinctUntilChanged()
    );
  }

  /**
   * Initialize chat state
   */
  private initializeState(): void {
    // Subscribe to chat service API availability
    this.chatService.chatApisAvailable$.subscribe(available => {
      this.updateState({
        apisAvailable: available,
        lastCheckTime: new Date(),
        hasErrors: !available,
        lastErrorMessage: available ? null : 'Chat APIs are not available'
      });
    });
  }

  /**
   * Update chat state
   */
  updateState(updates: Partial<ChatState>): void {
    const currentState = this.state.value;
    const newState = { ...currentState, ...updates };
    
    // Update last check time if APIs availability changed
    if (updates.apisAvailable !== undefined) {
      newState.lastCheckTime = new Date();
    }
    
    this.state.next(newState);
  }

  /**
   * Set user information
   */
  setUser(userId: string | null, role: string | null): void {
    this.updateState({
      currentUserId: userId,
      currentUserRole: role
    });
  }

  /**
   * Set WebSocket connection status
   */
  setWebSocketStatus(connected: boolean): void {
    this.updateState({
      websocketConnected: connected
    });
  }

  /**
   * Set last message time
   */
  setLastMessageTime(): void {
    this.updateState({
      lastMessageTime: new Date()
    });
  }

  /**
   * Set error state
   */
  setError(message: string): void {
    this.updateState({
      hasErrors: true,
      lastErrorMessage: message
    });
  }

  /**
   * Clear error state
   */
  clearError(): void {
    this.updateState({
      hasErrors: false,
      lastErrorMessage: null
    });
  }

  /**
   * Check if specific feature is enabled
   */
  isFeatureEnabled(feature: keyof typeof CHAT_FEATURES): boolean {
    return CHAT_FEATURES[feature] && this.currentState.apisAvailable;
  }

  /**
   * Get feature status as observable
   */
  getFeatureStatus(feature: keyof typeof CHAT_FEATURES): Observable<boolean> {
    return combineLatest([
      this.apisAvailable$,
      this.state$.pipe(map(state => CHAT_FEATURES[feature]))
    ]).pipe(
      map(([apisAvailable, featureEnabled]) => apisAvailable && featureEnabled)
    );
  }

  /**
   * Reset chat state to initial
   */
  resetState(): void {
    this.state.next(this.initialState);
  }

  /**
   * Get environment-specific configuration
   */
  getEnvironmentConfig() {
    return this.config;
  }

  /**
   * Check if current environment is production
   */
  isProduction(): boolean {
    return this.config.environment.isProduction;
  }

  /**
   * Check if current environment is development
   */
  isDevelopment(): boolean {
    return this.config.environment.isDevelopment;
  }

  /**
   * Get current API base URL
   */
  getApiBaseUrl(): string {
    return this.config.environment.apiBaseUrl;
  }
}
