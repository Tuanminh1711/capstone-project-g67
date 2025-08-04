import { environment } from '../../../../environments/environment';
import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { HttpClient, HttpHeaders } from '@angular/common/http';
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
export class AddPlantComponent implements OnInit, OnDestroy {
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
    private cdr: ChangeDetectorRef
  ) {}


  ngOnInit(): void {
    this.initializeForm();
    const plantId = this.route.snapshot.paramMap.get('plantId');
    if (!plantId) {
      this.toastService.error('Bạn cần chọn cây trước khi thêm vào bộ sưu tập');
      this.router.navigate(['/plant-info']);
      return;
    }
    const id = Number(plantId);
    this.formData.plantId = id;
    // Nếu cache đúng id thì dùng tạm để hiển thị nhanh, nhưng vẫn luôn gọi API để lấy mới nhất
    const cached = this.plantDataService.getSelectedPlant();
    if (cached && cached.id === id) {
      this.plant = cached;
      this.setPlantImageUrl();
      this.setDefaultNickname();
    }
    // Luôn gọi lại API để đảm bảo dữ liệu mới nhất (giống plant-detail)
    this.loadPlantInfo();
  }

  ngOnDestroy(): void {
    // Clean up object URLs to prevent memory leaks
    this.selectedImages.forEach(file => {
      const url = URL.createObjectURL(file);
      URL.revokeObjectURL(url);
    });
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
    // Kiểm tra tất cả trường bắt buộc
    if (!this.formData.plantId || !this.formData.nickname.trim() || !this.formData.plantingDate || !this.formData.locationInHouse) {
      this.toastService.error('Vui lòng điền đầy đủ thông tin và chọn cây hợp lệ');
      return;
    }

    const token = this.cookieService.getAuthToken();
    console.log('Add plant - Token from cookie:', token ? 'Found' : 'Not found');
    if (!token) {
      this.toastService.error('Bạn cần đăng nhập để thêm cây vào bộ sưu tập');
      this.router.navigate(['/login']);
      return;
    }

    this.loading = true;

    // Format the request data với validation chi tiết
    const requestData = {
      plantId: this.formData.plantId,
      nickname: this.formData.nickname.trim(),
      plantingDate: new Date(this.formData.plantingDate).toISOString(),
      locationInHouse: this.formData.locationInHouse,
      reminderEnabled: this.formData.reminderEnabled
    };

    // Validate request data trước khi gửi - đảm bảo tất cả field có giá trị
    console.log('Request data validation:', {
      plantId: requestData.plantId,
      plantIdType: typeof requestData.plantId,
      nickname: requestData.nickname,
      nicknameLength: requestData.nickname.length,
      plantingDate: requestData.plantingDate,
      plantingDateValid: !isNaN(Date.parse(this.formData.plantingDate)),
      locationInHouse: requestData.locationInHouse,
      locationInHouseLength: requestData.locationInHouse.length,
      reminderEnabled: requestData.reminderEnabled,
      reminderEnabledType: typeof requestData.reminderEnabled
    });

    if (!requestData.plantId || requestData.plantId <= 0) {
      this.toastService.error('Plant ID không hợp lệ');
      this.loading = false;
      return;
    }

    if (!requestData.nickname || requestData.nickname.length === 0) {
      this.toastService.error('Tên cây không được để trống');
      this.loading = false;
      return;
    }

    if (!requestData.plantingDate) {
      this.toastService.error('Ngày trồng không hợp lệ');
      this.loading = false;
      return;
    }

    if (!requestData.locationInHouse || requestData.locationInHouse.length === 0) {
      this.toastService.error('Vị trí trồng cây không được để trống');
      this.loading = false;
      return;
    }

    // Log toàn bộ requestData trước khi gửi để debug
    console.log('Full requestData before sending:', requestData);

    // Tạo FormData đúng chuẩn backend @RequestPart("requestDTO") và @RequestPart("images")
    const formData = new FormData();
    formData.append('requestDTO', new Blob([JSON.stringify(requestData)], { type: 'application/json' }));

    // Nếu có upload ảnh, append từng file vào formData với key 'images'
    if (this.selectedImages && this.selectedImages.length > 0) {
      for (const file of this.selectedImages) {
        formData.append('images', file);
      }
    }

    // Debug: Log FormData content
    console.log('FormData entries:');
    for (let [key, value] of formData.entries()) {
      if (value instanceof Blob) {
        console.log(key, 'Blob size:', value.size, 'type:', value.type);
      } else {
        console.log(key, value);
      }
    }

    // Interceptor sẽ tự động thêm Authorization header, không cần manual headers
    console.log('Sending add plant request with data:', {
      plantId: requestData.plantId,
      nickname: requestData.nickname,
      plantingDate: requestData.plantingDate,
      locationInHouse: requestData.locationInHouse,
      reminderEnabled: requestData.reminderEnabled,
      hasImages: this.selectedImages && this.selectedImages.length > 0
    });
    
    this.http.post<any>(`${environment.apiUrl}/user-plants/add`, formData).subscribe({
      next: (response) => {
        console.log('Add plant response:', response);
        // Use setTimeout to avoid ExpressionChangedAfterItHasBeenCheckedError
        setTimeout(() => {
          this.loading = false;
          this.toastService.success('Đã thêm cây vào bộ sưu tập thành công!');
          this.router.navigate(['/my-green-space']);
        }, 0);
      },
      error: (err) => {
        console.error('Add plant error details:', err);
        // Use setTimeout to avoid ExpressionChangedAfterItHasBeenCheckedError
        setTimeout(() => {
          this.loading = false;
          if (err.status === 401 || err.status === 403) {
            this.toastService.error('Bạn không có quyền thực hiện hành động này. Vui lòng đăng nhập lại.');
          } else if (err.status === 409) {
            this.toastService.error('Cây này đã có trong bộ sưu tập của bạn');
          } else if (err.error?.message) {
            this.toastService.error(`Lỗi: ${err.error.message}`);
          } else {
            this.toastService.error('Không thể thêm cây vào bộ sưu tập. Vui lòng thử lại.');
          }
        }, 0);
      }
    });
  }

  // Lưu trữ file ảnh người dùng chọn
  selectedImages: File[] = [];

  // Hàm xử lý khi chọn file ảnh
  onImageSelected(event: any): void {
    const files: FileList = event.target.files;
    this.selectedImages = [];
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      // Validate file type
      if (file.type.startsWith('image/')) {
        // Validate file size (max 5MB per image)
        if (file.size <= 5 * 1024 * 1024) {
          this.selectedImages.push(file);
        } else {
          this.toastService.error(`Ảnh "${file.name}" quá lớn. Kích thước tối đa là 5MB.`);
        }
      } else {
        this.toastService.error(`File "${file.name}" không phải là ảnh hợp lệ.`);
      }
    }
    
    // Limit maximum 5 images
    if (this.selectedImages.length > 5) {
      this.selectedImages = this.selectedImages.slice(0, 5);
      this.toastService.warning('Chỉ được chọn tối đa 5 ảnh.');
    }
    
    console.log('Selected images:', this.selectedImages.length);
  }

  // Trigger file input click
  triggerFileInput(): void {
    const fileInput = document.getElementById('images') as HTMLInputElement;
    fileInput?.click();
  }

  // Get image preview URL
  getImagePreview(file: File): string {
    return URL.createObjectURL(file);
  }

  // Remove image from selection
  removeImage(index: number): void {
    if (index >= 0 && index < this.selectedImages.length) {
      // Revoke object URL to prevent memory leaks
      const file = this.selectedImages[index];
      const previewUrl = URL.createObjectURL(file);
      URL.revokeObjectURL(previewUrl);
      
      this.selectedImages.splice(index, 1);
      console.log('Removed image, remaining:', this.selectedImages.length);
    }
  }

  // Format file size for display
  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
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
