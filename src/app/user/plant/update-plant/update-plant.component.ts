

import { Component, OnInit, OnDestroy, HostListener, ChangeDetectorRef, ViewEncapsulation } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router, ActivatedRoute, NavigationEnd } from '@angular/router';
import { Subject, takeUntil, filter, firstValueFrom } from 'rxjs';
import { TopNavigatorComponent } from '../../../shared/top-navigator/index';
import { MyGardenService, UserPlant, UpdatePlantRequest, ApiResponse } from '../my-garden/my-garden.service';
import { ToastService } from '../../../shared/toast/toast.service';
import { CookieService } from '../../../auth/cookie.service';
import { AuthDialogService } from '../../../auth/auth-dialog.service';

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

  private destroy$ = new Subject<void>();

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private route: ActivatedRoute,
    private myGardenService: MyGardenService,
    private toastService: ToastService,
    private cookieService: CookieService,
    private authDialogService: AuthDialogService,
    private cdr: ChangeDetectorRef
  ) {
    this.updateForm = this.createForm();
    this.currentPlant = null;
  }

    // Dropdown vị trí trong nhà
  locationOptions: string[] = [
    'Phòng khách', 'Ban công', 'Phòng ngủ', 'Nhà bếp', 'Cửa sổ', 'Sân thượng', 'Văn phòng', 'Khác'
  ];

  // Thay thế ảnh cũ tại vị trí i
  // Chỉ cho phép thay thế 1 ảnh duy nhất
  onReplaceImage(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0 && this.currentPlant) {
      const file = input.files[0];
      this.uploadImage(file).then(url => {
        this.currentPlant!.imageUrl = url;
        this.cdr.detectChanges();
      });
    }
  }

  // Thêm ảnh mới vào cuối
  // Chỉ cho phép thêm 1 ảnh duy nhất (giống thay thế)
  onAddImage(event: Event): void {
    this.onReplaceImage(event);
  }

  // Upload ảnh lên server, trả về url
  uploadImage(file: File): Promise<string> {
    // Gọi đúng service uploadPlantImage (kiểu file)
    return this.myGardenService.uploadPlantImage(file)
      .toPromise()
      .then((res: any) => res.data);
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

    // Lưu ảnh (gọi API updateUserPlant với imageUrl mới)
  saveImage(): void {
    if (!this.currentPlant) return;
    const updateData = {
      userPlantId: this.currentPlant.userPlantId.toString(),
      nickname: this.currentPlant.nickname,
      locationInHouse: this.currentPlant.plantLocation,
      plantingDate: (this.currentPlant as any).plantingDate || new Date().toISOString(),
      reminderEnabled: this.currentPlant.reminderEnabled,
      imageUrl: this.currentPlant.imageUrl
    };
    this.isSubmitting = true;
    this.myGardenService.updateUserPlant(updateData as any).subscribe({
      next: () => {
        this.isSubmitting = false;
        this.toastService.success('Lưu ảnh thành công!');
        setTimeout(() => {
          this.router.navigate(['/user/my-garden']);
        }, 1000);
      },
      error: () => {
        this.isSubmitting = false;
        this.toastService.error('Lưu ảnh thất bại!');
      }
    });
  }


  // Lấy tất cả URL ảnh của cây
  getAllPlantImageUrls(): string[] {
    if (!this.currentPlant) return [];
    return this.currentPlant.imageUrl ? [this.currentPlant.imageUrl] : [];
  }

  // Xử lý lỗi ảnh
  onImageError(event: any): void {
    if (event?.target) {
      event.target.src = this.placeholderImage;
      event.target.style.opacity = '0.6';
      event.target.style.objectFit = 'cover';
    }
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
        if (this.userPlantId && this.allUserPlants.length > 0) {
          this.findAndSetCurrentPlant();
        } else if (this.userPlantId) {
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

    // Load all user plants
    this.myGardenService.getUserPlants(0, 100)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.isLoading = false;
          
          if (response && response.data && response.data.content) {
            // Handle paginated response structure
            this.allUserPlants = response.data.content;
            this.findAndSetCurrentPlant();
            this.errorMessage = '';
            this.cdr.markForCheck();
          } 
          // Handle direct response (fallback)
          else if (response && Array.isArray(response)) {
            this.allUserPlants = response;
            this.findAndSetCurrentPlant();
            this.errorMessage = '';
            this.cdr.markForCheck();
          } 
          // No data found
          else {
            this.allUserPlants = [];
            this.currentPlant = null;
            this.errorMessage = 'Không tìm thấy dữ liệu cây';
            this.cdr.markForCheck();
          }
        },
        error: (error) => {
          this.isLoading = false;
          this.allUserPlants = [];
          this.currentPlant = null;
          this.handleLoadError(error);
          this.cdr.markForCheck();
        }
      });
  }

   private findAndSetCurrentPlant(): void {
    if (!this.userPlantId || this.allUserPlants.length === 0) {
      this.currentPlant = null;
      this.errorMessage = 'Không tìm thấy thông tin cây';
      return;
    }

    this.currentPlant = this.allUserPlants.find(p => String(p.userPlantId) === String(this.userPlantId)) || null;
    
    if (this.currentPlant) {
      this.populateForm();
      this.errorMessage = '';
      // Reset image index khi thay đổi cây
      this.currentImageIndex = 0;
    } else {
      this.errorMessage = 'Không tìm thấy cây để chỉnh sửa';
      this.toastService.error('Không tìm thấy cây để chỉnh sửa');
    }
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

    // Set current date as default planting date since we don't have it from API
    const currentDate = new Date().toISOString().split('T')[0];

    this.updateForm.patchValue({
      nickname: this.currentPlant.nickname || '',
      plantingDate: currentDate, // Default to today since API doesn't provide planting date
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
    // Convert date to ISO format 'YYYY-MM-DDTHH:mm:ss'
    let plantingDateFormatted: string;
    if (formValues.plantingDate) {
      const dateValue = formValues.plantingDate;
      let dateObj: Date;
      if (typeof dateValue === 'string' && dateValue.match(/^\d{4}-\d{2}-\d{2}$/)) {
        // YYYY-MM-DD format
        dateObj = new Date(dateValue + 'T00:00:00');
      } else {
        dateObj = new Date(dateValue);
      }
      if (isNaN(dateObj.getTime())) {
        console.warn('Invalid date provided, using current date');
        dateObj = new Date();
      }
      // Format: YYYY-MM-DDTHH:mm:ss (ISO 8601, no timezone)
      const yyyy = dateObj.getFullYear();
      const mm = String(dateObj.getMonth() + 1).padStart(2, '0');
      const dd = String(dateObj.getDate()).padStart(2, '0');
      plantingDateFormatted = `${yyyy}-${mm}-${dd}T00:00:00`;
    } else {
      const now = new Date();
      const yyyy = now.getFullYear();
      const mm = String(now.getMonth() + 1).padStart(2, '0');
      const dd = String(now.getDate()).padStart(2, '0');
      plantingDateFormatted = `${yyyy}-${mm}-${dd}T00:00:00`;
    }

    const processedData: UpdatePlantRequest = {
      userPlantId: this.userPlantId!.toString().trim(),
      nickname: (formValues.nickname || '').toString().trim(),
      locationInHouse: (formValues.locationInHouse || '').toString().trim(),
      plantingDate: plantingDateFormatted, // 'YYYY-MM-DD 00:00:00'
      reminderEnabled: Boolean(formValues.reminderEnabled)
    };

    console.log('Form data processing:');
    console.log('- Original date:', formValues.plantingDate);
    console.log('- Formatted:', plantingDateFormatted);
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
    this.isSubmitting = false;
    // Khi cập nhật ảnh mới, luôn clear toàn bộ ảnh cũ trên UI
    if (this.selectedImages && this.selectedImages.length > 0 && this.currentPlant) {
      (this.currentPlant as any).imageUrls = [];
      (this.currentPlant as any).images = [];
    }
    this.selectedImages = [];
    this.imagePreviewUrls.clear();
    
    this.toastService.success('Cập nhật thông tin cây thành công!');
    
    // Refresh plant data to show updated info
    this.loadPlantData();
    
    // Optionally navigate back
    setTimeout(() => {
      this.router.navigate(['/user/my-garden']);
    }, 1500);
  }

  private handleUpdateError(errorMessage: string): void {
    this.isSubmitting = false;
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
}
