import { environment } from '../../../../environments/environment';
import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface UserPlant {
  userPlantId: number;
  plantId: number;
  imageUrl: string | null;
  nickname: string;
  plantLocation: string;
  reminderEnabled: boolean;
}

export interface Pageable {
  pageNumber: number;
  pageSize: number;
  sort: {
    empty: boolean;
    sorted: boolean;
    unsorted: boolean;
  };
  offset: number;
  paged: boolean;
  unpaged: boolean;
}

export interface PaginatedResponse<T> {
  content: T[];
  pageable: Pageable;
  last: boolean;
  totalPages: number;
  totalElements: number;
  size: number;
  number: number;
  sort: {
    empty: boolean;
    sorted: boolean;
    unsorted: boolean;
  };
  first: boolean;
  numberOfElements: number;
  empty: boolean;
}

export interface ApiResponse<T = any> {
  status: number;
  message: string;
  data: T;
}

export interface UpdatePlantRequest {
  userPlantId: string;
  nickname: string;
  plantingDate: string;
  locationInHouse: string;
  reminderEnabled: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class MyGardenService {
  private readonly baseUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  getUserPlants(page: number = 0, size: number = 10): Observable<ApiResponse<PaginatedResponse<UserPlant>>> {
    // Add timestamp to bypass cache
    const timestamp = new Date().getTime();
    const params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString())
      .set('_t', timestamp.toString()); // Cache buster

    // Thêm header Cache-Control để luôn lấy dữ liệu mới nhất
    const headers = { 'Cache-Control': 'no-cache' };
    return this.http.get<ApiResponse<PaginatedResponse<UserPlant>>>(
      `${this.baseUrl}/user-plants/get-all-user-plants`,
      { params, headers }
    );
  }

  removePlantFromCollection(plantId: number): Observable<ApiResponse> {
    // Sử dụng method DELETE như chuẩn REST API, luôn dùng apiUrl để đảm bảo đúng route
    const endpoint = `${environment.apiUrl}/user-plants/delete/${plantId}`;
    return this.http.delete<ApiResponse>(endpoint);
  }

  updateUserPlant(updateData: UpdatePlantRequest): Observable<ApiResponse> {
    console.log('Service PUT call for updating plant:', updateData);
    const endpoint = `${this.baseUrl}/user-plants/update`;
    console.log('PUT URL:', endpoint);
    return this.http.put<ApiResponse>(endpoint, updateData);
  }

  // Method để upload ảnh plant
  uploadPlantImage(file: File): Observable<any> {
    console.log('Service POST call for uploading plant image:', file.name);
    const formData = new FormData();
    formData.append('image', file, file.name);
    
    const endpoint = `${this.baseUrl}/user-plants/upload-plant-image`;
    console.log('POST URL for image upload:', endpoint);
    return this.http.post<any>(endpoint, formData);
  }
}
