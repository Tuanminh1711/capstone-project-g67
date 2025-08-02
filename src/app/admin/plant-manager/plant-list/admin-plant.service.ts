import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, firstValueFrom } from 'rxjs';
import { ConfigService } from '../../../shared/config.service';

export interface UpdatePlantRequest {
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
  status: string;
}

export interface PlantDetails {
  id: number;
  scientificName: string;
  commonName: string;
  categoryId: number;
  categoryName: string;
  description: string;
  careInstructions: string;
  lightRequirement: string;
  waterRequirement: string;
  careDifficulty: string;
  suitableLocation: string;
  commonDiseases: string;
  status: string;
  imageUrls: string[];
  createdAt: string;
  updatedAt?: string;
}

export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data: T;
}

@Injectable({
  providedIn: 'root'
})
export class AdminPlantService {
  constructor(
    private http: HttpClient,
    private configService: ConfigService
  ) {}

  /**
   * Get plant details by ID
   */
  getPlantById(id: number): Observable<ApiResponse<PlantDetails>> {
    return this.http.get<ApiResponse<PlantDetails>>(`${this.configService.apiUrl}/manager/plants/${id}`);
  }

  /**
   * Update plant information
   */
  updatePlant(id: number, request: UpdatePlantRequest): Observable<ApiResponse<PlantDetails>> {
    return this.http.put<ApiResponse<PlantDetails>>(`${this.configService.apiUrl}/manager/update-plant/${id}`, request);
  }

  /**
   * Update plant information using Promise (async/await)
   */
  async updatePlantAsync(id: number, request: UpdatePlantRequest): Promise<ApiResponse<PlantDetails>> {
    return firstValueFrom(this.updatePlant(id, request));
  }

  /**
   * Get plant details using Promise (async/await)
   */
  async getPlantByIdAsync(id: number): Promise<ApiResponse<PlantDetails>> {
    return firstValueFrom(this.getPlantById(id));
  }

  /**
   * Delete plant
   */
  deletePlant(id: number): Observable<ApiResponse<any>> {
    return this.http.delete<ApiResponse<any>>(`${this.configService.apiUrl}/manager/delete-plant/${id}`);
  }

  /**
   * Get all plants with pagination
   */
  getPlants(pageNo: number = 0, pageSize: number = 10, keyword: string = ''): Observable<ApiResponse<any>> {
    const params: any = {
      pageNo: pageNo.toString(),
      pageSize: pageSize.toString()
    };
    
    if (keyword) {
      params.keyword = keyword;
    }

    return this.http.get<ApiResponse<any>>(`${this.configService.apiUrl}/manager/plants`, { params });
  }

  /**
   * Validate plant data before update
   */
  validatePlantData(data: UpdatePlantRequest): string[] {
    const errors: string[] = [];

    if (!data.commonName?.trim()) {
      errors.push('Tên thường gọi là bắt buộc');
    }

    if (!data.scientificName?.trim()) {
      errors.push('Tên khoa học là bắt buộc');
    }

    if (!data.categoryId || data.categoryId <= 0) {
      errors.push('ID danh mục phải lớn hơn 0');
    }

    if (!['LOW', 'MEDIUM', 'HIGH'].includes(data.lightRequirement)) {
      errors.push('Yêu cầu ánh sáng không hợp lệ');
    }

    if (!['LOW', 'MEDIUM', 'HIGH'].includes(data.waterRequirement)) {
      errors.push('Yêu cầu nước không hợp lệ');
    }

    if (!['EASY', 'MODERATE', 'DIFFICULT'].includes(data.careDifficulty)) {
      errors.push('Độ khó chăm sóc không hợp lệ');
    }

    if (!['ACTIVE', 'INACTIVE'].includes(data.status)) {
      errors.push('Trạng thái không hợp lệ');
    }

    return errors;
  }

  /**
   * Format plant data for display
   */
  formatPlantData(plant: PlantDetails): any {
    return {
      ...plant,
      lightRequirementDisplay: this.translateLightRequirement(plant.lightRequirement),
      waterRequirementDisplay: this.translateWaterRequirement(plant.waterRequirement),
      careDifficultyDisplay: this.translateCareDifficulty(plant.careDifficulty),
      statusDisplay: this.translateStatus(plant.status)
    };
  }

  /**
   * Translation helpers
   */
  private translateLightRequirement(value: string): string {
    const translations: { [key: string]: string } = {
      'LOW': 'Ít ánh sáng',
      'MEDIUM': 'Ánh sáng vừa phải',
      'HIGH': 'Nhiều ánh sáng'
    };
    return translations[value] || value;
  }

  private translateWaterRequirement(value: string): string {
    const translations: { [key: string]: string } = {
      'LOW': 'Ít nước',
      'MEDIUM': 'Nước vừa phải',
      'HIGH': 'Nhiều nước'
    };
    return translations[value] || value;
  }

  private translateCareDifficulty(value: string): string {
    const translations: { [key: string]: string } = {
      'EASY': 'Dễ chăm sóc',
      'MODERATE': 'Trung bình',
      'DIFFICULT': 'Khó chăm sóc'
    };
    return translations[value] || value;
  }

  private translateStatus(value: string): string {
    const translations: { [key: string]: string } = {
      'ACTIVE': 'Hoạt động',
      'INACTIVE': 'Không hoạt động'
    };
    return translations[value] || value;
  }
}
