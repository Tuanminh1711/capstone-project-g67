import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface UserProfile {
  id: number;
  username: string;
  email: string;
  fullName: string;
  phoneNumber: string;
  avatar: string | null;
  gender: string | null;
  livingEnvironment: string | null;
}

@Injectable({
  providedIn: 'root'
})
export class UserProfileService {
  private apiUrl = 'http://localhost:8080/api/user/profile';

  constructor(private http: HttpClient) {}

  getUserProfile(userId: number): Observable<UserProfile> {
    return this.http.get<UserProfile>(`${this.apiUrl}/${userId}`);
  }
}
