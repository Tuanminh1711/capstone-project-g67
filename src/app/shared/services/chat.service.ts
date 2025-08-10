import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of, throwError, BehaviorSubject, timer } from 'rxjs';
import { catchError, map, tap, retryWhen, delay, take } from 'rxjs/operators';
import { ChatMessage } from '../../vip/chat/chat-stomp.service';
import { ConversationDTO } from '../../vip/chat/conversation.interface';
import { UrlService } from '../url.service';
import { 
  getCurrentChatConfig, 
  CHAT_ERROR_MESSAGES, 
  CHAT_PERFORMANCE 
} from './chat-environment.config';

export interface ExpertDTO {
  id: number;
  username: string;
  role: string;
}

@Injectable({
  providedIn: 'root',
})
export class ChatService {
  private chatApisAvailable = new BehaviorSubject<boolean>(true);
  private hasCheckedApis = false;
  private config = getCurrentChatConfig();

  constructor(private http: HttpClient, private urlService: UrlService) {
    // Check API availability on service initialization
    this.checkChatApisAvailable().subscribe();
  }

  /**
   * Observable to check if chat APIs are available
   */
  get chatApisAvailable$(): Observable<boolean> {
    return this.chatApisAvailable.asObservable();
  }

  /**
   * Check if chat APIs are currently available
   */
  get isChatApisAvailable(): boolean {
    return this.chatApisAvailable.value;
  }

  /**
   * Get current chat configuration
   */
  get currentConfig() {
    return this.config;
  }

  // ✅ Lấy lịch sử group chat
  getChatHistory(): Observable<ChatMessage[]> {
    const url = this.urlService.getApiUrl(this.config.endpoints.history);
    return this.http.get<ChatMessage[]>(url).pipe(
      retryWhen(errors => 
        errors.pipe(
          delay(this.config.fallback.retryDelay),
          take(this.config.fallback.retryAttempts)
        )
      ),
      catchError(error => {
        console.warn('Chat history API not available, using fallback:', error);
        this.updateApiAvailability(false);
        // Return empty array as fallback
        return of([]);
      }),
      tap(() => this.updateApiAvailability(true))
    );
  }

  // ✅ Lấy private messages
  getPrivateMessages(receiverId: number): Observable<ChatMessage[]> {
    const url = this.urlService.getApiUrl(`${this.config.endpoints.privateMessages}/${receiverId}`);
    return this.http.get<ChatMessage[]>(url).pipe(
      retryWhen(errors => 
        errors.pipe(
          delay(this.config.fallback.retryDelay),
          take(this.config.fallback.retryAttempts)
        )
      ),
      catchError(error => {
        console.warn('Private messages API not available, using fallback:', error);
        this.updateApiAvailability(false);
        // Return empty array as fallback
        return of([]);
      }),
      tap(() => this.updateApiAvailability(true))
    );
  }

  // ✅ Lấy danh sách conversations
  getConversations(): Observable<ConversationDTO[]> {
    const url = this.urlService.getApiUrl(this.config.endpoints.conversations);
    return this.http.get<ConversationDTO[]>(url).pipe(
      retryWhen(errors => 
        errors.pipe(
          delay(this.config.fallback.retryDelay),
          take(this.config.fallback.retryAttempts)
        )
      ),
      catchError(error => {
        console.warn('Conversations API not available, using fallback:', error);
        this.updateApiAvailability(false);
        // Return empty array as fallback for production
        if (this.urlService.isProduction()) {
          return of([]);
        }
        // For development, throw the error to help with debugging
        return throwError(() => error);
      }),
      tap(() => this.updateApiAvailability(true))
    );
  }

  // ✅ Lấy danh sách experts
  getExperts(): Observable<ExpertDTO[]> {
    const url = this.urlService.getApiUrl(this.config.endpoints.experts);
    return this.http.get<ExpertDTO[]>(url).pipe(
      retryWhen(errors => 
        errors.pipe(
          delay(this.config.fallback.retryDelay),
          take(this.config.fallback.retryAttempts)
        )
      ),
      catchError(error => {
        console.warn('Experts API not available, using fallback:', error);
        this.updateApiAvailability(false);
        // Return mock experts data as fallback for production
        if (this.urlService.isProduction()) {
          return of(this.getMockExperts());
        }
        // For development, throw the error to help with debugging
        return throwError(() => error);
      }),
      tap(() => this.updateApiAvailability(true))
    );
  }

  // ✅ Mark messages as read
  markMessagesAsRead(): Observable<string> {
    const url = this.urlService.getApiUrl(this.config.endpoints.markRead);
    return this.http.post<string>(url, {}).pipe(
      retryWhen(errors => 
        errors.pipe(
          delay(this.config.fallback.retryDelay),
          take(this.config.fallback.retryAttempts)
        )
      ),
      catchError(error => {
        console.warn('Mark read API not available, using fallback:', error);
        this.updateApiAvailability(false);
        // Return success message as fallback
        return of('Messages marked as read');
      }),
      tap(() => this.updateApiAvailability(true))
    );
  }

  /**
   * Get mock experts data for fallback when API is not available
   */
  private getMockExperts(): ExpertDTO[] {
    if (!this.config.fallback.enableMockData) {
      return [];
    }

    const mockExperts: ExpertDTO[] = [
      {
        id: 1,
        username: 'PlantExpert01',
        role: 'EXPERT'
      },
      {
        id: 2,
        username: 'GardenMaster',
        role: 'EXPERT'
      },
      {
        id: 3,
        username: 'BotanyPro',
        role: 'EXPERT'
      },
      {
        id: 4,
        username: 'FloraExpert',
        role: 'EXPERT'
      },
      {
        id: 5,
        username: 'GreenThumb',
        role: 'EXPERT'
      }
    ];

    // Return only the configured number of mock experts
    return mockExperts.slice(0, this.config.fallback.mockExpertsCount);
  }

  /**
   * Check if chat APIs are available
   */
  checkChatApisAvailable(): Observable<boolean> {
    if (this.hasCheckedApis) {
      return of(this.chatApisAvailable.value);
    }

    const testUrl = this.urlService.getApiUrl(this.config.endpoints.conversations);
    return this.http.get(testUrl).pipe(
      map(() => {
        this.hasCheckedApis = true;
        this.updateApiAvailability(true);
        return true;
      }),
      catchError(() => {
        this.hasCheckedApis = true;
        this.updateApiAvailability(false);
        return of(false);
      })
    );
  }

  /**
   * Update API availability status
   */
  private updateApiAvailability(available: boolean): void {
    if (this.chatApisAvailable.value !== available) {
      this.chatApisAvailable.next(available);
      console.log(`Chat APIs ${available ? 'are now available' : 'are not available'}`);
    }
  }

  /**
   * Get user-friendly message about chat availability
   */
  getChatAvailabilityMessage(): string {
    if (this.isChatApisAvailable) {
      return CHAT_ERROR_MESSAGES.VIETNAMESE.API_UNAVAILABLE;
    } else {
      return CHAT_ERROR_MESSAGES.VIETNAMESE.API_UNAVAILABLE;
    }
  }

  /**
   * Get error message based on error type
   */
  getErrorMessage(error: any): string {
    if (error.status === 401) {
      return CHAT_ERROR_MESSAGES.VIETNAMESE.UNAUTHORIZED;
    } else if (error.status === 0 || error.status === 500) {
      return CHAT_ERROR_MESSAGES.VIETNAMESE.API_UNAVAILABLE;
    } else {
      return CHAT_ERROR_MESSAGES.VIETNAMESE.NETWORK_ERROR;
    }
  }

  /**
   * Force refresh API availability check
   */
  refreshApiAvailability(): Observable<boolean> {
    this.hasCheckedApis = false;
    return this.checkChatApisAvailable();
  }
}
