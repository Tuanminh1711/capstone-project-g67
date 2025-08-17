import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class AdminCreateAccountService {
  private apiUrl = '/api/admin';

  constructor(private http: HttpClient) {}

  addUser(data: any): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/adduser`, data);
  }
}
