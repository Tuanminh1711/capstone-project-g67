import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../../environments/environment';

export interface TreatmentGuide {
  id?: number;
  title: string;
  description: string;
  content: string;
  notes?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface CreateTreatmentGuideRequest {
  title: string;
  description: string;
  stepNumber: number;  // Backend cần field này
  notes?: string;
}

@Injectable({
  providedIn: 'root'
})
export class TreatmentGuideService {
  private expertApiUrl = `${environment.apiUrl}/expert/disease-management`;

  constructor(private http: HttpClient) { }

  // Tạo hướng dẫn điều trị cho bệnh cụ thể
  createTreatmentGuide(diseaseId: number, guide: CreateTreatmentGuideRequest): Observable<any> {
    return this.http.post(`${this.expertApiUrl}/diseases/${diseaseId}/treatment-guides`, guide);
  }

  // Cập nhật hướng dẫn điều trị
  updateTreatmentGuide(guideId: number, guide: CreateTreatmentGuideRequest): Observable<any> {
    return this.http.put(`${this.expertApiUrl}/treatment-guides/${guideId}`, guide);
  }

  // Xóa hướng dẫn điều trị
  deleteTreatmentGuide(guideId: number): Observable<any> {
    return this.http.delete(`${this.expertApiUrl}/treatment-guides/${guideId}`);
  }

  // Lấy hướng dẫn điều trị theo bệnh cây
  getTreatmentGuidesByDisease(diseaseId: number): Observable<any> {
    return this.http.get(`${this.expertApiUrl}/diseases/${diseaseId}/treatment-guides`);
  }

  // Legacy methods (giữ lại để tương thích)
  getTreatmentGuides(): Observable<TreatmentGuide[]> {
    // Deprecated - sử dụng getTreatmentGuidesByDisease thay thế
    return this.http.get<TreatmentGuide[]>(`${this.expertApiUrl}/treatment-guides`);
  }

  getTreatmentGuide(id: number): Observable<TreatmentGuide> {
    return this.http.get<TreatmentGuide>(`${this.expertApiUrl}/treatment-guides/${id}`);
  }
}
