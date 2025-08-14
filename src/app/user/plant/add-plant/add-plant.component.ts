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
    locationInHouse: ''
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

  // Warning popup state
  showLocationWarning = false;
  locationWarningMessage = '';
  pendingSubmit = false;

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
    this.clearImagePreviews();
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
    console.log('onSubmit called, pendingSubmit:', this.pendingSubmit);
    
    // Validate form before processing
    if (!this.isFormValid()) {
      this.toastService.error('Vui lòng điền đầy đủ thông tin bắt buộc');
      return;
    }

    // Check location compatibility before submitting
    console.log('Checking location compatibility...');
    console.log('Plant suitable location:', this.plant?.suitableLocation);
    console.log('Selected location:', this.formData.locationInHouse);
    
    const shouldWarn = this.shouldShowLocationWarning();
    console.log('Should show warning:', shouldWarn);
    
    if (!this.pendingSubmit && shouldWarn) {
      console.log('Showing location warning popup - blocking submit');
      this.showLocationWarningPopup();
      return; // Stop form submission
    }

    console.log('Proceeding with form submission...');

    // Check authentication
    const token = this.cookieService.getAuthToken();
    if (!token) {
      this.toastService.error('Bạn cần đăng nhập để thêm cây vào bộ sưu tập');
      this.router.navigate(['/login']);
      return;
    }

    this.loading = true;
    this.error = '';
    this.pendingSubmit = false; // Reset pending state

    // Prepare request data
    const requestData = this.prepareRequestData();
    
    // Create FormData for multipart request
    const formData = this.createFormData(requestData);
    
    // Send request
    this.sendAddPlantRequest(formData);
  }

  private prepareRequestData() {
    return {
      plantId: this.formData.plantId,
      nickname: this.formData.nickname.trim(),
      plantingDate: this.formData.plantingDate, // Keep as YYYY-MM-DD format
      locationInHouse: this.formData.locationInHouse
    };
  }

  private createFormData(requestData: any): FormData {
    const formData = new FormData();
    
    // Add form fields individually
    formData.append('plantId', requestData.plantId.toString());
    formData.append('nickname', requestData.nickname);
    formData.append('plantingDate', requestData.plantingDate);
    formData.append('locationInHouse', requestData.locationInHouse);

    // Add images if selected
    if (this.selectedImages && this.selectedImages.length > 0) {
      this.selectedImages.forEach(file => {
        formData.append('images', file);
      });
    }

    return formData;
  }

  private sendAddPlantRequest(formData: FormData): void {
    console.log('Sending add plant request...');
    
    this.http.post<any>(`${environment.apiUrl}/user-plants/add`, formData).subscribe({
      next: (response) => this.handleAddPlantSuccess(response),
      error: (error) => this.handleAddPlantError(error)
    });
  }

  private handleAddPlantSuccess(response: any): void {
    console.log('Add plant success:', response);
    
    // Use setTimeout to avoid ExpressionChangedAfterItHasBeenCheckedError
    setTimeout(() => {
      this.loading = false;
      this.toastService.success('Đã thêm cây vào bộ sưu tập thành công!');
      
      // Navigate to my garden
      setTimeout(() => {
        this.router.navigate(['/user/my-garden']);
      }, 1500);
    }, 0);
  }

  private handleAddPlantError(error: any): void {
    console.error('Add plant error:', error);
    
    // Use setTimeout to avoid ExpressionChangedAfterItHasBeenCheckedError
    setTimeout(() => {
      this.loading = false;
      
      // Handle specific error cases
      if (error.status === 401 || error.status === 403) {
        this.toastService.error('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.');
        this.router.navigate(['/login']);
      } else if (error.status === 409) {
        this.toastService.error('Cây này đã có trong bộ sưu tập của bạn');
      } else if (error.status === 404) {
        this.toastService.error('Không tìm thấy thông tin cây. Vui lòng chọn cây khác.');
      } else if (error.error?.message) {
        this.toastService.error(`Lỗi: ${error.error.message}`);
      } else {
        this.toastService.error('Không thể thêm cây vào bộ sưu tập. Vui lòng thử lại.');
      }
    }, 0);
  }

  // Lưu trữ file ảnh người dùng chọn
  selectedImages: File[] = [];
  
  // Cache blob URLs to prevent ExpressionChangedAfterItHasBeenCheckedError
  private imagePreviewUrls: Map<File, string> = new Map();

  // Hàm xử lý khi chọn file ảnh
  onImageSelected(event: any): void {
    const files: FileList = event.target.files;
    if (!files || files.length === 0) return;

    // Clear previous selections and URLs
    this.clearImagePreviews();
    this.selectedImages = [];
    
    const maxFileSize = 5 * 1024 * 1024; // 5MB
    const maxImages = 5;
    
    for (let i = 0; i < Math.min(files.length, maxImages); i++) {
      const file = files[i];
      
      // Validate file type
      if (!file.type.startsWith('image/')) {
        this.toastService.error(`File "${file.name}" không phải là ảnh hợp lệ.`);
        continue;
      }
      
      // Validate file size
      if (file.size > maxFileSize) {
        this.toastService.error(`Ảnh "${file.name}" quá lớn. Kích thước tối đa là 5MB.`);
        continue;
      }
      
      this.selectedImages.push(file);
      // Create and cache blob URL
      const previewUrl = URL.createObjectURL(file);
      this.imagePreviewUrls.set(file, previewUrl);
    }
    
    if (files.length > maxImages) {
      this.toastService.warning(`Chỉ được chọn tối đa ${maxImages} ảnh.`);
    }
    
    console.log(`Selected ${this.selectedImages.length} valid images`);
  }

  // Trigger file input click
  triggerFileInput(): void {
    const fileInput = document.getElementById('images') as HTMLInputElement;
    fileInput?.click();
  }

  // Get image preview URL
  getImagePreview(file: File): string {
    return this.imagePreviewUrls.get(file) || '';
  }

  // Clear all image preview URLs
  private clearImagePreviews(): void {
    this.imagePreviewUrls.forEach(url => URL.revokeObjectURL(url));
    this.imagePreviewUrls.clear();
  }

  // Remove image from selection
  removeImage(index: number): void {
    if (index >= 0 && index < this.selectedImages.length) {
      const file = this.selectedImages[index];
      
      // Revoke object URL to prevent memory leaks
      const previewUrl = this.imagePreviewUrls.get(file);
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
        this.imagePreviewUrls.delete(file);
      }
      
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
      this.formData.plantId && 
      this.formData.plantId > 0 &&
      this.formData.nickname && 
      this.formData.nickname.trim().length > 0 &&
      this.formData.plantingDate &&
      this.formData.locationInHouse &&
      this.formData.locationInHouse.length > 0
    );
  }

  // Validation helpers
  getFormErrors(): string[] {
    const errors: string[] = [];
    
    if (!this.formData.plantId || this.formData.plantId <= 0) {
      errors.push('Vui lòng chọn cây hợp lệ');
    }
    
    if (!this.formData.nickname || this.formData.nickname.trim().length === 0) {
      errors.push('Tên cây không được để trống');
    }
    
    if (!this.formData.plantingDate) {
      errors.push('Vui lòng chọn ngày trồng');
    }
    
    if (!this.formData.locationInHouse || this.formData.locationInHouse.length === 0) {
      errors.push('Vui lòng chọn vị trí trồng cây');
    }
    
    return errors;
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

  // Location warning methods
  private shouldShowLocationWarning(): boolean {
    if (!this.plant || !this.plant.suitableLocation || !this.formData.locationInHouse) {
      console.log('No plant data or location info');
      return false;
    }

    const suitableLocation = this.plant.suitableLocation.toLowerCase();
    const selectedLocation = this.formData.locationInHouse.toLowerCase();
    
    console.log('Checking compatibility:', { suitableLocation, selectedLocation });

    // Simple and effective check: if suitable location doesn't contain selected location
    const suitableLocations = suitableLocation.split(',').map(loc => loc.trim());
    const isLocationSuitable = suitableLocations.some(loc => 
      loc.includes(selectedLocation) || selectedLocation.includes(loc.replace(/góc\s*/g, ''))
    );

    console.log('Suitable locations list:', suitableLocations);
    console.log('Is location suitable:', isLocationSuitable);

    if (!isLocationSuitable) {
      console.log('Location not suitable based on direct match');
      return true;
    }

    // Additional specific incompatibility checks
    const incompatibleMappings: { [key: string]: string[] } = {
      // Indoor plants shouldn't go to outdoor locations
      'phòng': ['sân vườn', 'ban công'],
      'trong nhà': ['sân vườn', 'ban công'],
      'indoor': ['sân vườn', 'ban công'],
      
      // Outdoor plants shouldn't go indoors
      'sân vườn': ['phòng khách', 'phòng ngủ', 'phòng bếp', 'phòng làm việc', 'phòng tắm'],
      'ngoài trời': ['phòng khách', 'phòng ngủ', 'phòng bếp', 'phòng làm việc', 'phòng tắm'],
      'outdoor': ['phòng khách', 'phòng ngủ', 'phòng bếp', 'phòng làm việc', 'phòng tắm'],
      
      // Low light plants shouldn't go to bright locations
      'ít sáng': ['ban công', 'sân vườn'],
      'bóng râm': ['ban công', 'sân vườn'],
      'low light': ['ban công', 'sân vườn'],
      
      // Bright light plants shouldn't go to dark locations
      'ánh sáng mạnh': ['phòng tắm', 'hành lang'],
      'nhiều ánh sáng': ['phòng tắm', 'hành lang'],
      'bright': ['phòng tắm', 'hành lang']
    };

    // Check for specific incompatibilities
    for (const [suitableKeyword, incompatibleLocations] of Object.entries(incompatibleMappings)) {
      if (suitableLocation.includes(suitableKeyword)) {
        if (incompatibleLocations.some(loc => selectedLocation.includes(loc))) {
          console.log(`Found incompatibility: ${suitableKeyword} with ${selectedLocation}`);
          return true;
        }
      }
    }

    console.log('No incompatibility found');
    return false;
  }

  showLocationWarningPopup(): void {
    const suitableLocation = this.plant?.suitableLocation || 'không xác định';
    const selectedLocation = this.formData.locationInHouse || 'không xác định';
    
    this.locationWarningMessage = `Lưu ý: Vị trí bạn chọn "${selectedLocation}" có thể không phù hợp với khuyến nghị cho loại cây này "${suitableLocation}". Bạn có muốn tiếp tục không?`;
    this.showLocationWarning = true;
    
    console.log('Warning popup should be visible now:', this.showLocationWarning);
    console.log('Warning message:', this.locationWarningMessage);
    
    // Force change detection to ensure popup appears immediately
    this.cdr.markForCheck();
  }

  confirmLocationWarning(): void {
    this.showLocationWarning = false;
    this.pendingSubmit = true;
    
    // Use setTimeout to ensure state changes are processed
    setTimeout(() => {
      this.onSubmit(); // Continue with submit
    }, 0);
  }

  cancelLocationWarning(): void {
    this.showLocationWarning = false;
    this.pendingSubmit = false;
  }

  // Helper method to determine if submit button should be disabled
  isSubmitDisabled(): boolean {
    return this.loading || !this.isFormValid();
  }
}
