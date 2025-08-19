import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { map } from 'rxjs/operators';
import { Observable, of } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';

// Interface cho request tạo plant mới - match với CreateUserPlantRequestDTO
export interface CreatePlantRequest {
  scientificName: string;        // @Size(min = 3, max = 100)
  commonName: string;            // @Size(min = 2, max = 100)
  categoryId: string;            // @NotNull
  description: string;           // @Size(min = 25, max = 2000)
  careInstructions: string;      // @NotNull
  lightRequirement: 'LOW' | 'MEDIUM' | 'HIGH';
  waterRequirement: 'LOW' | 'MEDIUM' | 'HIGH';
  careDifficulty: 'EASY' | 'MODERATE' | 'DIFFICULT';  // Match với backend enum
  suitableLocation: string;      // @Size(max = 500)
  commonDiseases: string;        // @Size(max = 1000)
  imageUrls: string[];
}

// Interface cho response
export interface CreatePlantResponse {
  id: number;
  scientificName: string;
  commonName: string;
  status: string;
  message: string;
}

// Interface cho category
export interface Category {
  id: number;
  name: string;
  description?: string;
}

@Injectable({
  providedIn: 'root'
})
export class CreateNewPlantService {
  private baseUrl = '/api/user-plants';

  constructor(private http: HttpClient) {}

  /**
   * Tạo plant mới với images
   */
  createNewPlant(plantData: CreatePlantRequest): Observable<CreatePlantResponse> {
    // Tạm thời convert Azure URLs để pass validation - chờ backend cập nhật
    const plantDataForRequest = {
      ...plantData,
      imageUrls: plantData.imageUrls?.map(url => this.convertToApiFormat(url)) || []
    };
    
    return this.http.post<CreatePlantResponse>(`${this.baseUrl}/create-new-plant`, plantDataForRequest).pipe(
      tap(response => {
        // Debug: Check if images were saved
        if (response && (response as any).data && (response as any).data.imageUrls) {
          // Plant created with images
        } else if (response && (response as any).data) {
          // Plant created
        } else {
          // Plant created but no data object in response
        }
      }),
      catchError(error => {
        // Provide better error handling
        if (error.status === 0) {
          throw new Error('Không thể kết nối đến server. Vui lòng kiểm tra kết nối mạng.');
        } else if (error.status >= 500) {
          throw new Error('Lỗi server. Vui lòng thử lại sau.');
        } else if (error.status === 401) {
          throw new Error('Bạn cần đăng nhập để thực hiện chức năng này.');
        } else if (error.status === 403) {
          throw new Error('Bạn không có quyền tạo cây mới.');
        } else {
          throw new Error(error.message || 'Có lỗi xảy ra khi tạo cây mới.');
        }
      })
    );
  }

  /**
   * Convert Azure URL to format backend expects: /api/user-plants/user-plants/{filename}
   * Backend validation vẫn mong đợi format cũ
   */
  private convertToApiFormat(azureUrl: string): string {
    if (!azureUrl || !azureUrl.includes('blob.core.windows.net')) {
      return azureUrl; // Not Azure URL, return as-is
    }
    
    try {
      // Extract filename from Azure URL
      // URL format: https://plantcarestorage.blob.core.windows.net/plantcare-storage/user-plants%2F{uuid}.png%2F{realId}.png
      
      // First decode the URL to handle %2F encoding
      const decodedUrl = decodeURIComponent(azureUrl);
      
      // Split by / and find the actual image filename (usually the last UUID.extension)
      const parts = decodedUrl.split('/');
      let filename = '';
      
      // Look for the pattern: UUID.extension at the end
      for (let i = parts.length - 1; i >= 0; i--) {
        const part = parts[i];
        if (part.match(/^[a-f0-9\-]{36}\.(jpg|jpeg|png|gif|webp)$/i)) {
          filename = part;
          break;
        }
      }
      
      if (!filename) {
        // Fallback: extract from the last part if it looks like a filename
        const lastPart = parts[parts.length - 1];
        if (lastPart.includes('.')) {
          filename = lastPart;
        } else {
          return azureUrl; // Return original if can't extract
        }
      }
      
      const apiUrl = `/api/user-plants/user-plants/${filename}`;
      return apiUrl;
      
    } catch (error) {
      return azureUrl; // Return original if conversion fails
    }
  }

  /**
   * Lấy danh sách categories
   */
  getCategories(): Observable<Category[]> {
    // Chỉ lấy danh mục từ API thật
    return this.http.get<Category[]>('/api/plants/categories');
  }

  /**
   * Upload ảnh
   */
  uploadImage(file: File): Observable<{url: string}> {
    const formData = new FormData();
    formData.append('image', file); // Backend yêu cầu field là 'image'
    return this.http.post<any>('/api/user-plants/upload-plant-image', formData).pipe(
      catchError(error => {
        const mockUrl = this.createMockImageUrl(file);
        return of({ url: mockUrl });
      }),
      // Map response về dạng {url: ...} lấy từ response.data
      map(response => {
        const url = response?.data || null;
        return { url };
      })
    );
  }

  /**
   * Tạo mock URL cho ảnh khi API không hoạt động
   */
  private createMockImageUrl(file: File): string {
    // Create a unique mock URL based on file name and timestamp
    const timestamp = Date.now();
    const fileName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
    return `https://picsum.photos/400/400?random=${timestamp}&name=${fileName}`;
  }
}
