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
    // For now, return hardcoded categories since we don't have a categories API
    // In a real application, this would be an API call
    return Promise.resolve([
      { id: 1, name: 'Cây cảnh trong nhà' },
      { id: 2, name: 'Cây cảnh ngoài trời' },
      { id: 3, name: 'Cây ăn quả' },
      { id: 4, name: 'Cây thuốc' },
      { id: 5, name: 'Cây thủy sinh' },
      { id: 6, name: 'Cây sen đá' },
      { id: 7, name: 'Cây leo' },
      { id: 8, name: 'Cây bụi' },
      { id: 9, name: 'Cây hoa' },
      { id: 10, name: 'Cây lá' }
    ]);
  }
}
