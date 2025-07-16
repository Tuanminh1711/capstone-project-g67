import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class SupportService {
  constructor(private http: HttpClient) {}

  // Upload image (demo: return base64 as url, replace with real API if needed)
  uploadImage(file: File): Observable<{ url: string }> {
    // TODO: Replace with real upload API if available
    return of({ url: '' }); // No upload, just return empty string
  }

  // Create support ticket
  createTicket(data: { title: string; description: string; imageUrl?: string }): Observable<any> {
    return this.http.post('http://localhost:8080/api/support/tickets', data);
  }

  // Get list of tickets (for dropdown)
  getMyTickets(): Observable<any[]> {
    return this.http.get<any[]>('http://localhost:8080/api/support/tickets/my');
  }
}
