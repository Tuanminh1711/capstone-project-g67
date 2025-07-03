import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TopNavigatorComponent } from '../../shared/top-navigator/index';
import { Plant, PlantDataService } from '../../shared/plant-data.service';
import { CookieService } from '../../auth/cookie.service';
import { ToastService } from '../../shared/toast.service';

interface AddPlantRequest {
  plantId: number;
  nickname: string;
  plantingDate: string;
  locationInHouse: string;
  reminderEnabled: boolean;
}

@Component({
  selector: 'app-add-plant',
  standalone: true,
  imports: [CommonModule, FormsModule, TopNavigatorComponent],
  templateUrl: './add-plant.component.html',
  styleUrl: './add-plant.component.scss'
})
export class AddPlantComponent implements OnInit {
  plant: Plant | null = null;
  loading = false;
  error = '';

  // Form data
  formData: AddPlantRequest = {
    plantId: 0,
    nickname: '',
    plantingDate: '',
    locationInHouse: '',
    reminderEnabled: true
  };

  // Location options
  locationOptions = [
    'Phòng khách',
    'Phòng ngủ',
    'Phòng bếp',
    'Ban công',
    'Sân vườn',
    'Phòng làm việc',
    'Phòng tắm',
    'Hành lang',
    'Khác'
  ];

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private http: HttpClient,
    private plantDataService: PlantDataService,
    private cookieService: CookieService,
    private toastService: ToastService
  ) {}

  ngOnInit(): void {
    this.loadPlantInfo();
    this.initializeForm();
  }

  loadPlantInfo(): void {
    const plantId = this.route.snapshot.paramMap.get('plantId');
    if (!plantId) {
      this.error = 'ID cây không hợp lệ';
      return;
    }

    const id = parseInt(plantId);
    this.formData.plantId = id;

    // Try to get plant from service first
    const selectedPlant = this.plantDataService.getSelectedPlant();
    if (selectedPlant && selectedPlant.id === id) {
      this.plant = selectedPlant;
      this.setDefaultNickname();
      return;
    }

    // Try to get from cached list
    const cachedPlant = this.plantDataService.getPlantById(id);
    if (cachedPlant) {
      this.plant = cachedPlant;
      this.setDefaultNickname();
      return;
    }

    // Load from API
    this.loadPlantFromAPI(plantId);
  }

  private loadPlantFromAPI(plantId: string): void {
    this.loading = true;
    this.http.get<any>(`/api/plants/${plantId}`).subscribe({
      next: (response) => {
        this.loading = false;
        if (response?.data || response?.id) {
          const rawData = response.data || response;
          this.plant = this.mapApiResponseToPlant(rawData);
          this.setDefaultNickname();
        } else {
          this.error = 'Không tìm thấy thông tin cây';
        }
      },
      error: (err) => {
        this.loading = false;
        this.error = 'Không thể tải thông tin cây';
        console.error('Error loading plant:', err);
      }
    });
  }

  private mapApiResponseToPlant(apiData: any): Plant {
    return {
      id: apiData.id,
      scientificName: apiData.scientificName || '',
      commonName: apiData.commonName || '',
      categoryName: apiData.categoryName || apiData.category || '',
      description: apiData.description || '',
      careInstructions: apiData.careInstructions || '',
      lightRequirement: apiData.lightRequirement || '',
      waterRequirement: apiData.waterRequirement || '',
      careDifficulty: apiData.careDifficulty || '',
      suitableLocation: apiData.suitableLocation || '',
      commonDiseases: apiData.commonDiseases || '',
      status: apiData.status || 'ACTIVE',
      imageUrls: apiData.imageUrls || apiData.images || [],
      createdAt: apiData.createdAt || null
    };
  }

  private initializeForm(): void {
    // Set default planting date to today
    const today = new Date();
    const formattedDate = today.toISOString().split('T')[0];
    this.formData.plantingDate = formattedDate;
  }

  private setDefaultNickname(): void {
    if (this.plant && !this.formData.nickname) {
      this.formData.nickname = `${this.plant.commonName || this.plant.scientificName} của tôi`;
    }
  }

  onSubmit(): void {
    if (!this.isFormValid()) {
      this.toastService.error('Vui lòng điền đầy đủ thông tin');
      return;
    }

    const token = this.cookieService.getAuthToken();
    if (!token) {
      this.toastService.error('Bạn cần đăng nhập để thêm cây vào bộ sưu tập');
      this.router.navigate(['/login']);
      return;
    }

    this.loading = true;

    // Format the request data
    const requestData = {
      plantId: this.formData.plantId,
      nickname: this.formData.nickname.trim(),
      plantingDate: new Date(this.formData.plantingDate).toISOString(),
      locationInHouse: this.formData.locationInHouse,
      reminderEnabled: this.formData.reminderEnabled
    };

    this.http.post<any>('http://localhost:8080/api/user-plants/add', requestData).subscribe({
      next: (response) => {
        this.loading = false;
        this.toastService.success('Đã thêm cây vào bộ sưu tập thành công!');
        this.router.navigate(['/my-green-space']);
      },
      error: (err) => {
        this.loading = false;
        console.error('Error adding plant to collection:', err);
        
        if (err.status === 401 || err.status === 403) {
          this.toastService.error('Bạn không có quyền thực hiện hành động này');
        } else if (err.status === 409) {
          this.toastService.error('Cây này đã có trong bộ sưu tập của bạn');
        } else {
          this.toastService.error('Không thể thêm cây vào bộ sưu tập. Vui lòng thử lại.');
        }
      }
    });
  }

  private isFormValid(): boolean {
    return !!(
      this.formData.nickname.trim() &&
      this.formData.plantingDate &&
      this.formData.locationInHouse
    );
  }

  goBack(): void {
    if (this.plant) {
      this.router.navigate(['/plant-detail', this.plant.id]);
    } else {
      this.router.navigate(['/plant-info']);
    }
  }

  getCurrentDate(): string {
    return new Date().toISOString().split('T')[0];
  }

  // Translation methods
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
}
