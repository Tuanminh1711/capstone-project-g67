import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { DiseaseService } from '../shared/disease.service';
import { ToastService } from '../../../../shared/toast/toast.service';

@Component({
  selector: 'app-create-disease',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule
  ],
  templateUrl: './create-disease.component.html',
  styleUrls: ['./create-disease.component.scss']
})
export class CreateDiseaseComponent {
  diseaseForm!: FormGroup;
  loading = false;

  constructor(
    private fb: FormBuilder,
    private diseaseService: DiseaseService,
    private toastService: ToastService,
    private router: Router
  ) {
    this.initForm();
  }

  private initForm(): void {
    this.diseaseForm = this.fb.group({
      diseaseName: ['', [Validators.required, Validators.minLength(3)]],
      scientificName: [''],
      symptoms: ['', [Validators.required, Validators.minLength(10)]],
      causes: ['', [Validators.required, Validators.minLength(10)]],
      treatment: [''],
      prevention: ['', [Validators.required, Validators.minLength(10)]],
      severity: ['MEDIUM', Validators.required],
      category: ['Nấm', Validators.required],
      affectedPlantTypes: [''],
      imageUrl: [''],
      confidenceLevel: ['']
    });
  }

  // Validation helpers
  isFieldValid(fieldName: string): boolean {
    const field = this.diseaseForm.get(fieldName);
    return field ? field.valid && (field.dirty || field.touched) : false;
  }

  isFieldInvalid(fieldName: string): boolean {
    const field = this.diseaseForm.get(fieldName);
    return field ? field.invalid && (field.dirty || field.touched) : false;
  }

  getFieldError(fieldName: string): string {
    const field = this.diseaseForm.get(fieldName);
    if (field && field.errors && (field.dirty || field.touched)) {
      if (field.errors['required']) {
        return `${this.getFieldDisplayName(fieldName)} là bắt buộc`;
      }
      if (field.errors['minlength']) {
        const requiredLength = field.errors['minlength'].requiredLength;
        return `${this.getFieldDisplayName(fieldName)} phải có ít nhất ${requiredLength} ký tự`;
      }
    }
    return '';
  }

  private getFieldDisplayName(fieldName: string): string {
    const displayNames: { [key: string]: string } = {
      'diseaseName': 'Tên bệnh',
      'scientificName': 'Tên khoa học',
      'symptoms': 'Triệu chứng',
      'causes': 'Nguyên nhân',
      'treatment': 'Phương pháp điều trị',
      'prevention': 'Phương pháp phòng ngừa',
      'severity': 'Mức độ nghiêm trọng',
      'category': 'Loại bệnh',
      'affectedPlantTypes': 'Loại cây bị ảnh hưởng',
      'confidenceLevel': 'Mức độ tin cậy'
    };
    return displayNames[fieldName] || fieldName;
  }

  onSubmit(): void {
    if (this.diseaseForm.invalid) {
      this.markFormGroupTouched();
      this.toastService.error('❌ Vui lòng điền đầy đủ thông tin bắt buộc!');
      return;
    }

    this.toastService.info('⏳ Đang tạo bệnh cây mới...');
    
    // Use setTimeout to avoid ExpressionChangedAfterItHasBeenCheckedError
    setTimeout(() => {
      this.loading = true;
    });

    const formValue = { ...this.diseaseForm.value };
    
    // Convert form data to match API interface
    const apiRequest = {
      diseaseName: formValue.diseaseName,
      scientificName: formValue.scientificName || undefined,
      symptoms: formValue.symptoms,
      causes: formValue.causes,
      treatment: formValue.treatment || undefined,
      prevention: formValue.prevention || undefined,
      severity: formValue.severity,
      category: formValue.category,
      affectedPlantTypes: formValue.affectedPlantTypes || undefined,
      confidenceLevel: formValue.confidenceLevel || undefined
    };

    this.diseaseService.createPlantDisease(apiRequest)
      .subscribe({
        next: (response) => {
          this.loading = false;
          this.toastService.success('✅ Tạo bệnh cây thành công!');
          setTimeout(() => {
            this.router.navigate(['/expert/plant-manager/diseases/list']);
          }, 1500);
        },
        error: (error) => {
          this.loading = false;
          console.error('Error creating disease:', error);
          this.toastService.error('❌ Lỗi khi tạo bệnh cây. Vui lòng thử lại!');
        }
      });
  }

  private markFormGroupTouched(): void {
    Object.keys(this.diseaseForm.controls).forEach(key => {
      const control = this.diseaseForm.get(key);
      if (control) {
        control.markAsTouched();
      }
    });
  }

  onCancel(): void {
    if (this.diseaseForm.dirty) {
      if (confirm('Bạn có chắc chắn muốn hủy? Tất cả dữ liệu đã nhập sẽ bị mất.')) {
        this.router.navigate(['/expert/plant-manager/diseases/list']);
      }
    } else {
      this.router.navigate(['/expert/plant-manager/diseases/list']);
    }
  }

  resetForm(): void {
    this.diseaseForm.reset();
    this.loading = false;
    this.toastService.info('🔄 Đã reset form thành công');
  }
}
