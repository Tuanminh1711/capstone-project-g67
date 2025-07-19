import { environment } from '../../../../environments/environment';
import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TopNavigatorComponent } from '../../../shared/top-navigator/index';
import { Plant, PlantDataService } from '../../../shared/plant-data.service';
import { PlantDetailLoaderService } from '../../../shared/plant-detail-loader.service';
import { CookieService } from '../../../auth/cookie.service';
import { ToastService } from '../../../shared/toast/toast.service';


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
  // ...existing code...
})
export class AddPlantComponent implements OnInit {
  plant: Plant | null = null;
  loading = false;
  error = '';

  // For image fallback
  plantImageUrl = '';

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
    private toastService: ToastService,
    private plantDetailLoader: PlantDetailLoaderService,
  ) {}


  ngOnInit(): void {
    this.initializeForm();
    const plantId = this.route.snapshot.paramMap.get('plantId');
    if (plantId) {
      const cached = this.plantDataService.getSelectedPlant();
      if (cached && cached.id === Number(plantId)) {
        this.plant = cached;
        this.formData.plantId = cached.id;
        this.setPlantImageUrl();
        this.setDefaultNickname();
      }
      // Luôn gọi lại API để đảm bảo dữ liệu mới nhất (giống plant-detail)
      this.loadPlantInfo();
    }
  }


  loadPlantInfo(): void {
    const plantId = this.route.snapshot.paramMap.get('plantId');
    if (!plantId) {
      this.error = 'ID cây không hợp lệ';
      return;
    }
    const id = Number(plantId);
    this.formData.plantId = id;
    this.loading = true;
    this.plantDetailLoader.loadPlantDetail(plantId).subscribe({
      next: (plant) => {
        this.plant = plant;
        this.plantDataService.setSelectedPlant(plant); // luôn lưu lại state mới nhất
        this.setPlantImageUrl();
        this.setDefaultNickname();
        this.loading = false;
        this.error = '';
      },
      error: (err) => {
        this.loading = false;
        if (err.status === 404) {
          this.error = 'Không tìm thấy thông tin cây với ID này';
        } else if (err.status === 403 || err.status === 401) {
          this.error = 'Bạn cần đăng nhập để xem chi tiết cây';
        } else {
          this.error = 'Không thể tải thông tin cây';
        }
      }
    });
  }



  private setPlantImageUrl(): void {
    this.plantImageUrl = (this.plant && Array.isArray(this.plant.imageUrls) && this.plant.imageUrls.length > 0)
      ? this.plant.imageUrls[0]
      : 'assets/image/default-plant.png';
  }




  private initializeForm(): void {
    // Set default planting date to today
    const today = new Date();
    const formattedDate = today.toISOString().split('T')[0];
    this.formData.plantingDate = formattedDate;
  }

  private setDefaultNickname(): void {
    if (this.plant && !this.formData.nickname) {
      const name = this.plant.commonName || this.plant.scientificName || '';
      this.formData.nickname = name ? `${name} của tôi` : '';
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

    this.http.post<any>(`${environment.apiUrl}/user-plants/add`, requestData).subscribe({
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
