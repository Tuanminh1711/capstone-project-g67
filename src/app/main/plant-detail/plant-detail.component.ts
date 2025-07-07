import { Component, OnInit, inject } from '@angular/core';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { TopNavigatorComponent } from '../../shared/top-navigator/index';
import { CookieService } from '../../auth/cookie.service';
import { PlantDataService, Plant } from '../../shared/plant-data.service';
import { AuthDialogService } from '../../auth/auth-dialog.service';
import { FormsModule } from '@angular/forms';
import { ToastService } from '../../shared/toast.service';
import { ConfirmationDialogService } from '../../shared/confirmation-dialog.service';
import { MatDialog } from '@angular/material/dialog';

/**
 * Component hiển thị chi tiết thông tin của một cây
 */
@Component({
  selector: 'app-plant-detail',
  standalone: true,
  imports: [CommonModule, TopNavigatorComponent, FormsModule, RouterModule],
  templateUrl: './plant-detail.component.html',
  styleUrl: './plant-detail.component.scss'
})
export class PlantDetailComponent implements OnInit {
  plant: Plant | null = null;
  error = '';
  selectedImage = '';
  requiresAuth = false;
  isLimitedInfo = false;
  private toast = inject(ToastService);
  private confirmationDialog = inject(ConfirmationDialogService);
  private dialog = inject(MatDialog);

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private http: HttpClient,
    private cookieService: CookieService,
    private plantDataService: PlantDataService,
    private authDialogService: AuthDialogService
  ) {}

  ngOnInit(): void {
    this.loadPlantDetail();
  }

  /**
   * Tải thông tin chi tiết của cây
   */
  loadPlantDetail(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) {
      this.error = 'ID cây không hợp lệ';
      return;
    }

    const plantId = parseInt(id);
    this.resetState();
    this.loadFromServiceFirst(plantId);
  }

  private resetState(): void {
    this.error = '';
    this.requiresAuth = false;
    this.isLimitedInfo = false;
  }

  /**
   * Load từ service trước, fallback vào API
   */
  private loadFromServiceFirst(plantId: number): void {
    const token = this.cookieService.getAuthToken();
    
    // Thử từ cache
    const cachedPlant = this.loadCachedPlant(plantId);
    if (cachedPlant) {
      this.plant = cachedPlant;
      this.isLimitedInfo = !token;
      this.setSelectedImage();
      if (token) {
        this.upgradeToFullData(plantId.toString());
      }
      return;
    }
    
    // Thử từ service
    const selectedPlant = this.plantDataService.getSelectedPlant();
    if (selectedPlant?.id === plantId) {
      this.plant = this.mapApiResponseToPlant(selectedPlant);
      this.cachePlant(this.plant);
      this.isLimitedInfo = !token;
      this.setSelectedImage();
      if (token) {
        this.upgradeToFullData(plantId.toString());
      }
      return;
    }

    // Thử từ cached list
    const cachedListPlant = this.plantDataService.getPlantById(plantId);
    if (cachedListPlant) {
      this.plant = this.mapApiResponseToPlant(cachedListPlant);
      this.cachePlant(this.plant);
      this.isLimitedInfo = !token;
      this.setSelectedImage();
      if (token) {
        this.upgradeToFullData(plantId.toString());
      }
      return;
    }

    // Load từ API
    this.loadFromAPI(plantId.toString());
  }

  /**
   * Load từ API
   */
  private loadFromAPI(id: string): void {
    const token = this.cookieService.getAuthToken();
    
    if (token) {
      this.fetchPlantDetailWithAuth(id);
    } else {
      this.tryPublicEndpoint(id);
    }
  }

  private tryPublicEndpoint(id: string): void {
    this.http.get<any>(`/api/plants/${id}`).subscribe({
      next: (response) => {
        if (response?.data || response?.id) {
          const rawData = response.data || response;
          this.plant = this.mapApiResponseToPlant(rawData);
          this.isLimitedInfo = true;
          this.setSelectedImage();
        } else {
          this.error = 'Không tìm thấy thông tin cây';
        }
      },
      error: () => {
        this.requiresAuth = true;
      }
    });
  }

  private fetchPlantDetailWithAuth(id: string): void {
    this.http.get<any>(`/api/plants/detail/${id}`).subscribe({
      next: (response) => {
        if (response?.data || response?.id) {
          const rawData = response.data || response;
          this.plant = this.mapApiResponseToPlant(rawData, this.plant || undefined);
          this.isLimitedInfo = false;
          this.setSelectedImage();
          if (this.plant) {
            this.cachePlant(this.plant);
          }
        } else {
          this.error = 'Không tìm thấy thông tin cây';
        }
      },
      error: (err) => {
        if (err.status === 404) {
          this.error = 'Không tìm thấy thông tin cây với ID này';
        } else if (err.status === 403 || err.status === 401) {
          this.requiresAuth = true;
        } else {
          this.error = 'Không thể tải thông tin cây. Vui lòng thử lại.';
        }
      }
    });
  }

  private upgradeToFullData(id: string): void {
    this.http.get<any>(`/api/plants/detail/${id}`).subscribe({
      next: (response) => {
        if (response?.data || response?.id) {
          const rawData = response.data || response;
          this.plant = this.mapApiResponseToPlant(rawData, this.plant || undefined);
          this.isLimitedInfo = false;
          this.setSelectedImage();
        }
      },
      error: (err) => {
        if (err.status === 403 || err.status === 401) {
          this.isLimitedInfo = true;
        }
      }
    });
  }

  private setSelectedImage(): void {
    if (this.plant?.imageUrls?.length) {
      this.selectedImage = this.plant.imageUrls[0];
    }
  }

  /**
   * Map API response to Plant interface với preservation của dữ liệu cũ
   */
  private mapApiResponseToPlant(apiData: any, existingPlant?: Plant): Plant {
    return {
      id: apiData.id,
      scientificName: apiData.scientificName || '',
      commonName: apiData.commonName || '',
      categoryName: apiData.categoryName || apiData.category || '',
      description: apiData.description || '',
      careInstructions: apiData.careInstructions || '',
      lightRequirement: apiData.lightRequirement || existingPlant?.lightRequirement || '',
      waterRequirement: apiData.waterRequirement || existingPlant?.waterRequirement || '',
      careDifficulty: apiData.careDifficulty || existingPlant?.careDifficulty || '',
      suitableLocation: apiData.suitableLocation || '',
      commonDiseases: apiData.commonDiseases || '',
      status: apiData.status || 'ACTIVE',
      imageUrls: apiData.imageUrls || apiData.images || [],
      createdAt: apiData.createdAt || null
    };
  }

  private loadCachedPlant(plantId: number): Plant | null {
    try {
      const cached = localStorage.getItem(`plant_${plantId}`);
      if (cached) {
        const plantData = JSON.parse(cached);
        const cacheTime = new Date(plantData.cachedAt).getTime();
        const now = new Date().getTime();
        if (now - cacheTime < 5 * 60 * 1000) { // 5 minutes
          return plantData.plant;
        }
      }
    } catch (e) {
      // Silent fail
    }
    return null;
  }

  private cachePlant(plant: Plant): void {
    try {
      const cacheData = {
        plant: plant,
        cachedAt: new Date().toISOString()
      };
      localStorage.setItem(`plant_${plant.id}`, JSON.stringify(cacheData));
    } catch (e) {
      // Silent fail
    }
  }

  // UI Methods
  selectImage(imageUrl: string): void {
    this.selectedImage = imageUrl;
  }

  goBack(): void {
    this.router.navigate(['/plant-info']);
  }

  goToLogin(): void {
    this.router.navigate(['/login']);
  }

  openLoginDialog(): void {
    this.authDialogService.openLoginDialog();
  }

  addToCollection(): void {
    if (!this.plant) return;
    
    // Check if user is authenticated
    const token = this.cookieService.getAuthToken();
    if (!token) {
      this.openLoginDialog();
      return;
    }
    
    // Set selected plant in service for the add component
    this.plantDataService.setSelectedPlant(this.plant);
    
    // Navigate to add plant to collection page
    this.router.navigate(['/user/add-plant', this.plant.id]);
  }

  reloadPlantDetail(): void {
    this.loadPlantDetail();
  }

  formatDate(dateString: string): string {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString('vi-VN');
  }

  // Translation Methods
  translateLightRequirement(value: string): string {
    const translations: { [key: string]: string } = {
      'LOW': 'Ít ánh sáng',
      'MEDIUM': 'Ánh sáng vừa phải',
      'HIGH': 'Nhiều ánh sáng'
    };
    return translations[value?.toUpperCase()] || value || 'Chưa có thông tin';
  }

  translateWaterRequirement(value: string): string {
    const translations: { [key: string]: string } = {
      'LOW': 'Ít nước',
      'MEDIUM': 'Nước vừa phải',
      'HIGH': 'Nhiều nước'
    };
    return translations[value?.toUpperCase()] || value || 'Chưa có thông tin';
  }

  translateCareDifficulty(value: string): string {
    const translations: { [key: string]: string } = {
      'EASY': 'Dễ chăm sóc',
      'MODERATE': 'Trung bình',
      'DIFFICULT': 'Khó chăm sóc'
    };
    return translations[value?.toUpperCase()] || value || 'Chưa có thông tin';
  }

  // New helper methods for enhanced UI
  getLightPosition(value: string): string {
    const positions: { [key: string]: string } = {
      'LOW': 'Góc tối, xa cửa sổ',
      'MEDIUM': 'Gần cửa sổ, ánh sáng gián tiếp',
      'HIGH': 'Cửa sổ hướng nam, ánh sáng trực tiếp'
    };
    return positions[value?.toUpperCase()] || 'Tùy theo loại cây';
  }

  getWaterFrequency(value: string): string {
    const frequencies: { [key: string]: string } = {
      'LOW': '1-2 lần/tuần',
      'MEDIUM': '2-3 lần/tuần',
      'HIGH': '3-4 lần/tuần'
    };
    return frequencies[value?.toUpperCase()] || 'Theo nhu cầu';
  }

  getDifficultyClass(value: string): string {
    const classes: { [key: string]: string } = {
      'EASY': 'easy-indicator',
      'MODERATE': 'moderate-indicator',
      'DIFFICULT': 'difficult-indicator'
    };
    return classes[value?.toUpperCase()] || 'default-indicator';
  }

  getDifficultyTip(value: string): string {
    const tips: { [key: string]: string } = {
      'EASY': 'Phù hợp người mới bắt đầu',
      'MODERATE': 'Cần chút kinh nghiệm',
      'DIFFICULT': 'Dành cho người có kinh nghiệm'
    };
    return tips[value?.toUpperCase()] || 'Tùy theo kinh nghiệm';
  }
}
