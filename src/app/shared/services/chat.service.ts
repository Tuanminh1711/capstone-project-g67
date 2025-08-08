import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ChatMessage } from '../../vip/chat/chat-stomp.service';
import { ConversationDTO } from '../../vip/chat/conversation.interface';
import { UrlService } from '../url.service';

export interface ExpertDTO {
  id: number;
  username: string;
  role: string;
}

@Injectable({
  providedIn: 'root',
})
export class ChatService {
  constructor(private http: HttpClient, private urlService: UrlService) {}

  // ✅ Lấy lịch sử group chat
  getChatHistory(): Observable<ChatMessage[]> {
    const url = this.urlService.getApiUrl('api/chat/history');
    return this.http.get<ChatMessage[]>(url);
  }

  // ✅ Lấy private messages
  getPrivateMessages(receiverId: number): Observable<ChatMessage[]> {
    const url = this.urlService.getApiUrl(`api/chat/private/${receiverId}`);
    return this.http.get<ChatMessage[]>(url);
  }

  // ✅ Lấy danh sách conversations
  getConversations(): Observable<ConversationDTO[]> {
    const url = this.urlService.getApiUrl('api/chat/conversations');
    return this.http.get<ConversationDTO[]>(url);
  }

  // ✅ Lấy danh sách experts
  getExperts(): Observable<ExpertDTO[]> {
    const url = this.urlService.getApiUrl('api/chat/experts');
    return this.http.get<ExpertDTO[]>(url);
  }

  // ✅ Mark messages as read
  markMessagesAsRead(): Observable<string> {
    const url = this.urlService.getApiUrl('api/chat/mark-read');
    return this.http.post<string>(url, {});
  }

}
