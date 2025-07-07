import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { FormBuilder, FormGroup, Validators, FormArray, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AdminCreatePlantService } from './admin-create-plant.service';
import { ToastService } from '../../../shared/toast.service';

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
export class AdminCreatePlantComponent implements OnInit {
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

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private createPlantService: AdminCreatePlantService,
    private toastService: ToastService,
    private cdr: ChangeDetectorRef
  ) {
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
      commonDiseases: [''],
      imageUrls: this.fb.array([this.fb.control('', [Validators.required])])
    });
  }

  get imageUrls(): FormArray {
    return this.createPlantForm.get('imageUrls') as FormArray;
  }

  addImageUrl(): void {
    this.imageUrls.push(this.fb.control('', [Validators.required]));
  }

  removeImageUrl(index: number): void {
    if (this.imageUrls.length > 1) {
      this.imageUrls.removeAt(index);
    }
  }

  private async loadCategories(): Promise<void> {
    try {
      this.categories = await this.createPlantService.getCategories();
    } catch (error) {
      this.toastService.error('Không thể tải danh sách danh mục');
      // Fallback categories
      this.categories = [
        { id: 1, name: 'Cây cảnh' },
        { id: 2, name: 'Cây ăn quả' },
        { id: 3, name: 'Cây thuốc' },
        { id: 4, name: 'Cây thủy sinh' },
        { id: 5, name: 'Cây sen đá' }
      ];
    }
  }

  async onSubmit(): Promise<void> {
    if (this.createPlantForm.invalid) {
      this.markFormGroupTouched();
      this.toastService.error('Vui lòng kiểm tra lại thông tin nhập vào');
      return;
    }

    // Use setTimeout to avoid ExpressionChangedAfterItHasBeenCheckedError
    setTimeout(() => {
      this.isSubmitting = true;
    });

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
        imageUrls: formValue.imageUrls.filter((url: string) => url.trim()).map((url: string) => url.trim())
      };

      // Validate required fields
      if (!createPlantRequest.scientificName || !createPlantRequest.commonName || 
          !createPlantRequest.categoryId || !createPlantRequest.description ||
          !createPlantRequest.careInstructions || !createPlantRequest.lightRequirement ||
          !createPlantRequest.waterRequirement || !createPlantRequest.careDifficulty ||
          !createPlantRequest.suitableLocation || !createPlantRequest.imageUrls.length) {
        this.toastService.error('Vui lòng điền đầy đủ tất cả thông tin bắt buộc');
        return;
      }

      const response = await this.createPlantService.createPlant(createPlantRequest);
      
      // Kiểm tra response status
      if (response && (response as any).status === 500) {
        throw new Error((response as any).message || 'Server error occurred');
      }
      
      this.toastService.success('Tạo cây mới thành công!');
      
      // Reset form sau khi tạo thành công
      this.createPlantForm.reset();
      this.createPlantForm = this.initializeForm();
      
      // Navigate về danh sách plants để reload data
      this.router.navigate(['/admin/plants']);
    } catch (error: any) {
      if (error?.status === 403) {
        this.toastService.error('Bạn không có quyền thực hiện hành động này');
      } else if (error?.status === 401) {
        this.toastService.error('Vui lòng đăng nhập lại');
        this.router.navigate(['/login']);
      } else {
        const errorMessage = error?.error?.message || error?.message || 'Có lỗi xảy ra khi tạo cây mới';
        this.toastService.error(errorMessage);
      }
    } finally {
      setTimeout(() => {
        this.isSubmitting = false;
      });
    }
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
    const field = this.createPlantForm.get(fieldName);
    if (field?.touched && field?.errors) {
      if (field.errors['required']) return `${this.getFieldLabel(fieldName)} là bắt buộc`;
      if (field.errors['minlength']) return `${this.getFieldLabel(fieldName)} phải có ít nhất ${field.errors['minlength'].requiredLength} ký tự`;
      if (field.errors['pattern']) return 'URL không hợp lệ';
    }
    return '';
  }

  getImageUrlError(index: number): string {
    const control = this.imageUrls.at(index);
    if (control?.touched && control?.errors) {
      if (control.errors['required']) return 'URL ảnh là bắt buộc';
    }
    return '';
  }

  private getFieldLabel(fieldName: string): string {
    const labels: { [key: string]: string } = {
      scientificName: 'Tên khoa học',
      commonName: 'Tên thường gọi',
      categoryId: 'Danh mục',
      description: 'Mô tả',
      careInstructions: 'Hướng dẫn chăm sóc',
      lightRequirement: 'Yêu cầu ánh sáng',
      waterRequirement: 'Yêu cầu nước',
      careDifficulty: 'Độ khó chăm sóc',
      suitableLocation: 'Vị trí phù hợp'
    };
    return labels[fieldName] || fieldName;
  }
}
