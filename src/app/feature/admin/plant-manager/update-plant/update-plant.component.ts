
import { environment } from '../../../../../environments/environment';
import { Component, OnInit, OnDestroy, ChangeDetectorRef, inject, NgZone } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { Subject, takeUntil } from 'rxjs';
import { AdminLayoutComponent } from '../../shared/admin-layout/admin-layout.component';
import { ToastService } from '../../../../shared/toast/toast.service';
import { BaseAdminListComponent } from '../../shared/base-admin-list.component';
import { PlantOptionsService, PlantOption } from '../../../../shared/services/plant-options.service';
import { AdminCreatePlantService, PlantCategory } from '../create-plant/admin-create-plant.service';

interface UpdatePlantRequest {
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

interface PlantImage {
  id: number;
  imageUrl: string;
  isPrimary: boolean;
}

interface Plant {
  id: number;
  scientificName: string;
  commonName: string;
  categoryId?: number;
  categoryName?: string;
  description: string;
  careInstructions: string;
  lightRequirement: string;
  waterRequirement: string;
  careDifficulty: string;
  suitableLocation: string;
  commonDiseases: string;
  status: string;
  statusDisplay?: string;
  imageUrls: string[];
  images: PlantImage[];
  createdAt: string | null;
  updatedAt?: string | null;
}

interface ApiResponse<T = any> {
  success?: boolean;
  status?: number;
  message: string;
  data: T;
}

@Component({
  selector: 'app-update-plant',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './update-plant.component.html',
  styleUrls: ['./update-plant.component.scss']
})
export class UpdatePlantComponent extends BaseAdminListComponent implements OnInit, OnDestroy {
  // Toast service instance
  private toast = inject(ToastService);
  
  // Helper to get correct image src from BE filename or url
  getPlantImageSrc(imageUrl: string): string {
    if (!imageUrl) return '';
    // Nếu là ảnh ngoài (http/https không phải nội bộ BE) hoặc là Azure blob thì trả về nguyên url
    if (/^https?:\/\//.test(imageUrl)) {
      // Nếu là Azure blob thì trả về luôn
      if (imageUrl.includes('plantcarestorage.blob.core.windows.net')) {
        return imageUrl;
      }
      // Nếu là ảnh ngoài (không phải BE) cũng trả về luôn
      return imageUrl;
    }
    // Nếu là BE trả về filename thì lấy filename cuối cùng
    let filename = imageUrl;
    if (imageUrl.includes('/')) filename = imageUrl.split('/').pop() || imageUrl;
    return `/api/manager/plants/${filename}`;
  }
  private destroy$ = new Subject<void>();
  private readonly baseUrl = `${environment.apiUrl}/manager`;

  plantId: number = 0;
  plant: Plant | null = null;
  isUpdating = false;
  selectedNewImageFile: File | null = null;
  newImagePreviewUrl: string | null = null;
  isUploadingImage: boolean = false;
  // loading, error, and success state handled by BaseAdminListComponent
  validationErrors: string[] = [];
  sidebarCollapsed = false;

  updateForm: UpdatePlantRequest = {
    scientificName: '',
    commonName: '',
    categoryId: 1,
    description: '',
    careInstructions: '',
    lightRequirement: 'MEDIUM',
    waterRequirement: 'MEDIUM',
    careDifficulty: 'MODERATE',
    suitableLocation: '',
    commonDiseases: '',
    status: 'ACTIVE'
  };

  // Sử dụng service để lấy options
  lightRequirementOptions: PlantOption[] = [];
  waterRequirementOptions: PlantOption[] = [];
  careDifficultyOptions: PlantOption[] = [];
  statusOptions: PlantOption[] = [];
  suitableLocationOptions: PlantOption[] = [];
  categories: PlantCategory[] = [];

  // Thêm biến để xử lý vị trí phù hợp (chọn nhiều)
  selectedLocations: string[] = [];

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private http: HttpClient,
    private cdr: ChangeDetectorRef,
    private zone: NgZone = inject(NgZone),
    private plantOptionsService: PlantOptionsService,
    private createPlantService: AdminCreatePlantService
  ) {
    super();
  }

  ngOnInit(): void {
    this.loadPlantOptions();
    this.loadCategories();
    this.route.params.pipe(takeUntil(this.destroy$)).subscribe(params => {
      const id = params['id'];
      if (id && !isNaN(+id)) {
        this.plantId = +id;
        this.loadPlantData();
        this.selectedNewImageFile = null;
        this.isUploadingImage = false;
      } else {
        this.setError('Invalid plant ID');
        this.navigateBack();
      }
    });
    this.setLoading(true);
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    this.cleanupSubscriptions();
  }

    // Track if form is dirty (user has made changes)
  formDirty = false;

  // Mark form as dirty on any field change
  onFieldChange(): void {
    this.formDirty = true;
  }
  // Add method to redirect to working edit page if API doesn't work
  redirectToEditPage(): void {
    this.toast.info('Chuyển đến trang chỉnh sửa cây.');
    this.router.navigate(['/admin/plants/edit', this.plantId]);
  }
  

  private loadPlantData(): void {
    this.setLoading(true);
    this.setError('');
    this.setSuccess('');
    const apiUrl = `/api/manager/plant-detail/${this.plantId}`;
    this.http.get<any>(apiUrl)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.setLoading(false);
          if (response && response.data) {
            // Ensure images is always an array of PlantImage
            const data = response.data;
            data.images = Array.isArray(data.images) ? data.images : [];
            this.plant = data;
            this.populateForm(data);
          } else if (response) {
            const data = response;
            data.images = Array.isArray(data.images) ? data.images : [];
            this.plant = data;
            this.populateForm(data);
          } else {
            this.setError('No plant data found');
          }
          this.cdr.detectChanges();
        },
        error: (error) => {
          this.setLoading(false);
          this.setError('Không thể tải thông tin cây.');
          this.cdr.detectChanges();
        }
      });
  }

  private loadPlantOptions(): void {
    this.lightRequirementOptions = this.plantOptionsService.getLightRequirementOptions();
    this.waterRequirementOptions = this.plantOptionsService.getWaterRequirementOptions();
    this.careDifficultyOptions = this.plantOptionsService.getCareDifficultyOptions();
    this.statusOptions = this.plantOptionsService.getStatusOptions();
    this.suitableLocationOptions = this.plantOptionsService.getSuitableLocationOptions();
  }

  private async loadCategories(): Promise<void> {
    try {
      const res = await this.createPlantService.getCategories();
      if (res && Array.isArray((res as any).data)) {
        this.categories = (res as any).data;
      } else if (Array.isArray(res)) {
        this.categories = res;
      } else {
        this.categories = [];
      }
      this.cdr.markForCheck();
    } catch (error) {
      this.toast.error('Không thể tải danh sách danh mục');
      Promise.resolve().then(() => {
        this.categories = [];
        this.cdr.markForCheck();
      });
    }
  }

  // Handle file input change for new image
  onNewImageFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.selectedNewImageFile = input.files[0];
      // Hiện preview
      const reader = new FileReader();
      reader.onload = (e: any) => {
        this.newImagePreviewUrl = e.target.result;
        this.cdr.detectChanges();
      };
      reader.readAsDataURL(this.selectedNewImageFile);
    } else {
      this.selectedNewImageFile = null;
      this.newImagePreviewUrl = null;
    }
  }

  // Upload new image for plant (max 3 images, if 3 then remove first, set new as primary)
  onUploadNewImage(): void {
    if (!this.plantId || !this.selectedNewImageFile) {
      this.toast.error('Vui lòng chọn ảnh để tải lên.');
      return;
    }
    if (!this.plant) return;
    const images = Array.isArray(this.plant.images) ? this.plant.images : [];
    const formData = new FormData();
    formData.append('images', this.selectedNewImageFile);
    let deleteImageIds: number[] = [];
    let setPrimaryImageId: number | null = null;
    // Nếu đã đủ 3 ảnh, xóa ảnh đầu tiên
    if (images.length >= 3) {
      deleteImageIds = [images[0].id];
    }
    // Khi upload ảnh mới, sẽ set nó làm primary (BE sẽ trả về id mới, FE reload lại)
    // Gửi request
    this.isUploadingImage = true;
    this.setError('');
    this.setSuccess('');
    const apiUrl = `/api/manager/update-plant-images/${this.plantId}`;
    formData.append('deleteImageIds', deleteImageIds.join(','));
    // setPrimaryImageId sẽ được set sau khi upload xong (nếu BE cần, có thể truyền null)
    this.http.put<ApiResponse>(apiUrl, formData)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.zone.run(() => {
            this.isUploadingImage = false;
            if (response && (response.success === true || response.status === 200)) {
              this.toast.success('Tải ảnh lên thành công!');
              this.setSuccess('Tải ảnh lên thành công!');
              this.selectedNewImageFile = null;
              this.newImagePreviewUrl = null;
              this.loadPlantData();
            } else {
              this.toast.error(response.message || 'Tải ảnh lên thất bại!');
              this.setError(response.message || 'Tải ảnh lên thất bại!');
            }
            this.cdr.detectChanges();
          });
        },
        error: (error) => {
          this.zone.run(() => {
            this.isUploadingImage = false;
            let msg = 'Có lỗi xảy ra khi tải ảnh lên!';
            if (error && error.error && error.error.message) {
              msg = error.error.message;
            }
            this.toast.error(msg);
            this.setError(msg);
            this.cdr.detectChanges();
          });
        }
      });
  }

  // handleApiError is now handled by setError above

  private populateForm(plant: any): void {
    // Handle the plant detail interface like view-plant component
    this.updateForm = {
      scientificName: plant.scientificName || '',
      commonName: plant.commonName || '',
      categoryId: plant.categoryId || 1,
      description: plant.description || '',
      careInstructions: plant.careInstructions || '',
      lightRequirement: plant.lightRequirement || 'MEDIUM',
      waterRequirement: plant.waterRequirement || 'MEDIUM',
      careDifficulty: plant.careDifficulty || 'MODERATE',
      suitableLocation: plant.suitableLocation || '',
      commonDiseases: plant.commonDiseases || '',
      status: plant.status || 'ACTIVE'
    };
    
    // Khởi tạo selectedLocations từ suitableLocation
    if (plant.suitableLocation) {
      this.selectedLocations = plant.suitableLocation.split(',').map((loc: string) => loc.trim()).filter((loc: string) => loc);
    } else {
      this.selectedLocations = [];
    }
    
    this.toast.info('Thông tin cây đã được nạp vào form.');
  }

  onSubmit(): void {
    console.log('Form submitted, checking validation...');
    console.log('Current form data:', this.updateForm);
    
    if (!this.validateForm()) {
      this.toast.error('Vui lòng điền đầy đủ thông tin bắt buộc.');
      return;
    }

    // Submit form trực tiếp
    console.log('Submitting form...');
    this.submitForm();
  }



  // Method submit form gốc
  private submitForm(): void {
    console.log('Submitting form with data:', this.updateForm);
    console.log('Category ID being sent:', this.updateForm.categoryId);
    
    this.isUpdating = true;
    this.setError('');
    this.setSuccess('');
    
    this.http.put<ApiResponse<Plant>>(`${this.baseUrl}/update-plant/${this.plantId}`, this.updateForm)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          console.log('Update response:', response);
          this.isUpdating = false;
          if (response && (response.success === true || response.status === 200)) {
            // Sử dụng setTimeout với delay lớn hơn để tránh ExpressionChangedAfterItHasBeenCheckedError
            setTimeout(() => {
              this.setSuccess('Cập nhật cây thành công!');
              this.toast.success('Cập nhật cây thành công!');
            }, 100);
            setTimeout(() => {
              this.navigateBack();
            }, 1500);
          } else {
            // Sử dụng setTimeout với delay lớn hơn để tránh ExpressionChangedAfterItHasBeenCheckedError
            setTimeout(() => {
              this.setError(response.message || 'Cập nhật thất bại!');
              this.toast.error(response.message || 'Cập nhật thất bại!');
            }, 100);
          }
        },
        error: (error) => {
          console.error('Update error:', error);
          this.isUpdating = false;
          // Sử dụng setTimeout với delay lớn hơn để tránh ExpressionChangedAfterItHasBeenCheckedError
          setTimeout(() => {
            this.setError('Có lỗi xảy ra khi cập nhật!');
            this.toast.error('Có lỗi xảy ra khi cập nhật!');
          }, 100);
        }
      });
  }

  private validateForm(): boolean {
    // Require all fields, show toast if any is missing/invalid
    const f = this.updateForm;
    
    // Kiểm tra các field bắt buộc
    if (!f.commonName?.trim() ||
        !f.scientificName?.trim() ||
        !f.description?.trim() ||
        !f.careInstructions?.trim() ||
        !f.lightRequirement || !['LOW','MEDIUM','HIGH'].includes(f.lightRequirement) ||
        !f.waterRequirement || !['LOW','MEDIUM','HIGH'].includes(f.waterRequirement) ||
        !f.careDifficulty || !['EASY','MODERATE','DIFFICULT'].includes(f.careDifficulty) ||
        this.selectedLocations.length === 0 ||
        !f.commonDiseases?.trim() ||
        !f.status || !['ACTIVE','INACTIVE'].includes(f.status)) {
      return false;
    }

    // Kiểm tra danh mục
    if (!f.categoryId || f.categoryId <= 0) {
      this.toast.error('Vui lòng chọn danh mục');
      return false;
    }

    return true;
  }

  // handleError, handleHttpError, clearMessages are now handled by setError/setSuccess and validationErrors

  navigateBack(): void {
    this.router.navigate(['/admin/plants']);
  }

  onCancel(): void {
    if (this.hasFormChanges()) {
      if (confirm('You have unsaved changes. Are you sure you want to leave?')) {
        this.navigateBack();
      }
    } else {
      this.navigateBack();
    }
  }

  private hasFormChanges(): boolean {
    if (!this.plant) return false;
    
    // So sánh vị trí phù hợp
    const currentLocations = this.selectedLocations.join(', ');
    const originalLocations = this.plant.suitableLocation || '';
    
    return (
      this.updateForm.scientificName !== this.plant.scientificName ||
      this.updateForm.commonName !== this.plant.commonName ||
      this.updateForm.categoryId !== this.plant.categoryId ||
      this.updateForm.description !== this.plant.description ||
      this.updateForm.careInstructions !== this.plant.careInstructions ||
      this.updateForm.lightRequirement !== this.plant.lightRequirement ||
      this.updateForm.waterRequirement !== this.plant.waterRequirement ||
      this.updateForm.careDifficulty !== this.plant.careDifficulty ||
      currentLocations !== originalLocations ||
      this.updateForm.commonDiseases !== this.plant.commonDiseases ||
      this.updateForm.status !== this.plant.status
    );
  }

  resetForm(): void {
    if (this.plant) {
      this.populateForm(this.plant);
      this.setError('');
      this.setSuccess('');
    }
  }

  onImageError(event: any): void {
    // Hide broken images by setting a default placeholder
    const img = event.target as HTMLImageElement;
    img.style.display = 'none';
    
    // Optionally, you can set a placeholder image
    // img.src = 'assets/images/plant-placeholder.png';
  }



  // Methods để xử lý vị trí phù hợp (chọn nhiều)
  isLocationSelected(locationValue: string): boolean {
    return this.selectedLocations.includes(locationValue);
  }

  onLocationChange(locationValue: string, event: any): void {
    if (event.target.checked) {
      // Thêm vị trí mới
      if (!this.selectedLocations.includes(locationValue)) {
        this.selectedLocations.push(locationValue);
      }
    } else {
      // Xóa vị trí
      this.selectedLocations = this.selectedLocations.filter(loc => loc !== locationValue);
    }
    
    // Cập nhật form với danh sách vị trí được chọn
    this.updateForm.suitableLocation = this.selectedLocations.join(', ');
    this.onFieldChange();
  }

}
