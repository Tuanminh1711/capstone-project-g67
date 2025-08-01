import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

export interface AdminSupportTicket {
  ticketId: number;
  title: string;
  description: string;
  status: string;
  createdAt: string;
  userName: string;
  responseCount: number;
}

export interface AdminSupportTicketsResponse {
  content: AdminSupportTicket[];
  pageable: any;
  last: boolean;
  totalPages: number;
  totalElements: number;
  size: number;
  number: number;
  sort: any;
  first: boolean;
  numberOfElements: number;
  empty: boolean;
}

@Injectable({ providedIn: 'root' })
export class AdminSupportTicketsService {
  claimTicket(ticketId: number, note: string) {
    return this.http.post(`/api/admin/support/tickets/${ticketId}/claim`, { note });
  }

  handleTicket(ticketId: number, note: string) {
    console.log('[HANDLE DEBUG] Calling API with:', { ticketId, note });
    // Try claim endpoint first, might be the correct one
    return this.http.post(`/api/admin/support/tickets/${ticketId}/claim`, { note });
  }

  releaseTicket(ticketId: number) {
    return this.http.post(`/api/admin/support/tickets/${ticketId}/release`, {});
  }

  changeStatus(ticketId: number, status: string) {
    return this.http.put(`/api/admin/support/tickets/${ticketId}/status`, { status });
  }

  responseTicket(ticketId: number, content: string) {
    return this.http.post(`/api/admin/support/tickets/${ticketId}/responses`, { content });
  }

  private apiUrl = '/api/admin/support/tickets';

  constructor(private http: HttpClient) {}

  getTickets(page = 0, size = 10): Observable<AdminSupportTicketsResponse> {
    const params = new HttpParams().set('page', page).set('size', size);
    return this.http.get<any>(this.apiUrl, { params }).pipe(
      map(res => res.data as AdminSupportTicketsResponse)
    );
  }
}
