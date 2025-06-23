import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface Account {
  id: number;
  username: string;
  fullName: string;
  email: string;
  phone: string;
  role: string;
  status: string;
}

export interface AccountListResponse {
  code: number;
  message: string;
  data: Account[];
  totalElements: number;
  totalPages: number;
  pageNo: number;
  pageSize: number;
}

@Injectable({ providedIn: 'root' })
export class AdminAccountService {
  private apiUrl = '/api/admin';

  constructor(private http: HttpClient) {}

  getAccounts(pageNo: number, pageSize: number, keyword: string = ''): Observable<AccountListResponse> {
    let params = new HttpParams()
      .set('pageNo', pageNo)
      .set('pageSize', pageSize);
    if (keyword && keyword.trim()) {
      params = params.set('keyword', keyword.trim());
    }
    return this.http.post<AccountListResponse>(
      `${this.apiUrl}/listaccount`,
      {},
      { params }
    );
  }

  changeStatus(userId: number, status: string): Observable<any> {
    return this.http.patch<any>(
      `${this.apiUrl}/changestatus/${userId}`,
      { status }
    );
  }

  deleteUser(userId: number) {
    // Gửi userId đúng kiểu param URL (Spring Boot @RequestParam)
    const params = new HttpParams().set('userId', userId.toString());
    return this.http.post<any>(`${this.apiUrl}/deleteuser`, null, { params });
  }
}
