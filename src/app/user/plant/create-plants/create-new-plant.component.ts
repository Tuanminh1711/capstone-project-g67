import { Component, OnInit, OnDestroy, ChangeDetectorRef, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, AbstractControl, ValidationErrors } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { Subscription, forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { CreateNewPlantService, CreatePlantRequest, Category } from './create-new-plant.service';
import { ToastService } from '../../../shared/toast/toast.service';
import { TopNavigatorComponent } from '../../../shared/top-navigator/top-navigator.component';
import { PlantOptionsService, PlantOption } from '../../../shared/services/plant-options.service';

@Component({
  selector: 'app-create-new-plant',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule, TopNavigatorComponent],
  templateUrl: './create-new-plant.component.html',
  styleUrls: ['./create-new-plant.component.scss']
})

export class CreateNewPlantComponent implements OnInit, OnDestroy {
  createPlantForm: FormGroup;
  categories: Category[] = [];
  selectedImages: File[] = [];
  imageUrls: string[] = [];
  isSubmitting = false;
  isLoadingCategories = false;
  isUploadingImages = false;
  private subscriptions: Subscription = new Subscription();
  @ViewChild('imageUpload') imageUpload!: ElementRef<HTMLInputElement>;

  // Sử dụng service để lấy options
  lightRequirements: PlantOption[] = [];
  waterRequirements: PlantOption[] = [];
  careDifficulties: PlantOption[] = [];
  suitableLocationOptions: PlantOption[] = [];

  // Custom validators theo backend DTO requirements
  static scientificNameValidator(control: AbstractControl): ValidationErrors | null {
    const value = control.value;
    if (!value) return null;
    
    if (value.length < 3 || value.length > 100) {
      return { scientificName: 'Tên khoa học phải từ 3 đến 100 ký tự' };
    }
    return null;
  }

  static commonNameValidator(control: AbstractControl): ValidationErrors | null {
    const value = control.value;
    if (!value) return null;
    
    if (value.length < 2 || value.length > 100) {
      return { commonName: 'Tên thông thường phải từ 2 đến 100 ký tự' };
    }
    return null;
  }

  static descriptionValidator(control: AbstractControl): ValidationErrors | null {
    const value = control.value;
    if (!value) return null;
    
    if (value.length < 25 || value.length > 2000) {
      return { description: 'Mô tả phải từ 25 đến 2000 ký tự' };
    }
    return null;
  }

  static suitableLocationValidator(control: AbstractControl): ValidationErrors | null {
    const value = control.value;
    if (!value) return null;
    
    if (value.length > 500) {
      return { suitableLocation: 'Vị trí phù hợp không được vượt quá 500 ký tự' };
    }
    return null;
  }

  static commonDiseasesValidator(control: AbstractControl): ValidationErrors | null {
    const value = control.value;
    if (!value) return null;
    
    if (value.length > 1000) {
      return { commonDiseases: 'Bệnh thường gặp không được vượt quá 1000 ký tự' };
    }
    return null;
  }

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private createNewPlantService: CreateNewPlantService,
    private toastService: ToastService,
    private cdr: ChangeDetectorRef,
    private plantOptionsService: PlantOptionsService
  ) {
    this.createPlantForm = this.fb.group({
      scientificName: ['', [Validators.required, CreateNewPlantComponent.scientificNameValidator]],
      commonName: ['', [Validators.required, CreateNewPlantComponent.commonNameValidator]],
      categoryId: ['', [Validators.required]],
      description: ['', [Validators.required, CreateNewPlantComponent.descriptionValidator]],
      careInstructions: ['', [Validators.required, Validators.minLength(10)]],
      lightRequirement: ['', [Validators.required]],
      waterRequirement: ['', [Validators.required]],
      careDifficulty: ['', [Validators.required]],
      suitableLocation: ['', [Validators.required, CreateNewPlantComponent.suitableLocationValidator]],
      commonDiseases: ['', [CreateNewPlantComponent.commonDiseasesValidator]],
      imageUrls: [[]]
    });
  }

  ngOnInit(): void {
    this.loadPlantOptions();
    this.loadCategories();
  }

  ngOnDestroy() {
    this.subscriptions.unsubscribe();
  }

  private initializeForm(): FormGroup {
    return this.fb.group({
      scientificName: ['', [
        Validators.required, 
        CreateNewPlantComponent.scientificNameValidator
      ]],
      commonName: ['', [
        Validators.required, 
        CreateNewPlantComponent.commonNameValidator
      ]],
      categoryId: [{value: '', disabled: false}, Validators.required],
      description: ['', [
        Validators.required, 
        CreateNewPlantComponent.descriptionValidator
      ]],
      careInstructions: ['', [Validators.required]],
      lightRequirement: ['', Validators.required],
      waterRequirement: ['', Validators.required],
      careDifficulty: ['', Validators.required],
      suitableLocation: ['', [
        Validators.required, 
        CreateNewPlantComponent.suitableLocationValidator
      ]],
      commonDiseases: ['', [
        Validators.required, 
        CreateNewPlantComponent.commonDiseasesValidator
      ]]
    });
  }

  loadCategories() {
    this.isLoadingCategories = true;
    // Disable the select while loading
    this.createPlantForm.get('categoryId')?.disable();
    const sub = this.createNewPlantService.getCategories().subscribe({
      next: (categories: any) => {
        // Nếu API trả về object, lấy property chứa array; nếu là array thì gán trực tiếp
        if (Array.isArray(categories)) {
          this.categories = categories;
        } else if (categories && Array.isArray(categories.data)) {
          this.categories = categories.data;
        } else {
          this.categories = [];
        }
        this.isLoadingCategories = false;
        this.createPlantForm.get('categoryId')?.enable();
        this.cdr.detectChanges();
        console.info('Loaded', this.categories.length, 'categories successfully');
      },
      error: (error) => {
        console.error('Error loading categories:', error);
        this.toastService.error('Không thể tải danh mục cây. Vui lòng thử lại sau.');
        this.isLoadingCategories = false;
        this.createPlantForm.get('categoryId')?.enable();
        this.cdr.detectChanges();
      }
    });
    this.subscriptions.add(sub);
  }

  private loadPlantOptions(): void {
    this.lightRequirements = this.plantOptionsService.getLightRequirementOptions();
    this.waterRequirements = this.plantOptionsService.getWaterRequirementOptions();
    this.careDifficulties = this.plantOptionsService.getCareDifficultyOptions();
    this.suitableLocationOptions = this.plantOptionsService.getSuitableLocationOptions();
  }

  onImageSelect(event: any) {
    const files = Array.from(event.target.files) as File[];
    
    if (files.length === 0) return;
    
    // Validate file types and sizes
    const validFiles = files.filter(file => {
      const isValidType = file.type.startsWith('image/');
      const isValidSize = file.size <= 5 * 1024 * 1024; // 5MB max
      
      if (!isValidType) {
        this.toastService.error(`${file.name} không phải là file ảnh`);
        return false;
      }
      
      if (!isValidSize) {
        this.toastService.error(`${file.name} có kích thước quá lớn (tối đa 5MB)`);
        return false;
      }
      
      return true;
    });

    if (validFiles.length > 0) {
      this.selectedImages = [...this.selectedImages, ...validFiles];
      this.uploadImages(validFiles);
    }
  }

  uploadImages(files: File[]) {
    // Use setTimeout to avoid ExpressionChangedAfterItHasBeenCheckedError
    setTimeout(() => {
      this.isUploadingImages = true;
      this.cdr.detectChanges();
    });

    const uploadObservables = files.map(file =>
      this.createNewPlantService.uploadImage(file).pipe(
        catchError((error: any) => {
          this.toastService.error(`Không thể upload ${file.name}`);
          return of({ url: null });
        })
      )
    );

    forkJoin(uploadObservables).subscribe((results: any[]) => {
      const validUrls = results.map((r: any) => r.url).filter((url: any) => url !== null) as string[];
      this.imageUrls = [...this.imageUrls, ...validUrls];
      
      // Use setTimeout to avoid ExpressionChangedAfterItHasBeenCheckedError
      setTimeout(() => {
        this.isUploadingImages = false;
        this.cdr.detectChanges();
      });

      // Reset input file để tránh double upload dialog
      if (this.imageUpload && this.imageUpload.nativeElement) {
        this.imageUpload.nativeElement.value = '';
      }

      if (validUrls.length > 0) {
        const isUsingMockUrls = validUrls.some((url: any) => url.includes('picsum.photos'));
        if (isUsingMockUrls) {
          this.toastService.info(`Đã thêm ${validUrls.length} ảnh (sử dụng ảnh demo)`);
        } else {
          this.toastService.success(`Đã upload ${validUrls.length} ảnh thành công`);
        }
      }
    });
  }

  removeImage(index: number) {
    this.imageUrls.splice(index, 1);
    this.selectedImages.splice(index, 1);
  }

  onSubmit() {
    if (this.createPlantForm.invalid) {
      this.markFormGroupTouched();
      this.toastService.error('Vui lòng kiểm tra và sửa các lỗi trong form');
      return;
    }

    if (this.imageUrls.length === 0) {
      this.toastService.error('Vui lòng thêm ít nhất 1 ảnh cho cây');
      return;
    }

    const formData = this.createPlantForm.value;
    
    // Debug: Log form data for validation
    console.log('🔍 Form data validation:', formData);

    // Use setTimeout to avoid ExpressionChangedAfterItHasBeenCheckedError
    setTimeout(() => {
      this.isSubmitting = true;
      this.cdr.detectChanges();
    });

    const plantData: CreatePlantRequest = {
      ...formData,
      imageUrls: this.imageUrls
    };

        const sub = this.createNewPlantService.createNewPlant(plantData).subscribe({
          next: (response) => {
            // Nếu backend trả về status 400 hoặc có message lỗi, không báo thành công
            const statusNum = Number(response?.status);
            if (
              (response && !isNaN(statusNum) && statusNum >= 400 && response.message) ||
              (response && !isNaN(statusNum) && statusNum === 400)
            ) {
              setTimeout(() => {
                this.isSubmitting = false;
                this.cdr.detectChanges();
              });
              this.toastService.error(response.message || 'Dữ liệu không hợp lệ. Vui lòng kiểm tra lại');
              return;
            }
            this.toastService.success('Tạo cây mới thành công!');
            setTimeout(() => {
              this.isSubmitting = false;
              this.cdr.detectChanges();
            });
            // Reset form
            this.createPlantForm.reset();
            this.imageUrls = [];
            this.selectedImages = [];
            // Hỏi user muốn đi đâu tiếp theo
            this.showSuccessOptions(response);
          },
          error: (error) => {
            setTimeout(() => {
              this.isSubmitting = false;
              this.cdr.detectChanges();
            });
            if (error && error.error && error.error.message) {
              this.toastService.error(error.error.message);
            } else if (error.status === 400) {
              this.toastService.error('Dữ liệu không hợp lệ. Vui lòng kiểm tra lại');
            } else if (error.status === 403) {
              this.toastService.error('Bạn không có quyền tạo cây mới');
            } else {
              this.toastService.error('Không thể tạo cây mới. Vui lòng thử lại');
            }
          }
        });
        this.subscriptions.add(sub);
  }

  private markFormGroupTouched() {
    Object.keys(this.createPlantForm.controls).forEach(key => {
      const control = this.createPlantForm.get(key);
      control?.markAsTouched();
    });
  }

  isFieldInvalid(fieldName: string): boolean {
    const field = this.createPlantForm.get(fieldName);
    return !!(field?.invalid && field?.touched);
  }

  getFieldError(fieldName: string): string {
    const field = this.createPlantForm.get(fieldName);
    
    if (field?.errors) {
      if (field.errors['required']) {
        return `${this.getFieldLabel(fieldName)} không được để trống`;
      }
      if (field.errors['minlength']) {
        const required = field.errors['minlength'].requiredLength;
        return `${this.getFieldLabel(fieldName)} phải có ít nhất ${required} ký tự`;
      }
      if (field.errors['maxlength']) {
        const max = field.errors['maxlength'].requiredLength;
        return `${this.getFieldLabel(fieldName)} không được vượt quá ${max} ký tự`;
      }
      // Custom validation errors
      if (field.errors['scientificName']) {
        return field.errors['scientificName'];
      }
      if (field.errors['commonName']) {
        return field.errors['commonName'];
      }
      if (field.errors['description']) {
        return field.errors['description'];
      }
      if (field.errors['suitableLocation']) {
        return field.errors['suitableLocation'];
      }
      if (field.errors['commonDiseases']) {
        return field.errors['commonDiseases'];
      }
    }
    
    return '';
  }

  private getFieldLabel(fieldName: string): string {
    const labels: {[key: string]: string} = {
      scientificName: 'Tên khoa học',
      commonName: 'Tên thông thường',
      categoryId: 'Danh mục',
      description: 'Mô tả',
      careInstructions: 'Hướng dẫn chăm sóc',
      lightRequirement: 'Yêu cầu ánh sáng',
      waterRequirement: 'Yêu cầu nước',
      careDifficulty: 'Độ khó chăm sóc',
      suitableLocation: 'Vị trí phù hợp',
      commonDiseases: 'Bệnh thường gặp'
    };
    
    return labels[fieldName] || fieldName;
  }

  goBack() {
    this.router.navigate(['/user/my-garden']);
  }

  goToPlantInfo() {
    this.router.navigate(['/plant-info']);
  }

  /**
   * Hiển thị tùy chọn sau khi tạo cây thành công
   */
  showSuccessOptions(response: any) {
    // Hiển thị thông báo chi tiết về việc cây đã được tạo
    const successMessage = `
🌱 Cây mới đã được tạo thành công!

Cây của bạn bây giờ sẽ xuất hiện trong:
• Khu vườn cá nhân của bạn
• Danh sách tất cả cây (sau khi được duyệt)

Bạn muốn xem ở đâu tiếp theo?
    `.trim();

    // Tạo một setTimeout để hiển thị confirm dialog
    setTimeout(() => {
      const userChoice = confirm(
        successMessage + '\n\n' +
        '• OK: Xem danh sách tất cả cây\n' +
        '• Cancel: Về khu vườn cá nhân'
      );

      if (userChoice) {
        // User chọn OK - đi đến plant-info (danh sách tất cả cây)
        this.router.navigate(['/plant-info']);
      } else {
        // User chọn Cancel - đi đến my-garden (khu vườn cá nhân)
        this.router.navigate(['/user/my-garden']);
      }
    }, 800);
  }
}
