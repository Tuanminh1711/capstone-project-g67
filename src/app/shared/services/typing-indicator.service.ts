import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

export interface TypingIndicator {
  conversationId: string;
  isTyping: boolean;
  userId: number;
  username?: string;
  timestamp: Date;
}

@Injectable({
  providedIn: 'root'
})
export class TypingIndicatorService {
  private typingIndicatorsSubject = new BehaviorSubject<Map<string, TypingIndicator[]>>(new Map());
  public typingIndicators$ = this.typingIndicatorsSubject.asObservable();

  /**
   * Add typing indicator for a conversation
   */
  addTypingIndicator(conversationId: string, userId: number, username?: string): void {
    const currentIndicators = this.typingIndicatorsSubject.value;
    const conversationIndicators = currentIndicators.get(conversationId) || [];
    
    // Remove existing typing indicator for this user
    const filteredIndicators = conversationIndicators.filter(indicator => indicator.userId !== userId);
    
    // Add new typing indicator
    const newIndicator: TypingIndicator = {
      conversationId,
      isTyping: true,
      userId,
      username,
      timestamp: new Date()
    };
    
    const updatedIndicators = new Map(currentIndicators);
    updatedIndicators.set(conversationId, [...filteredIndicators, newIndicator]);
    
    this.typingIndicatorsSubject.next(updatedIndicators);
  }

  /**
   * Remove typing indicator for a conversation
   */
  removeTypingIndicator(conversationId: string, userId: number): void {
    const currentIndicators = this.typingIndicatorsSubject.value;
    const conversationIndicators = currentIndicators.get(conversationId) || [];
    
    const filteredIndicators = conversationIndicators.filter(indicator => indicator.userId !== userId);
    
    const updatedIndicators = new Map(currentIndicators);
    if (filteredIndicators.length > 0) {
      updatedIndicators.set(conversationId, filteredIndicators);
    } else {
      updatedIndicators.delete(conversationId);
    }
    
    this.typingIndicatorsSubject.next(updatedIndicators);
  }

  /**
   * Get typing indicators for a specific conversation
   */
  getTypingIndicators(conversationId: string): Observable<TypingIndicator[]> {
    return new Observable(observer => {
      this.typingIndicators$.subscribe(indicatorsMap => {
        const conversationIndicators = indicatorsMap.get(conversationId) || [];
        observer.next(conversationIndicators);
      });
    });
  }

  /**
   * Check if anyone is typing in a conversation
   */
  isAnyoneTyping(conversationId: string): Observable<boolean> {
    return new Observable(observer => {
      this.typingIndicators$.subscribe(indicatorsMap => {
        const conversationIndicators = indicatorsMap.get(conversationId) || [];
        const isTyping = conversationIndicators.some(indicator => indicator.isTyping);
        observer.next(isTyping);
      });
    });
  }

  /**
   * Get typing users for a conversation
   */
  getTypingUsers(conversationId: string): Observable<string[]> {
    return new Observable(observer => {
      this.typingIndicators$.subscribe(indicatorsMap => {
        const conversationIndicators = indicatorsMap.get(conversationId) || [];
        const typingUsers = conversationIndicators
          .filter(indicator => indicator.isTyping)
          .map(indicator => indicator.username || `User ${indicator.userId}`);
        observer.next(typingUsers);
      });
    });
  }

  /**
   * Clear all typing indicators for a conversation
   */
  clearConversationTyping(conversationId: string): void {
    const currentIndicators = this.typingIndicatorsSubject.value;
    const updatedIndicators = new Map(currentIndicators);
    updatedIndicators.delete(conversationId);
    
    this.typingIndicatorsSubject.next(updatedIndicators);
  }

  /**
   * Clear all typing indicators
   */
  clearAllTyping(): void {
    this.typingIndicatorsSubject.next(new Map());
  }

  /**
   * Auto-remove typing indicators after a delay
   */
  autoRemoveTypingIndicator(conversationId: string, userId: number, delayMs: number = 3000): void {
    setTimeout(() => {
      this.removeTypingIndicator(conversationId, userId);
    }, delayMs);
  }
}
