
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { ConfigService } from '../../../shared/config.service';

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

  async uploadPlantImage(plantId: number, file: File): Promise<string> {
    const url = `${this.baseUrl}/manager/upload-plant-image/${plantId}`;
    const formData = new FormData();
    formData.append('image', file);
    // Không set Content-Type, để browser tự set multipart/form-data
    const res: any = await firstValueFrom(this.http.post(url, formData));
    if (res && res.status === 200 && res.data) {
      return res.data; // chính là imageUrl trả về từ backend
    }
    throw new Error(res?.message || 'Upload ảnh thất bại');
  }
}
