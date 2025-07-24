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
    const url = `${this.baseUrl}/admin/createplants`;
    
    const headers = {
      'Content-Type': 'application/json'
    };
    
    return firstValueFrom(this.http.post<CreatePlantResponse>(url, request, { headers }));
  }

  async getCategories(): Promise<PlantCategory[]> {
    // Gọi API thật để lấy danh sách categories
    return firstValueFrom(this.http.get<PlantCategory[]>('http://localhost:8080/api/plants/categories'));
  }
}
