// ...
import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { BaseAdminListComponent } from '../../../shared/base-admin-list.component';
import { FormBuilder, FormGroup, Validators, FormArray, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AdminCreatePlantService } from './admin-create-plant.service';
import { ToastService } from '../../../shared/toast/toast.service';

export interface PlantCategory {
  id: number;
  name: string;
}

export interface CreatePlantRequest {
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
  imageUrls: string[];
}

@Component({
  selector: 'app-admin-create-plant',
  standalone: true,
  imports: [ReactiveFormsModule, CommonModule],
  templateUrl: './admin-create-plant.component.html',
  styleUrls: ['./admin-create-plant.component.scss']
})
export class AdminCreatePlantComponent extends BaseAdminListComponent implements OnInit {

  selectedImageFile: File | null = null;

  onImageFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (!input.files || input.files.length === 0) {
      this.selectedImageFile = null;
      return;
    }
    this.selectedImageFile = input.files[0];
    // Debug log
    console.log('Selected image file:', this.selectedImageFile);
  }
  createPlantForm: FormGroup;
  categories: PlantCategory[] = [];
  isSubmitting = false;

  // Light requirement options
  lightOptions = [
    { value: 'LOW', label: 'Ánh sáng yếu' },
    { value: 'MEDIUM', label: 'Ánh sáng trung bình' },
    { value: 'HIGH', label: 'Ánh sáng mạnh' },
    { value: 'DIRECT', label: 'Ánh sáng trực tiếp' }
  ];

  // Water requirement options
  waterOptions = [
    { value: 'LOW', label: 'Ít nước' },
    { value: 'MEDIUM', label: 'Trung bình' },
    { value: 'HIGH', label: 'Nhiều nước' }
  ];

  // Care difficulty options
  difficultyOptions = [
    { value: 'EASY', label: 'Dễ chăm sóc' },
    { value: 'MODERATE', label: 'Trung bình' },
    { value: 'DIFFICULT', label: 'Khó chăm sóc' }
  ];

  // trackBy functions for *ngFor
  trackByCategoryId(index: number, item: PlantCategory) {
    return item.id;
  }

  trackByOptionValue(index: number, item: { value: string; label: string }) {
    return item.value;
  }

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private createPlantService: AdminCreatePlantService,
    private toastService: ToastService,
    private cdr: ChangeDetectorRef
  ) {
    super();
    this.createPlantForm = this.initializeForm();
  }

  ngOnInit(): void {
    this.loadCategories();
  }

  private initializeForm(): FormGroup {
    return this.fb.group({
      scientificName: ['', [Validators.required, Validators.minLength(2)]],
      commonName: ['', [Validators.required, Validators.minLength(2)]],
      categoryId: ['', [Validators.required]],
      description: ['', [Validators.required, Validators.minLength(10)]],
      careInstructions: ['', [Validators.required, Validators.minLength(10)]],
      lightRequirement: ['', [Validators.required]],
      waterRequirement: ['', [Validators.required]],
      careDifficulty: ['', [Validators.required]],
      suitableLocation: ['', [Validators.required]],
      commonDiseases: ['']
    });
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
      this.toastService.error('Không thể tải danh sách danh mục');
      Promise.resolve().then(() => {
        this.categories = [];
        this.cdr.markForCheck();
      });
    }
  }

  async onSubmit(): Promise<void> {

    console.log('Form invalid:', this.createPlantForm.invalid);
    console.log('Form value:', this.createPlantForm.value);
    if (this.createPlantForm.invalid) {
      this.markFormGroupTouched();
      this.setError('Vui lòng kiểm tra lại thông tin nhập vào');
      return;
    }


    if (!this.selectedImageFile) {
      this.setError('Vui lòng chọn ảnh cho cây');
      console.error('selectedImageFile is null at submit');
      return;
    }

  this.isSubmitting = true;

    try {
      const formValue = this.createPlantForm.value;
      const createPlantRequest: CreatePlantRequest = {
        scientificName: formValue.scientificName.trim(),
        commonName: formValue.commonName.trim(),
        categoryId: parseInt(formValue.categoryId),
        description: formValue.description.trim(),
        careInstructions: formValue.careInstructions.trim(),
        lightRequirement: formValue.lightRequirement,
        waterRequirement: formValue.waterRequirement,
        careDifficulty: formValue.careDifficulty,
        suitableLocation: formValue.suitableLocation.trim(),
        commonDiseases: formValue.commonDiseases?.trim() || '',
        imageUrls: [] // Không gửi imageUrls khi tạo plant
      };

      // Validate required fields (không check imageUrls)
      if (!createPlantRequest.scientificName || !createPlantRequest.commonName || 
          !createPlantRequest.categoryId || !createPlantRequest.description ||
          !createPlantRequest.careInstructions || !createPlantRequest.lightRequirement ||
          !createPlantRequest.waterRequirement || !createPlantRequest.careDifficulty ||
          !createPlantRequest.suitableLocation) {
        this.setError('Vui lòng điền đầy đủ tất cả thông tin bắt buộc');
        return;
      }

      // 1. Tạo plant trước
      const response = await this.createPlantService.createPlant(createPlantRequest);
      if (!response || !response.id) {
        throw new Error((response as any)?.message || 'Tạo cây thất bại');
      }

      // 2. Upload ảnh với plantId vừa tạo
  console.log('Uploading image for plantId:', response.id, 'file:', this.selectedImageFile);
  await this.createPlantService.uploadPlantImage(response.id, this.selectedImageFile);

      this.setSuccess('Tạo cây mới thành công!');
      this.createPlantForm.reset();
      this.createPlantForm = this.initializeForm();
      this.selectedImageFile = null;
      this.router.navigate(['/admin/plants']);
    } catch (error: any) {
      this.handleApiError(error);
    } finally {
      this.isSubmitting = false;
      this.cdr.detectChanges();
    }
  }

  private handleApiError(error: any) {
    let errorMessage = error?.error?.message || error?.message || 'Có lỗi xảy ra khi tạo cây mới';
    if (error?.status === 403) {
      errorMessage = 'Bạn không có quyền thực hiện hành động này';
    } else if (error?.status === 401) {
      errorMessage = 'Vui lòng đăng nhập lại';
      this.toastService.error(errorMessage);
      this.setError(errorMessage);
      this.router.navigate(['/login']);
      return;
    }
    this.toastService.error(errorMessage);
    this.setError(errorMessage);
  }

  onCancel(): void {
    this.router.navigate(['/admin/plants']);
  }

  private markFormGroupTouched(): void {
    Object.keys(this.createPlantForm.controls).forEach(key => {
      const control = this.createPlantForm.get(key);
      control?.markAsTouched();
      
      if (control instanceof FormArray) {
        control.controls.forEach(c => c.markAsTouched());
      }
    });
  }

  getFieldError(fieldName: string): string {
    const control = this.createPlantForm.get(fieldName);
    if (control && control.touched && control.invalid) {
      if (control.errors?.required) {
        return 'Trường này là bắt buộc';
      }
      if (control.errors?.minlength) {
        return `Tối thiểu ${control.errors.minlength.requiredLength} ký tự`;
      }
    }
    return '';
  }
}
