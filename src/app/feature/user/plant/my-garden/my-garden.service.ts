import { environment } from '../../../../../environments/environment';
import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, throwError, from } from 'rxjs';
import { catchError, switchMap } from 'rxjs/operators';

export interface UserPlant {
  userPlantId: number;
  plantId: number;
  imageUrl: string | null;
  nickname: string;
  plantLocation: string;
  reminderEnabled: boolean;
  plantingDate?: string; // Thêm field cho planting date
  imageUrls?: string[]; // Thêm field cho multiple images
  images?: any[]; // Thêm field cho image objects
  userId?: number; // Thêm field optional
  createdAt?: string; // Thêm field optional
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
  plantingDate: string; // SQL timestamp format: YYYY-MM-DD HH:mm:ss.SSS
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
    const endpoint = `${this.baseUrl}/user-plants/update`;
    return this.http.put<ApiResponse>(endpoint, updateData);
  }

  updateUserPlantWithImages(updateData: UpdatePlantRequest, images: File[]): Observable<ApiResponse> {
    const formData = new FormData();
    
    // Append data as expected by @ModelAttribute UpdateUserPlantRequestDTO
    formData.append('userPlantId', updateData.userPlantId);
    formData.append('nickname', updateData.nickname);
    formData.append('locationInHouse', updateData.locationInHouse);
    formData.append('plantingDate', updateData.plantingDate); // Already a string in ISO format
    formData.append('reminderEnabled', updateData.reminderEnabled.toString());
    
    // Add images as expected by @RequestParam("images") List<MultipartFile>
    images.forEach((image, index) => {
      formData.append('images', image, image.name);
    });
    
    // Use the update-with-images endpoint as designed by backend
    const endpoint = `${this.baseUrl}/user-plants/update-with-images`;
    
    return this.http.put<ApiResponse>(endpoint, formData).pipe(
      catchError(error => {
        // If the main endpoint fails, try fallback without images
        return this.updateUserPlant(updateData);
      })
    );
  }

  // Method để upload ảnh plant
  uploadPlantImage(file: File): Observable<any> {
    const formData = new FormData();
    formData.append('image', file, file.name);
    
    const endpoint = `${this.baseUrl}/user-plants/upload-plant-image`;
    return this.http.post<any>(endpoint, formData);
  }
}
