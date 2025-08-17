
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { ConfigService } from '../../../../shared/services/config.service';

export interface PlantCategory {
  id: number;
  name: string;
}

export interface CreatePlantRequest {
  scientificName: string;
  commonName: string;
  categoryId: number;
  description: string;
  careInstructions: string;
  lightRequirement: string;
  waterRequirement: string;
  careDifficulty: string;
  suitableLocation: string;
  commonDiseases: string;
  imageUrls: string[];
}

export interface CreatePlantResponse {
  id: number;
  message: string;
}

@Injectable({
  providedIn: 'root'
})
export class AdminCreatePlantService {
  private readonly baseUrl: string;

  constructor(
    private http: HttpClient,
    private configService: ConfigService
  ) {
    this.baseUrl = this.configService.apiUrl;
  }

  async createPlant(request: CreatePlantRequest): Promise<CreatePlantResponse> {
    const url = `${this.baseUrl}/manager/create-plant`;
    
    const headers = {
      'Content-Type': 'application/json'
    };
    
    return firstValueFrom(this.http.post<CreatePlantResponse>(url, request, { headers }));
  }


  async getCategories(): Promise<PlantCategory[]> {
    // Gọi API thật để lấy danh sách categories (dùng baseUrl để phù hợp mọi môi trường)
    const url = `${this.baseUrl}/plants/categories`;
    return firstValueFrom(this.http.get<PlantCategory[]>(url));
  }

  async uploadPlantImage(file: File): Promise<string> {
    const url = `${this.baseUrl}/manager/upload-plant-image`;
    const formData = new FormData();
    formData.append('image', file);
    
    try {
      console.log('Uploading image to:', url);
      console.log('File details:', {
        name: file.name,
        size: file.size,
        type: file.type
      });
      
      // Không set Content-Type, để browser tự set multipart/form-data
      const res: any = await firstValueFrom(this.http.post(url, formData));
      console.log('Upload response:', res);
      
      if (res && res.status === 200 && res.data) {
        return res.data; // chính là imageUrl trả về từ backend
      }
      throw new Error(res?.message || 'Upload ảnh thất bại');
    } catch (error: any) {
      console.error('Upload error:', error);
      console.error('Error details:', {
        status: error.status,
        statusText: error.statusText,
        message: error.message,
        error: error.error
      });
      
      if (error.status === 404) {
        throw new Error('API endpoint không tồn tại. Vui lòng kiểm tra backend server.');
      } else if (error.status === 500) {
        throw new Error('Lỗi server. Vui lòng kiểm tra backend logs.');
      } else if (error.status === 401 || error.status === 403) {
        throw new Error('Không có quyền truy cập. Vui lòng đăng nhập lại.');
      }
      
      throw new Error(error?.error?.message || error?.message || 'Upload ảnh thất bại');
    }
  }
}
