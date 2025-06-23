import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class DebugApiService {
  constructor(private http: HttpClient) {}

  testDeleteUser(userId: number) {
    // Gửi thử cả 2 kiểu: param và body
    return [
      this.http.post<any>('/api/admin/deleteuser', null, { params: { userId } }),
      this.http.post<any>('/api/admin/deleteuser', { userId })
    ];
  }
}
