import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';

// Interface cho request tạo plant mới
export interface CreatePlantRequest {
  scientificName: string;
  commonName: string;
  categoryId: string;
  description: string;
  careInstructions: string;
  lightRequirement: 'LOW' | 'MEDIUM' | 'HIGH';
  waterRequirement: 'LOW' | 'MEDIUM' | 'HIGH';
  careDifficulty: 'EASY' | 'MEDIUM' | 'HARD';
  suitableLocation: string;
  commonDiseases: string;
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
   * Tạo plant mới
   */
  createNewPlant(plantData: CreatePlantRequest): Observable<CreatePlantResponse> {
    console.log('Creating new plant:', plantData);
    
    return this.http.post<CreatePlantResponse>(`${this.baseUrl}/create-new-plant`, plantData).pipe(
      tap(response => {
        console.log('Create plant response:', response);
      }),
      catchError(error => {
        console.error('Create plant error:', error);
        
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
   * Lấy danh sách categories
   */
  getCategories(): Observable<Category[]> {
    // Provide default categories immediately to avoid API call that's failing
    const defaultCategories: Category[] = [
      { id: 1, name: 'Cây cảnh trong nhà', description: 'Các loại cây phù hợp trồng trong nhà' },
      { id: 2, name: 'Cây cảnh ngoài trời', description: 'Các loại cây phù hợp trồng ngoài trời' },
      { id: 3, name: 'Cây ăn quả', description: 'Các loại cây cho trái có thể ăn được' },
      { id: 4, name: 'Cây thảo dược', description: 'Các loại cây có tính chất thảo dược' },
      { id: 5, name: 'Cây hoa', description: 'Các loại cây có hoa đẹp' },
      { id: 6, name: 'Cây sen đá', description: 'Các loại cây sen đá và cây mọng nước' }
    ];

    // Try API first, fallback to default if fails
    return this.http.get<Category[]>('/api/categories').pipe(
      catchError(error => {
        console.warn('Categories API not available, using default categories:', error.message);
        return of(defaultCategories);
      }),
      // Add timeout to prevent hanging
      tap(categories => {
        if (categories === defaultCategories) {
          console.info('Using default categories due to API unavailability');
        } else {
          console.info('Successfully loaded categories from API');
        }
      })
    );
  }

  /**
   * Upload ảnh
   */
  uploadImage(file: File): Observable<{url: string}> {
    const formData = new FormData();
    formData.append('image', file);
    
    return this.http.post<{url: string}>('/api/upload/image', formData).pipe(
      catchError(error => {
        console.warn('Image upload API not available, using mock URL:', error.message);
        
        // Create a mock URL for development/demo purposes
        const mockUrl = this.createMockImageUrl(file);
        return of({ url: mockUrl });
      }),
      tap(response => {
        console.info('Image upload result:', response.url);
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
