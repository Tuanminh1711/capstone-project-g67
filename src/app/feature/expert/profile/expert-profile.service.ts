import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject } from 'rxjs';
import { tap } from 'rxjs/operators';
import { ConfigService } from '../../../shared/services/config.service';
import { JwtUserUtilService } from '../../../auth/jwt-user-util.service';

export interface ExpertProfile {
  id: number;
  username: string;
  email: string;
  fullName: string;
  phoneNumber: string;
  avatar: string | null;
  gender: string | null;
  bio: string | null;
  expertise: string | null;
}

export interface UpdateExpertProfileRequest {
  id: number;
  fullName: string;
  phoneNumber: string;
  bio: string;
  expertise: string;
  avatar: string;
  gender: string;
}

@Injectable({
  providedIn: 'root'
})
export class ExpertProfileService {
  private profileCache = new BehaviorSubject<ExpertProfile | null>(null);

  constructor(
    private http: HttpClient,
    private configService: ConfigService,
    private jwtUserUtil: JwtUserUtilService
  ) {}

  getExpertProfile(): Observable<ExpertProfile> {
    // Gọi đúng API backend: /api/user/profile (không truyền userId)
    const url = this.configService.getFullUrl('/api/user/profile');
    return this.http.get<ExpertProfile>(url, { withCredentials: true }).pipe(
      tap(profile => this.profileCache.next(profile))
    );
  }

  updateExpertProfile(updateData: UpdateExpertProfileRequest): Observable<any> {
    const url = this.configService.getFullUrl('/api/user/updateprofile');
    return this.http.put<any>(url, updateData, {
      withCredentials: true,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  updateExpertAvatar(formData: FormData): Observable<any> {
    // Dùng đúng API backend: /api/user/update-avatar
    const url = this.configService.getFullUrl('/api/user/update-avatar');
    return this.http.put<any>(url, formData, { withCredentials: true });
  }
}
