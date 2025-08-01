
import { environment } from '../../../../environments/environment';
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class SupportService {
  constructor(private http: HttpClient) {}

  // Add response to a ticket
  addTicketResponse(ticketId: number, content: string): Observable<any> {
    return this.http.post(`${environment.apiUrl}/support/tickets/${ticketId}/responses`, { content });
  }

  // Upload image - convert to base64 since no upload endpoint
  uploadImage(file: File): Observable<{ url: string }> {
    return new Observable(observer => {
      const reader = new FileReader();
      reader.onload = () => {
        observer.next({ url: reader.result as string });
        observer.complete();
      };
      reader.onerror = () => {
        observer.error('Failed to read file');
      };
      reader.readAsDataURL(file);
    });
  }

  // Create support ticket
  createTicket(data: { title: string; description: string; imageUrl?: string }): Observable<any> {
    const token = localStorage.getItem('token');
    return this.http.post<any>(`${environment.apiUrl}/support/tickets`, data, {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      }
    });
  }

  // Get list of tickets (for dropdown)
  getMyTickets(): Observable<any[]> {
    // Nếu backend không hỗ trợ /my, dùng endpoint chung và filter phía client hoặc truyền userId nếu cần
    return this.http.get<any[]>(`${environment.apiUrl}/support/tickets`);
  }
}
