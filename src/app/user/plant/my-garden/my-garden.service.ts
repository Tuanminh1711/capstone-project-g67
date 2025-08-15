import { environment } from '../../../../environments/environment';
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
    console.log('Service PUT call for updating plant:', updateData);
    const endpoint = `${this.baseUrl}/user-plants/update`;
    console.log('PUT URL:', endpoint);
    return this.http.put<ApiResponse>(endpoint, updateData);
  }

  updateUserPlantWithImages(updateData: UpdatePlantRequest, images: File[]): Observable<ApiResponse> {
    console.log('Service PUT call for updating plant with images:', updateData, 'Images count:', images.length);
    
    const formData = new FormData();
    
    // Append data as expected by @ModelAttribute UpdateUserPlantRequestDTO
    formData.append('userPlantId', updateData.userPlantId);
    formData.append('nickname', updateData.nickname);
    formData.append('locationInHouse', updateData.locationInHouse);
    formData.append('plantingDate', updateData.plantingDate); // Already a string in ISO format
    formData.append('reminderEnabled', updateData.reminderEnabled.toString());
    
    // Debug the exact date string being sent
    console.log('🗓️ PlantingDate being sent:', JSON.stringify(updateData.plantingDate));
    console.log('🗓️ PlantingDate type:', typeof updateData.plantingDate);
    console.log('🗓️ PlantingDate length:', updateData.plantingDate.length);
    
    // Add images as expected by @RequestParam("images") List<MultipartFile>
    images.forEach((image, index) => {
      formData.append('images', image, image.name);
      console.log(`- image[${index}]: ${image.name} (${image.size} bytes, type: ${image.type})`);
    });
    
    // Log FormData entries for debugging
    console.log('=== FormData Debug ===');
    for (let pair of formData.entries()) {
      if (pair[1] instanceof File) {
        console.log(`${pair[0]}: [File] ${pair[1].name} (${pair[1].size} bytes)`);
      } else {
        // Simple logging without character analysis to avoid JSON issues
        console.log(`${pair[0]}: "${pair[1]}" (length: ${pair[1].toString().length})`);
      }
    }
    console.log('======================');
    
    // Use the update-with-images endpoint as designed by backend
    const endpoint = `${this.baseUrl}/user-plants/update-with-images`;
    console.log('PUT URL:', endpoint);
    
    return this.http.put<ApiResponse>(endpoint, formData).pipe(
      catchError(error => {
        console.error('❌ update-with-images endpoint failed:', error);
        console.error('Error status:', error.status);
        console.error('Error response body:', error.error);
        
        // If the main endpoint fails, try fallback without images
        console.log('🔄 Fallback: Using standard update endpoint without images');
        return this.updateUserPlant(updateData);
      })
    );
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
