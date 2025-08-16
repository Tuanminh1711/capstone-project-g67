import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { ConfigService } from '../../../shared/config.service';

export interface Account {
  id: number;
  username: string;
  fullName: string;
  email: string;
  phone: string;
  role: string;
  status: string | null; // Allow null status from API
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

  constructor(
    private http: HttpClient,
    private configService: ConfigService
  ) {}

  searchAccounts(keyword: string): Observable<Account[]> {
    // Chuẩn bị body đúng chuẩn SearchAccountRequestDTO
    const body = {
      keyword: keyword.trim(),
      pageNo: 0,
      pageSize: 10000
    };
    return this.http.post<any>(
      `${this.apiUrl}/search-account`,
      body
    ).pipe(
      // Đảm bảo trả về mảng user
      map((res: any) => res.data || [])
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

  resetPassword(userId: number) {
    return this.http.put<any>(`${this.configService.apiUrl}/admin/reset-password/${userId}`, {});
  }
}
