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

    return this.http.get<ApiResponse<PaginatedResponse<UserPlant>>>(`${this.baseUrl}/user-plants/get-all-user-plants`, { params });
  }

  removePlantFromCollection(plantId: number): Observable<ApiResponse> {
    console.log('Service DELETE call for plantId:', plantId);
    // Sử dụng method DELETE như chuẩn REST API
    const endpoint = `${this.baseUrl}/user-plants/delete/${plantId}`;
    console.log('DELETE URL:', endpoint);
    return this.http.delete<ApiResponse>(endpoint);
  }

  updateUserPlant(updateData: UpdatePlantRequest): Observable<ApiResponse> {
    console.log('Service PUT call for updating plant:', updateData);
    const endpoint = `${this.baseUrl}/user-plants/update`;
    console.log('PUT URL:', endpoint);
    return this.http.put<ApiResponse>(endpoint, updateData);
  }
}
