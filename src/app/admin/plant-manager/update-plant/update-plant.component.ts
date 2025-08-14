
import { environment } from '../../../../environments/environment';
import { Component, OnInit, OnDestroy, ChangeDetectorRef, inject, NgZone } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { Subject, takeUntil } from 'rxjs';
import { AdminLayoutComponent } from '../../../shared/admin-layout/admin-layout.component';
import { ToastService } from '../../../shared/toast/toast.service';
import { BaseAdminListComponent } from '../../../shared/base-admin-list.component';

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
  templateUrl: './update-plant.component.html',
  styleUrls: ['./update-plant.scss']
})
export class UpdatePlantComponent extends BaseAdminListComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  private readonly baseUrl = `${environment.apiUrl}/manager`;
  
  plantId: number = 0;
  plant: Plant | null = null;
  isUpdating = false;
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

  lightRequirementOptions = [
    { value: 'LOW', label: 'Ít ánh sáng' },
    { value: 'MEDIUM', label: 'Ánh sáng vừa phải' },
    { value: 'HIGH', label: 'Nhiều ánh sáng' }
  ];

  waterRequirementOptions = [
    { value: 'LOW', label: 'Ít nước' },
    { value: 'MEDIUM', label: 'Nước vừa phải' },
    { value: 'HIGH', label: 'Nhiều nước' }
  ];

  careDifficultyOptions = [
    { value: 'EASY', label: 'Dễ chăm sóc' },
    { value: 'MODERATE', label: 'Trung bình' },
    { value: 'DIFFICULT', label: 'Khó chăm sóc' }
  ];

  statusOptions = [
    { value: 'ACTIVE', label: 'Hoạt động' },
    { value: 'INACTIVE', label: 'Không hoạt động' }
  ];

  private toast = inject(ToastService);

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private http: HttpClient,
    private cdr: ChangeDetectorRef,
    private zone: NgZone = inject(NgZone)
  ) {
    super();
  }

  ngOnInit(): void {
    this.route.params.pipe(takeUntil(this.destroy$)).subscribe(params => {
      const id = params['id'];
      if (id && !isNaN(+id)) {
        this.plantId = +id;
        this.loadPlantData();
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
          this.setError('Không thể tải thông tin cây.');
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
            this.zone.run(() => {
              Promise.resolve().then(() => {
                this.setSuccess('Cập nhật cây thành công!');
                this.toast.success('Cập nhật cây thành công!');
              });
            });
            setTimeout(() => {
              this.navigateBack();
            }, 1500);
          } else {
            this.zone.run(() => {
              Promise.resolve().then(() => {
                this.setError(response.message || 'Cập nhật thất bại!');
                this.toast.error(response.message || 'Cập nhật thất bại!');
              });
            });
          }
        },
        error: () => {
          this.isUpdating = false;
          this.zone.run(() => {
            Promise.resolve().then(() => {
              this.setError('Có lỗi xảy ra khi cập nhật!');
              this.toast.error('Có lỗi xảy ra khi cập nhật!');
            });
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
}
