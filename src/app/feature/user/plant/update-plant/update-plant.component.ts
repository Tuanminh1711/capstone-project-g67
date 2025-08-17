import { Component, OnInit, OnDestroy, HostListener, ChangeDetectorRef, ViewEncapsulation, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router, ActivatedRoute, NavigationEnd } from '@angular/router';
import { Subject, takeUntil, filter, firstValueFrom } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { TopNavigatorComponent } from '../../../../shared/top-navigator/index';
import { MyGardenService, UserPlant, UpdatePlantRequest, ApiResponse } from '../my-garden/my-garden.service';
import { ToastService } from '../../../../shared/toast/toast.service';
import { ImageUrlService } from '../../../../shared/services/image-url.service';
import { CookieService } from '../../../../auth/cookie.service';
import { AuthDialogService } from '../../../../auth/auth-dialog.service';
import { environment } from '../../../../../environments/environment';
import { PlantOptionsService, PlantOption } from '../../../../shared/services/plant-options.service';

@Component({
  selector: 'app-update-plant',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, TopNavigatorComponent],
  templateUrl: './update-plant.component.html',
  styleUrls: ['./update-plant.component.scss'],
  encapsulation: ViewEncapsulation.None
})
export class UpdatePlantComponent implements OnInit, OnDestroy {
  updateForm: FormGroup;
  isLoading = false;
  isSubmitting = false;
  isUpdatingImages = false; // Thêm biến cho việc cập nhật ảnh riêng
  errorMessage = '';
  userPlantId: string | null = null;
  currentPlant: UserPlant | null = null;
  allUserPlants: UserPlant[] = [];
  
  // Thêm các biến quản lý ảnh
  currentImageIndex = 0;
  placeholderImage = '';

  // Biến quản lý upload ảnh mới
  selectedImages: File[] = [];
  private imagePreviewUrls: Map<File, string> = new Map();

  // Sử dụng service để lấy options
  locationOptions: PlantOption[] = [];

  private destroy$ = new Subject<void>();

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private route: ActivatedRoute,
    private http: HttpClient,
    private myGardenService: MyGardenService,
    private toastService: ToastService,
    private cookieService: CookieService,
    private authDialogService: AuthDialogService,
    private imageUrlService: ImageUrlService,
    private cdr: ChangeDetectorRef,
    private plantOptionsService: PlantOptionsService
  ) {
    this.updateForm = this.createForm();
    this.currentPlant = null;
  }

  // Các phương thức hiển thị ảnh
  get currentImage(): string {
    const images = this.getAllPlantImageUrls();
    if (images.length === 0) return this.placeholderImage;
    return images[this.currentImageIndex];
  }

  get hasMultipleImages(): boolean {
    return this.getAllPlantImageUrls().length > 1;
  }

  nextImage(): void {
    const images = this.getAllPlantImageUrls();
    if (images.length === 0) return;
    this.currentImageIndex = (this.currentImageIndex + 1) % images.length;
  }

  prevImage(): void {
    const images = this.getAllPlantImageUrls();
    if (images.length === 0) return;
    this.currentImageIndex = (this.currentImageIndex - 1 + images.length) % images.length;
  }

  selectImage(index: number): void {
    const images = this.getAllPlantImageUrls();
    if (index >= 0 && index < images.length) {
      this.currentImageIndex = index;
    }
  }

  // Lấy tất cả URL ảnh của cây từ API response
  getAllPlantImageUrls(): string[] {
    if (!this.currentPlant) {
      console.log('🚫 No currentPlant data');
      return [];
    }
    
    console.log('🌿 Current plant data:', this.currentPlant);
    
    // Ưu tiên trường imageUrls từ API chi tiết
    let imageUrls: string[] = [];
    if (Array.isArray(this.currentPlant.imageUrls)) {
      imageUrls = this.currentPlant.imageUrls.filter(url => !!url);
      console.log('📸 Image URLs from imageUrls field:', imageUrls);
    } 
    // Fallback cho trường images nếu imageUrls không có
    else if (Array.isArray(this.currentPlant.images)) {
      imageUrls = this.currentPlant.images
        .map((img: any) => img?.imageUrl)
        .filter((url: string) => !!url);
      console.log('📸 Image URLs from images field:', imageUrls);
    }
    
    console.log('✅ Final image URLs:', imageUrls);
    return imageUrls.length > 0 ? imageUrls : [];
  }

  // Xử lý lỗi ảnh
  onImageError(event: any): void {
    this.imageUrlService.onImageError(event);
  }

  // === IMAGE UPLOAD METHODS ===
  
  // Hàm xử lý khi chọn file ảnh mới
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
    
    console.log(`Selected ${this.selectedImages.length} valid images for update`);
  }

  // Trigger file input click
  triggerFileInput(): void {
    const fileInput = document.getElementById('update-images') as HTMLInputElement;
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
  removeSelectedImage(index: number): void {
    if (index >= 0 && index < this.selectedImages.length) {
      const file = this.selectedImages[index];
      
      // Revoke object URL to prevent memory leaks
      const previewUrl = this.imagePreviewUrls.get(file);
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
        this.imagePreviewUrls.delete(file);
      }
      
      this.selectedImages.splice(index, 1);
      console.log('Removed image from update selection, remaining:', this.selectedImages.length);
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

  // Clear all selected images
  clearSelectedImages(): void {
    // Clean up preview URLs to prevent memory leaks
    this.selectedImages.forEach(file => {
      const url = this.imagePreviewUrls.get(file);
      if (url) {
        URL.revokeObjectURL(url);
      }
    });
    
    this.selectedImages = [];
    this.imagePreviewUrls.clear();
    console.log('Cleared all selected images');
  }

  // Get total file size of selected images
  getTotalFileSize(): string {
    const totalBytes = this.selectedImages.reduce((total, file) => total + file.size, 0);
    return this.formatFileSize(totalBytes);
  }

  // Phần còn lại giữ nguyên...
  ngOnInit(): void {
    if (!this.checkAuthenticationSafely()) {
      this.currentPlant = null;
      this.allUserPlants = [];
    }

    setTimeout(() => {
      this.initializeComponent();
    }, 100);

    this.route.params
      .pipe(takeUntil(this.destroy$))
      .subscribe(params => {
        this.userPlantId = params['id'];
        if (this.userPlantId) {
          this.initializeComponent();
        }
      });

    this.router.events
      .pipe(
        filter(event => event instanceof NavigationEnd),
        takeUntil(this.destroy$)
      )
      .subscribe(() => {
        if (this.router.url.includes('/update-plant')) {
          this.initializeComponent();
        }
      });

    this.authDialogService.loginSuccess$
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        setTimeout(() => {
          this.initializeComponent();
        }, 300);
      });

    this.loadLocationOptions();
  }

  ngOnDestroy(): void {
    // Clear image preview URLs to prevent memory leaks
    this.clearImagePreviews();
    
    this.destroy$.next();
    this.destroy$.complete();
  }

  private checkAuthentication(): boolean {
    try {
      const token = this.cookieService.getAuthToken();
      return token !== null && token.trim().length > 0;
    } catch (error) {
      return false;
    }
  }

  private checkAuthenticationSafely(): boolean {
    try {
      // Check if document is ready
      if (typeof document === 'undefined') {
        return false;
      }
      
      const token = this.cookieService.getAuthToken();
      return token !== null && token.trim().length > 0;
    } catch (error) {
      console.warn('Error checking authentication:', error);
      return false;
    }
  }

  get isLoggedIn(): boolean {
    return this.checkAuthenticationSafely();
  }

  private createForm(): FormGroup {
    return this.fb.group({
      nickname: ['', [Validators.required, Validators.minLength(1), Validators.maxLength(100)]],
      plantingDate: ['', [Validators.required]],
      locationInHouse: ['', [Validators.required, Validators.minLength(1), Validators.maxLength(50)]],
      reminderEnabled: [false]
    });
  }

  private initializeComponent(): void {
    // Verify authentication and call API
    const isAuthenticated = this.checkAuthenticationSafely();
    
    if (!isAuthenticated) {
      // Clear data immediately if not logged in
      this.currentPlant = null;
      this.allUserPlants = [];
      this.isLoading = false;
      
      // Retry check token after 200ms to ensure cookie has loaded
      setTimeout(() => {
        const retryAuth = this.checkAuthenticationSafely();
        if (!retryAuth) {
          this.errorMessage = 'Bạn chưa đăng nhập';
          this.toastService.warning('Vui lòng đăng nhập để chỉnh sửa cây');
          this.router.navigate(['/']);
          this.cdr.detectChanges();
        } else {
          // Token available after retry, call API
          this.loadPlantDataImmediate();
        }
      }, 200);
      return;
    }

    // Clear error when we have token
    this.errorMessage = '';
    
    // Call API to load data immediately
    this.loadPlantDataImmediate();
  }

  private loadPlantDataImmediate(): void {
    // Set loading state
    this.isLoading = true;
    this.errorMessage = '';

    // Sử dụng API giống view-user-plant-detail để lấy thông tin chi tiết
    if (!this.userPlantId) {
      this.errorMessage = 'ID cây không hợp lệ';
      this.isLoading = false;
      return;
    }

    this.http.get<any>(`/api/user-plants/user-plant-detail/${this.userPlantId}`)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.isLoading = false;
          
          if (response && response.data) {
            // Map API response giống view-user-plant-detail
            this.currentPlant = this.mapApiResponseToUserPlant(response.data);
            this.populateForm();
            this.errorMessage = '';
            // Reset image index khi thay đổi cây
            this.currentImageIndex = 0;
            this.cdr.markForCheck();
          } else {
            this.currentPlant = null;
            this.errorMessage = 'Không tìm thấy thông tin cây';
            this.cdr.markForCheck();
          }
        },
        error: (error) => {
          this.isLoading = false;
          this.currentPlant = null;
          this.handleLoadError(error);
          this.cdr.markForCheck();
        }
      });
  }

  // Map API response giống view-user-plant-detail
  private mapApiResponseToUserPlant(apiData: any): UserPlant {
    return {
      userPlantId: apiData.userPlantId,
      nickname: apiData.nickname || apiData.commonName || '',
      imageUrls: apiData.imageUrls || apiData.images?.map((img: any) => img.imageUrl) || [],
      plantingDate: apiData.plantingDate || '', // Thêm field này
      plantLocation: apiData.locationInHouse || '',
      reminderEnabled: apiData.reminderEnabled ?? false,
      images: apiData.images || [],
      imageUrl: (apiData.imageUrls && apiData.imageUrls.length > 0) ? apiData.imageUrls[0] : '',
      // Thêm các fields khác nếu cần
      plantId: apiData.plantId,
      userId: apiData.userId,
      createdAt: apiData.createdAt
    } as UserPlant;
  }

  private handleLoadError(error: any): void {
    switch(error.status) {
      case 404:
        this.errorMessage = 'Không tìm thấy thông tin cây của bạn.';
        break;
      case 401:
      case 403:
        this.errorMessage = 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.';
        setTimeout(() => {
          this.handleAuthRequired();
        }, 1000);
        break;
      case 0:
        this.errorMessage = 'Không thể kết nối đến server. Vui lòng kiểm tra kết nối mạng.';
        break;
      case 500:
        this.errorMessage = 'Lỗi server nội bộ. Vui lòng thử lại sau.';
        break;
      default:
        this.errorMessage = 'Đã có lỗi xảy ra khi tải dữ liệu. Vui lòng thử lại.';
    }
    
    this.toastService.error(this.errorMessage);
  }

  // Method to handle user action when not logged in
  private handleAuthRequired(): void {
    this.toastService.warning('Vui lòng đăng nhập để chỉnh sửa cây');
    this.authDialogService.openLoginDialog();
  }

  // Public method for template to call - reload data
  loadPlantData(): void {
    this.initializeComponent();
  }

  private populateForm(): void {
    if (!this.currentPlant) return;

    // Format planting date for HTML date input (YYYY-MM-DD)
    let plantingDateFormatted = '';
    if (this.currentPlant.plantingDate) {
      try {
        const date = new Date(this.currentPlant.plantingDate);
        if (!isNaN(date.getTime())) {
          plantingDateFormatted = date.toISOString().split('T')[0];
        } else {
          console.warn('Invalid planting date from API:', this.currentPlant.plantingDate);
          plantingDateFormatted = new Date().toISOString().split('T')[0];
        }
      } catch (error) {
        console.warn('Error parsing planting date:', error);
        plantingDateFormatted = new Date().toISOString().split('T')[0];
      }
    } else {
      // Default to today if no planting date provided
      plantingDateFormatted = new Date().toISOString().split('T')[0];
    }

    this.updateForm.patchValue({
      nickname: this.currentPlant.nickname || '',
      plantingDate: plantingDateFormatted,
      locationInHouse: this.currentPlant.plantLocation || '',
      reminderEnabled: this.currentPlant.reminderEnabled || false
    });
  }

  onSubmit(): void {
    if (this.updateForm.invalid || !this.userPlantId) {
      this.markFormGroupTouched();
      return;
    }

    this.isSubmitting = true;
    this.errorMessage = '';

    const formValues = this.updateForm.value;
    
    // Process and normalize data in component
    const processedData = this.processFormData(formValues);

    console.log('Updating plant with processed data:', processedData);

    // Check if there are new images to upload
    if (this.selectedImages && this.selectedImages.length > 0) {
      console.log('Updating plant with new images using new API...');
      this.updatePlantWithImages(processedData);
    } else {
      console.log('Updating plant info only (no new images)...');
      this.updatePlantInfo(processedData);
    }
  }

  private processFormData(formValues: any): UpdatePlantRequest {
    // Convert date to ISO 8601 format for backend
    let plantingDateFormatted: string;
    if (formValues.plantingDate) {
      const dateValue = formValues.plantingDate;
      let dateObj: Date;
      if (typeof dateValue === 'string' && dateValue.match(/^\d{4}-\d{2}-\d{2}$/)) {
        // YYYY-MM-DD format from HTML date input
        dateObj = new Date(dateValue + 'T00:00:00');
      } else {
        dateObj = new Date(dateValue);
      }
      if (isNaN(dateObj.getTime())) {
        console.warn('Invalid date provided, using current date');
        dateObj = new Date();
      }
      // Format for java.sql.Timestamp: yyyy-MM-dd HH:mm:ss.SSS
      plantingDateFormatted = this.formatToJavaTimestamp(dateObj);
    } else {
      const now = new Date();
      plantingDateFormatted = this.formatToJavaTimestamp(now);
    }

    const processedData: UpdatePlantRequest = {
      userPlantId: this.userPlantId!.toString().trim(),
      nickname: (formValues.nickname || '').toString().trim(),
      locationInHouse: (formValues.locationInHouse || '').toString().trim(),
      plantingDate: plantingDateFormatted, // java.sql.Timestamp format for backend
      reminderEnabled: Boolean(formValues.reminderEnabled)
    };

    console.log('Form data processing:');
    console.log('- Original date:', formValues.plantingDate);
    console.log('- Formatted (java.sql.Timestamp):', plantingDateFormatted);
    console.log('- Processed data:', processedData);
    return processedData;
  }

  private updatePlantWithImages(updateData: UpdatePlantRequest): void {
    console.log('Using new update-with-images API...');
    this.myGardenService.updateUserPlantWithImages(updateData, this.selectedImages)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          console.log('Plant updated with images successfully:', response);
          
          if (response && (response.status === 200 || response.message?.includes('success') || response.message?.includes('thành công'))) {
            this.handleSuccessfulUpdate();
          } else {
            console.error('Unexpected response format:', response);
            this.handleUpdateError('Phản hồi từ server không đúng định dạng');
          }
        },
        error: (error) => {
          console.error('Error updating plant with images:', error);
          this.handleUpdateError(this.extractErrorMessage(error));
        }
      });
  }

  private async uploadImagesAndUpdatePlant(updateData: UpdatePlantRequest): Promise<void> {
    try {
      // This method is now deprecated in favor of updatePlantWithImages
      console.warn('uploadImagesAndUpdatePlant is deprecated, use updatePlantWithImages instead');
      this.updatePlantWithImages(updateData);
    } catch (error) {
      console.error('Error in deprecated uploadImagesAndUpdatePlant:', error);
      this.handleUpdateError('Có lỗi xảy ra khi cập nhật thông tin cây');
    }
  }

  private handleSuccessfulUpdate(): void {
    // Reset form states
    this.isSubmitting = false;
    this.isUpdatingImages = false;
    
    // Clear image states if we updated images
    if (this.selectedImages && this.selectedImages.length > 0 && this.currentPlant) {
      // Clear old images from display
      (this.currentPlant as any).imageUrls = [];
      (this.currentPlant as any).images = [];
    }
    
    // Clear form image state
    this.selectedImages = [];
    this.imagePreviewUrls.clear();
    
    // Show success message
    this.toastService.success('Cập nhật thông tin cây thành công!');
    
    // Navigate after a delay
    setTimeout(() => {
      if (this.userPlantId) {
        this.router.navigate(['/user/user-plant-detail', this.userPlantId]);
      } else {
        this.router.navigate(['/my-garden']);
      }
    }, 1500);
  }

  private handleUpdateError(errorMessage: string): void {
    this.isSubmitting = false;
    this.isUpdatingImages = false;
    this.toastService.error(errorMessage);
  }

  private extractErrorMessage(error: any): string {
    console.error('Full error object:', error);
    
    let errorMessage = 'Không thể cập nhật thông tin cây';
    
    // More detailed error handling
    if (error.status === 400) {
      if (error.error?.message) {
        errorMessage = `Dữ liệu không hợp lệ: ${error.error.message}`;
      } else {
        errorMessage = 'Dữ liệu gửi lên không đúng định dạng. Vui lòng kiểm tra lại thông tin.';
      }
    } else if (error.status === 401) {
      errorMessage = 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.';
    } else if (error.status === 404) {
      errorMessage = 'Không tìm thấy cây để cập nhật.';
    } else if (error.status === 413) {
      errorMessage = 'Kích thước ảnh quá lớn. Vui lòng chọn ảnh nhỏ hơn.';
    } else if (error.status === 500) {
      errorMessage = 'Lỗi server. Vui lòng thử lại sau.';
    } else if (error.error?.message) {
      errorMessage = error.error.message;
    } else if (error.message) {
      errorMessage = error.message;
    }
    
    return errorMessage;
  }

  private updatePlantInfo(updateData: UpdatePlantRequest): void {
    this.myGardenService.updateUserPlant(updateData)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          console.log('Plant info updated successfully:', response);
          
          if (response && (response.status === 200 || response.message?.includes('success') || response.message?.includes('thành công'))) {
            this.handleSuccessfulUpdate();
          } else {
            console.error('Unexpected response format:', response);
            this.handleUpdateError('Phản hồi từ server không đúng định dạng');
          }
        },
        error: (error) => {
          console.error('Error updating plant info:', error);
          this.handleUpdateError(this.extractErrorMessage(error));
        }
      });
  }

  private markFormGroupTouched(): void {
    Object.keys(this.updateForm.controls).forEach(key => {
      const control = this.updateForm.get(key);
      control?.markAsTouched();
    });
  }

  // Form validation helpers
  isFieldInvalid(fieldName: string): boolean {
    const field = this.updateForm.get(fieldName);
    return !!(field && field.invalid && (field.dirty || field.touched));
  }

  getFieldError(fieldName: string): string {
    const field = this.updateForm.get(fieldName);
    if (field && field.errors && (field.dirty || field.touched)) {
      if (field.errors['required']) {
        return `${this.getFieldDisplayName(fieldName)} là bắt buộc`;
      }
      if (field.errors['minlength']) {
        return `${this.getFieldDisplayName(fieldName)} quá ngắn`;
      }
      if (field.errors['maxlength']) {
        return `${this.getFieldDisplayName(fieldName)} quá dài`;
      }
    }
    return '';
  }

  private getFieldDisplayName(fieldName: string): string {
    const displayNames: { [key: string]: string } = {
      'nickname': 'Tên gọi',
      'plantingDate': 'Ngày trồng',
      'locationInHouse': 'Vị trí trong nhà',
      'reminderEnabled': 'Nhắc nhở'
    };
    return displayNames[fieldName] || fieldName;
  }

  // Method to refresh data when needed
  onPageVisible(): void {
    // Clear failed images cache when user returns to page
    this.imageUrlService.clearFailedImagesCache();
    
    // Test URL fixing functionality in development
    if (!environment.production) {
      this.imageUrlService.testUrlFix();
    }
    
    // Reload data if we don't have data or there's an error
    if (!this.isLoading && (!this.currentPlant || this.errorMessage)) {
      this.initializeComponent();
    }
  }

  @HostListener('window:focus', ['$event'])
  onWindowFocus(event: any): void {
    // Auto refresh when window is focused again
    this.onPageVisible();
  }

  updateImagesOnly(): void {
    if (!this.selectedImages || this.selectedImages.length === 0 || !this.userPlantId) {
      this.toastService.error('Vui lòng chọn ít nhất một ảnh để cập nhật');
      return;
    }

    this.isUpdatingImages = true;
    this.errorMessage = '';
    
    // Get current form values to preserve other data
    const currentFormValues = this.updateForm.value;
    const processedData = this.processFormData(currentFormValues);
    
    // Update plant with new images using proper async handling
    this.updatePlantWithImages(processedData);
  }

  /**
   * Format Date to java.sql.Timestamp compatible string
   * Format: yyyy-MM-dd HH:mm:ss.SSS
   */
  private formatToJavaTimestamp(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');
    const milliseconds = String(date.getMilliseconds()).padStart(3, '0');
    
    return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}.${milliseconds}`;
  }

  /**
   * Get processed image URL using ImageUrlService
   */
  getImageUrl(imageUrl: string): string {
    console.log('🖼️ [UpdatePlant] Processing image URL:', imageUrl);
    const processedUrl = this.imageUrlService.getImageUrl(imageUrl);
    console.log('🖼️ [UpdatePlant] Processed URL:', processedUrl);
    return processedUrl;
  }

  private loadLocationOptions(): void {
    this.locationOptions = this.plantOptionsService.getSuitableLocationOptions();
  }
}
