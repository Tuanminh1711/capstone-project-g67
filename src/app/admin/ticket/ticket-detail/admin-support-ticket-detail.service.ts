import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

export interface AdminSupportTicketDetail {
  ticketId: number;
  title: string;
  description: string;
  imageUrl: string;
  status: string;
  createdAt: string;
  userName: string;
  responses: any[];
  claimedByUserName: string | null;
  claimedAt: string | null;
  handledByUserName: string | null;
  handledAt: string | null;
  logs: any[];
}

@Injectable({ providedIn: 'root' })
export class AdminSupportTicketDetailService {
  private apiUrl = '/api/admin/support/tickets';

  constructor(private http: HttpClient) {}

  getTicketDetail(ticketId: number): Observable<AdminSupportTicketDetail> {
    return this.http.get<any>(`${this.apiUrl}/${ticketId}`).pipe(
      map(res => res.data as AdminSupportTicketDetail)
    );
  }
}
