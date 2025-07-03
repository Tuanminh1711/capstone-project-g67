import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { Subject, takeUntil } from 'rxjs';
import { AdminLayoutComponent } from '../../../shared/admin-layout/admin-layout.component';

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
  imports: [CommonModule, FormsModule, AdminLayoutComponent],
  templateUrl: './update-plant.component.html',
  styleUrls: ['./update-plant.scss']
})
export class UpdatePlantComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  private readonly baseUrl = 'http://localhost:8080/api/manager';
  
  plantId: number = 0;
  plant: Plant | null = null;
  isLoading = false;
  isUpdating = false;
  errorMessage = '';
  successMessage = '';
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

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private http: HttpClient,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.route.params.pipe(takeUntil(this.destroy$)).subscribe(params => {
      const id = params['id'];
      if (id && !isNaN(+id)) {
        this.plantId = +id;
        this.loadPlantData();
      } else {
        this.handleError('Invalid plant ID');
        this.navigateBack();
      }
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // Add method to redirect to working edit page if API doesn't work
  redirectToEditPage(): void {
    console.log('Redirecting to edit page...');
    this.router.navigate(['/admin/plants/edit', this.plantId]);
  }

  private loadPlantData(): void {
    this.isLoading = true;
    this.clearMessages();

    // Use the same endpoint as view-plant component
    const apiUrl = `/api/manager/plant-detail/${this.plantId}`;
    console.log('Loading plant data from:', apiUrl);

    this.http.get<any>(apiUrl)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.isLoading = false;
          console.log('API Response:', response);
          
          // Handle the response format like view-plant component
          if (response && response.data) {
            this.plant = response.data;
            this.populateForm(response.data);
          } else if (response) {
            // Direct plant object
            this.plant = response;
            this.populateForm(response);
          } else {
            this.handleError('No plant data found');
          }
          this.cdr.detectChanges();
        },
        error: (error) => {
          this.isLoading = false;
          console.error('Load plant error:', error);
          this.handleApiError(error);
          this.cdr.detectChanges();
        }
      });
  }

  private handleApiError(err: any): void {
    if (err.status === 404) {
      this.handleError('Không tìm thấy thông tin cây này.');
    } else if (err.status === 401 || err.status === 403) {
      this.handleError('Bạn không có quyền truy cập. Vui lòng đăng nhập lại.');
    } else if (err.status === 0) {
      this.handleError('Không thể kết nối đến server. Vui lòng kiểm tra kết nối mạng.');
    } else if (err.status === 500) {
      this.handleError('Lỗi server. Vui lòng thử lại sau.');
    } else {
      this.handleError(`Không thể tải thông tin cây. Lỗi: ${err.status} - ${err.message || 'Unknown error'}`);
    }
  }

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
    
    console.log('Form populated with:', this.updateForm);
    console.log('Original plant data:', plant);
  }

  onSubmit(): void {
    if (!this.validateForm()) {
      return;
    }

    this.isUpdating = true;
    this.clearMessages();

    this.http.put<ApiResponse<Plant>>(`${this.baseUrl}/update-plant/${this.plantId}`, this.updateForm)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.isUpdating = false;
          if (response.success) {
            this.successMessage = 'Plant updated successfully!';
            setTimeout(() => {
              this.navigateBack();
            }, 2000);
          } else {
            this.handleError(response.message || 'Update failed');
          }
        },
        error: (error) => {
          this.isUpdating = false;
          this.handleHttpError(error);
          console.error('Update plant error:', error);
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
      this.errorMessage = 'Please fix the validation errors below';
      return false;
    }

    return true;
  }

  private handleError(message: string): void {
    this.errorMessage = message;
    this.validationErrors = [];
  }

  private handleHttpError(error: any): void {
    switch (error.status) {
      case 400:
        this.handleError('Invalid data. Please check your input.');
        break;
      case 401:
        this.handleError('Unauthorized. Please login again.');
        break;
      case 403:
        this.handleError('You do not have permission to perform this action.');
        break;
      case 404:
        this.handleError('Plant not found.');
        break;
      case 500:
        this.handleError('Server error. Please try again later.');
        break;
      default:
        this.handleError('An unexpected error occurred. Please try again.');
    }
  }

  private clearMessages(): void {
    this.errorMessage = '';
    this.successMessage = '';
    this.validationErrors = [];
  }

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
      this.clearMessages();
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
