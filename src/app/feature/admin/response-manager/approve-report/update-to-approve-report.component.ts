import { ViewChild } from '@angular/core';
import { NgForm } from '@angular/forms';

import { environment } from '../../../../../environments/environment';
import { Component, OnInit, OnDestroy, ChangeDetectorRef, inject, NgZone } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { Subject, takeUntil } from 'rxjs';
import { ToastService } from '../../../../shared/toast/toast.service';
import { BaseAdminListComponent } from '../../shared/base-admin-list.component';
import { AuthService } from '../../../../auth/auth.service';
import { PlantOptionsService, PlantOption } from '../../../../shared/services/plant-options.service';

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

interface HandleReportRequestDTO {
  status: string;
  adminNotes: string;
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
  images?: any;
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
  templateUrl: './update-to-approve-report.html',
  styleUrls: ['./update-to-approve-report.scss']
})
export class UpdatePlantComponent extends BaseAdminListComponent implements OnInit, OnDestroy {
  @ViewChild('plantForm') plantForm!: NgForm;
  private destroy$ = new Subject<void>();
  private readonly baseUrl = `${environment.apiUrl}/manager`;
  
  plantId: number = 0;
  reportId: number = 0;
  plant: Plant | null = null;
  report: any = null; // Store report data to get userId
  isUpdating = false;
  isApproving = false;
  adminNotes: string = '';
  hasPlantBeenSaved = false; // Track if plant info has been saved
  // loading, error, and success state handled by BaseAdminListComponent
  validationErrors: string[] = [];
  sidebarCollapsed = false;

  // --- IMAGE UPLOAD LOGIC ---
  selectedNewImageFile: File | null = null;
  newImagePreviewUrl: string | null = null;
  isUploadingImage: boolean = false;

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

  private toast = inject(ToastService);
  private authService = inject(AuthService);

  // Helper to get correct image src from BE filename or url
  getPlantImageSrc(imageUrl: string): string {
    if (!imageUrl) return '';
    if (/^https?:\/\//.test(imageUrl)) {
      if (imageUrl.includes('plantcarestorage.blob.core.windows.net')) {
        return imageUrl;
      }
      return imageUrl;
    }
    let filename = imageUrl;
    if (imageUrl.includes('/')) filename = imageUrl.split('/').pop() || imageUrl;
    return `/api/manager/plants/${filename}`;
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
    // Nếu đã đủ 3 ảnh, xóa ảnh đầu tiên
    if (images.length >= 3) {
      deleteImageIds = [images[0].id];
    }
    this.isUploadingImage = true;
    this.setError('');
    this.setSuccess('');
    const apiUrl = `/api/manager/update-plant-images/${this.plantId}`;
    formData.append('deleteImageIds', deleteImageIds.join(','));
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

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private http: HttpClient,
    private cdr: ChangeDetectorRef,
    private zone: NgZone = inject(NgZone),
    private plantOptionsService: PlantOptionsService
  ) {
    super();
  }

  ngOnInit(): void {
    this.loadPlantOptions();
    this.route.params.pipe(takeUntil(this.destroy$)).subscribe(params => {
      const plantId = params['plantId'];
      const reportId = params['reportId'];
      
      if (plantId && !isNaN(+plantId)) {
        this.plantId = +plantId;
      }
      
      if (reportId && !isNaN(+reportId)) {
        this.reportId = +reportId;
      }
      
      if (this.plantId) {
        this.loadPlantData();
      }
      
      if (this.reportId) {
        this.loadReportData();
      }
    });
    this.setLoading(true);
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    this.cleanupSubscriptions();
  }

  // Add method to redirect to working edit page if API doesn't work
  redirectToEditPage(): void {
    this.toast.info('Chuyển đến trang chỉnh sửa cây.');
    this.router.navigate(['/admin/plants/edit', this.plantId]);
  }

    // Called on any field change to update form state and enable save button
  onFieldChange(): void {
    this.hasPlantBeenSaved = false;
    this.setError('');
    this.setSuccess('');
    // Mark form as dirty to ensure plantForm.valid updates
    if (this.plantForm && this.plantForm.form) {
      this.plantForm.form.markAsDirty();
      this.plantForm.form.updateValueAndValidity();
    }
    this.cdr.detectChanges();
  }

  private loadReportData(): void {
    this.setLoading(true);
    this.setError('');
    this.setSuccess('');
    // Load report data to get plant ID
    const apiUrl = `${environment.apiUrl}/manager/report-detail/${this.reportId}`;
    this.http.get<any>(apiUrl)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          if (response && response.data) {
            // Store report data to get userId later
            this.report = response.data;
            // ...existing code...
            
            // Check if report is in correct status for approval
            if (this.report.status === 'PENDING') {
              // ...existing code...
              this.setError('Report này chưa được claim. Vui lòng claim report trước khi approve.');
              this.setLoading(false);
              return;
            }
            
            if (this.report.status === 'APPROVED') {
              // ...existing code...
              this.setError('Report này đã được approve rồi.');
              this.setLoading(false);
              return;
            }
            
            if (this.report.status === 'REJECTED') {
              // ...existing code...
              this.setError('Report này đã bị reject.');
              this.setLoading(false);
              return;
            }
            
            if (this.report.status === 'CLAIMED' && this.report.claimedById) {
              // ...existing code...
              const currentAdminId = this.getCurrentAdminId();
              // ...existing code...
              
              if (this.report.claimedById !== currentAdminId) {
                this.setError(`Report này đã được claim bởi admin khác (ID: ${this.report.claimedById}). Chỉ admin đã claim mới có thể approve.`);
                this.setLoading(false);
                return;
              } else {
                // ...existing code...
              }
            }
            
            // Get plant ID from report data
            const plantId = response.data.plantId || response.data.plant?.id;
            if (plantId) {
              this.plantId = plantId;
              // Load plant details using plant-detail API
              this.loadPlantData();
            } else {
              this.setLoading(false);
              this.setError('Không tìm thấy thông tin cây trong report.');
            }
          } else {
            this.setLoading(false);
            this.setError('Không thể tải thông tin report.');
          }
          this.cdr.detectChanges();
        },
        error: (error) => {
          this.setLoading(false);
          // ...existing code...
          const errorMessage = error?.error?.message || error?.message || 'Không thể tải thông tin report.';
          this.setError(`Load Report Error: ${errorMessage}`);
          this.toast.error(`Load Report Error: ${errorMessage}`);
          this.cdr.detectChanges();
        }
      });
  }

  private loadPlantData(): void {
    this.setLoading(true);
    this.setError('');
    this.setSuccess('');
    const apiUrl = `${environment.apiUrl}/manager/plant-detail/${this.plantId}`;
    this.http.get<any>(apiUrl)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.setLoading(false);
          if (response && response.data) {
            this.plant = response.data;
            this.populateForm(response.data);
          } else if (response) {
            this.plant = response;
            this.populateForm(response);
          } else {
            this.setError('No plant data found');
          }
          this.cdr.detectChanges();
        },
        error: (error) => {
          this.setLoading(false);
          // ...existing code...
          const errorMessage = error?.error?.message || error?.message || 'Không thể tải thông tin cây.';
          this.setError(`Load Plant Error: ${errorMessage}`);
          this.toast.error(`Load Plant Error: ${errorMessage}`);
          this.cdr.detectChanges();
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
    
    this.toast.info('Thông tin cây đã được nạp vào form.');
  }

  private getCurrentAdminId(): number {
    // Get current admin ID from auth service
    const userId = this.authService.getCurrentUserId();
    if (userId) {
      return parseInt(userId, 10);
    }
    
    // Default fallback
  // ...existing code...
    return 1; // Default admin ID
  }

  private getReportUserId(): number {
    // Get user ID from the report data (the person who submitted the report)
  // ...existing code...
    
    // Primary: reporterId (from the API response structure)
    if (this.report && this.report.reporterId) {
  // ...existing code...
      return this.report.reporterId;
    }
    
    // Fallback: try other property names
    if (this.report && this.report.userId) {
  // ...existing code...
      return this.report.userId;
    }
    
    if (this.report && this.report.user && this.report.user.id) {
  // ...existing code...
      return this.report.user.id;
    }
    
    if (this.report && this.report.createdBy) {
  // ...existing code...
      return this.report.createdBy;
    }
    
    // Default fallback - should not happen in normal flow
  // ...existing code...
    return 2; // Use reporterId from your example: 2
  }

  onApprove(): void {
    if (!this.adminNotes.trim()) {
      this.setError('Vui lòng nhập ghi chú của admin!');
      return;
    }

    if (!this.validateForm()) {
      this.setError('Vui lòng kiểm tra lại các trường dữ liệu!');
      return;
    }

    // Check if plant info has been saved
    if (!this.hasPlantBeenSaved) {
      this.setError('Vui lòng lưu thông tin cây trước khi chấp nhận report! Nhấn nút "Lưu thông tin cây" để tiếp tục.');
      this.toast.error('Bạn phải lưu thông tin cây trước khi chấp nhận report!');
      return;
    }
    
    this.isApproving = true;
    this.setError('');
    this.setSuccess('');
    
    // Direct approve since plant has been saved
    this.approveReport();
  }

  private approveReport(): void {
    const requestBody: HandleReportRequestDTO = {
      status: 'APPROVED',
      adminNotes: this.adminNotes.trim()
    };
    
    // Get current ADMIN ID (not reporter ID) for the header
    const currentAdminId = this.getCurrentAdminId();
    
    const headers = {
      'Content-Type': 'application/json',
      'userId': currentAdminId.toString() // Admin ID, not reporter ID
    };
    
  // ...existing code...
    console.log('Report was submitted by reporterId:', this.getReportUserId());
    
    this.http.put<ApiResponse>(`${environment.apiUrl}/manager/handle-report/${this.reportId}`, requestBody, { 
      headers,
      observe: 'response' // Get full response
    })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (httpResponse: any) => {
          this.isApproving = false;
          console.log('Report approval response:', httpResponse);
          
          // Handle the HttpResponse structure
          const response = httpResponse.body || httpResponse;
          const status = response.status || httpResponse.status;
          const message = response.message;
          
          if (httpResponse && (status === 200 || httpResponse.status === 200)) {
            this.zone.run(() => {
              setTimeout(() => {
                this.setSuccess('Cập nhật cây và chấp nhận report thành công!');
                this.toast.success('Cập nhật cây và chấp nhận report thành công!');
                this.cdr.detectChanges();
              });
            });
            setTimeout(() => {
              this.navigateBack();
            }, 1500);
          } else {
            this.zone.run(() => {
              setTimeout(() => {
                const errorMessage = message || response?.error?.message || 'Lỗi khi chấp nhận report!';
                this.setError(`Report Approval Error: ${errorMessage}`);
                this.toast.error(`Report Approval Error: ${errorMessage}`);
                this.cdr.detectChanges();
              });
            });
          }
        },
        error: (error) => {
          this.isApproving = false;
          console.error('Report approval error:', error);
          
          // Check if it's a 500 error and try alternative endpoint/method
          if (error.status === 500) {
            console.log('Trying alternative approach...');
            this.tryAlternativeApprovalMethod();
          } else {
            this.zone.run(() => {
              setTimeout(() => {
                const errorMessage = error?.error?.message || error?.message || 'Lỗi kết nối khi chấp nhận report!';
                this.setError(`Report Approval Connection Error: ${errorMessage}`);
                this.toast.error(`Report Approval Connection Error: ${errorMessage}`);
                this.cdr.detectChanges();
              });
            });
          }
        }
      });
  }

  private tryAlternativeApprovalMethod(): void {
    // Try different request format
    const alternativeBody = {
      reportId: this.reportId,
      status: 'APPROVED',
      adminNotes: this.adminNotes.trim()
    };
    
    const currentAdminId = this.getCurrentAdminId();
    const headers = {
      'Content-Type': 'application/json',
      'userId': currentAdminId.toString() // Admin ID, not reporter ID
    };
    
    console.log('Trying alternative approval method with body:', alternativeBody);
    console.log('Alternative headers (using ADMIN ID):', headers);
    
    this.http.post<ApiResponse>(`${environment.apiUrl}/manager/approve-report`, alternativeBody, { 
      headers,
      observe: 'response' // Get full response  
    })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (httpResponse: any) => {
          this.isApproving = false;
          console.log('Alternative approval response:', httpResponse);
          
          // Handle the HttpResponse structure
          const response = httpResponse.body || httpResponse;
          const status = response.status || httpResponse.status;
          const message = response.message;
          
          if (httpResponse && (status === 200 || httpResponse.status === 200)) {
            this.zone.run(() => {
              setTimeout(() => {
                this.setSuccess('Cập nhật cây và chấp nhận report thành công!');
                this.toast.success('Cập nhật cây và chấp nhận report thành công!');
                this.cdr.detectChanges();
              });
            });
            setTimeout(() => {
              this.navigateBack();
            }, 1500);
          } else {
            this.zone.run(() => {
              setTimeout(() => {
                const errorMessage = message || response?.error?.message || 'Lỗi khi chấp nhận report!';
                this.setError(`Alternative Approval Error: ${errorMessage}`);
                this.toast.error(`Alternative Approval Error: ${errorMessage}`);
                this.cdr.detectChanges();
              });
            });
          }
        },
        error: (altError) => {
          this.isApproving = false;
          console.error('Alternative approval also failed:', altError);
          const errorMessage = altError?.error?.message || altError?.message || 'Lỗi server khi chấp nhận report! Vui lòng thử lại sau.';
          this.zone.run(() => {
            this.setError(`Alternative Approval Server Error: ${errorMessage}`);
            this.toast.error(`Alternative Approval Server Error: ${errorMessage}`);
            this.cdr.detectChanges();
          });
        }
      });
  }

  onSubmit(): void {
    if (!this.validateForm()) {
      this.setError('Vui lòng kiểm tra lại các trường dữ liệu!');
      return;
    }
    this.isUpdating = true;
    this.setError('');
    this.setSuccess('');
    this.http.put<ApiResponse<Plant>>(`${this.baseUrl}/update-plant/${this.plantId}`, this.updateForm)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.isUpdating = false;
          if (response && (response.success === true || response.status === 200)) {
            this.hasPlantBeenSaved = true; // Mark plant as saved
            this.zone.run(() => {
              this.setSuccess('Cập nhật cây thành công! Bây giờ bạn có thể chấp nhận report.');
              this.toast.success('Cập nhật cây thành công! Bây giờ bạn có thể chấp nhận report.');
              this.cdr.detectChanges();
            });
            // Don't navigate away - stay on page to allow approval
          } else {
            this.zone.run(() => {
              this.setError(response.message || 'Cập nhật thất bại!');
              this.toast.error(response.message || 'Cập nhật thất bại!');
              this.cdr.detectChanges();
            });
          }
        },
        error: (error) => {
          this.isUpdating = false;
          console.error('Submit update error:', error);
          const errorMessage = error?.error?.message || error?.message || 'Có lỗi xảy ra khi cập nhật!';
          this.zone.run(() => {
            this.setError(`Submit Update Error: ${errorMessage}`);
            this.toast.error(`Submit Update Error: ${errorMessage}`);
            this.cdr.detectChanges();
          });
        }
      });
  }

  private validateForm(): boolean {
    this.validationErrors = [];

    if (!this.updateForm.commonName?.trim()) {
      this.validationErrors.push('Common name is required');
    }

    if (!this.updateForm.scientificName?.trim()) {
      this.validationErrors.push('Scientific name is required');
    }

    if (!this.updateForm.categoryId || this.updateForm.categoryId <= 0) {
      this.validationErrors.push('Valid category ID is required');
    }

    if (!['LOW', 'MEDIUM', 'HIGH'].includes(this.updateForm.lightRequirement)) {
      this.validationErrors.push('Invalid light requirement');
    }

    if (!['LOW', 'MEDIUM', 'HIGH'].includes(this.updateForm.waterRequirement)) {
      this.validationErrors.push('Invalid water requirement');
    }

    if (!['EASY', 'MODERATE', 'DIFFICULT'].includes(this.updateForm.careDifficulty)) {
      this.validationErrors.push('Invalid care difficulty');
    }

    if (!['ACTIVE', 'INACTIVE'].includes(this.updateForm.status)) {
      this.validationErrors.push('Invalid status');
    }

    if (this.validationErrors.length > 0) {
      this.setError('Please fix the validation errors below');
      return false;
    }

    return true;
  }

  // handleError, handleHttpError, clearMessages are now handled by setError/setSuccess and validationErrors

  navigateBack(): void {
    this.router.navigate(['/admin/reports']);
  }

  onCancel(): void {
    if (this.adminNotes.trim() || this.hasPlantChanges()) {
      if (confirm('Bạn có thay đổi chưa lưu. Bạn có chắc chắn muốn rời khỏi?')) {
        this.navigateBack();
      }
    } else {
      this.navigateBack();
    }
  }

  hasPlantChanges(): boolean {
    if (!this.plant) return false;
    
    return (
      this.updateForm.scientificName !== this.plant.scientificName ||
      this.updateForm.commonName !== this.plant.commonName ||
      this.updateForm.categoryId !== this.plant.categoryId ||
      this.updateForm.description !== this.plant.description ||
      this.updateForm.careInstructions !== this.plant.careInstructions ||
      this.updateForm.lightRequirement !== this.plant.lightRequirement ||
      this.updateForm.waterRequirement !== this.plant.waterRequirement ||
      this.updateForm.careDifficulty !== this.plant.careDifficulty ||
      this.updateForm.suitableLocation !== this.plant.suitableLocation ||
      this.updateForm.commonDiseases !== this.plant.commonDiseases ||
      this.updateForm.status !== this.plant.status
    );
  }

  resetForm(): void {
    if (this.plant) {
      this.populateForm(this.plant);
      this.adminNotes = '';
      this.hasPlantBeenSaved = false; // Reset saved status
      this.setError('');
      this.setSuccess('');
    }
  }

  // Helper method to check if approve button should be enabled
  canApprove(): boolean {
    return this.hasPlantBeenSaved && this.adminNotes.trim().length > 0 && !this.isApproving;
  }

  // Get tooltip text for approve button
  getApproveTooltip(): string {
    if (!this.hasPlantBeenSaved) {
      return 'Vui lòng lưu thông tin cây trước khi chấp nhận report';
    }
    if (!this.adminNotes.trim()) {
      return 'Vui lòng nhập ghi chú của admin';
    }
    if (this.isApproving) {
      return 'Đang xử lý...';
    }
    return 'Chấp nhận report và cập nhật thông tin cây';
  }

  onImageError(event: any): void {
    event.target.src = '/assets/image/default-plant.png';
  }

  // Method to claim report if needed
  claimReport(): void {
    if (!this.report || this.report.status !== 'PENDING') {
      this.toast.error('Không thể claim report này!');
      return;
    }

    const currentAdminId = this.getCurrentAdminId();
    
    this.http.put<ApiResponse>(`${environment.apiUrl}/manager/claim-report/${this.reportId}`, {}, {
      headers: {
        'Content-Type': 'application/json',
        'userId': currentAdminId.toString()
      }
    })
    .pipe(takeUntil(this.destroy$))
    .subscribe({
      next: (response) => {
        if (response && (response.success === true || response.status === 200)) {
          this.toast.success('Claim report thành công!');
          // Reload report data
          this.loadReportData();
        } else {
          const errorMessage = response?.message || 'Lỗi khi claim report!';
          this.toast.error(`Claim Report Error: ${errorMessage}`);
        }
      },
      error: (error) => {
        console.error('Claim report error:', error);
        const errorMessage = error?.error?.message || error?.message || 'Lỗi khi claim report!';
        this.toast.error(`Claim Report Connection Error: ${errorMessage}`);
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
}
