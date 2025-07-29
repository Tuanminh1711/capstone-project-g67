import { Component, OnInit, OnDestroy, ChangeDetectorRef, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { Subscription, forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { CreateNewPlantService, CreatePlantRequest, Category } from './create-new-plant.service';
import { ToastService } from '../../../shared/toast/toast.service';
import { TopNavigatorComponent } from '../../../shared/top-navigator/top-navigator.component';

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

  // Options cho dropdowns
  lightRequirements = [
    { value: 'LOW', label: 'Ánh sáng yếu' },
    { value: 'MEDIUM', label: 'Ánh sáng vừa' },
    { value: 'HIGH', label: 'Ánh sáng mạnh' }
  ];

  waterRequirements = [
    { value: 'LOW', label: 'Ít nước' },
    { value: 'MEDIUM', label: 'Vừa phải' },
    { value: 'HIGH', label: 'Nhiều nước' }
  ];

  careDifficulties = [
    { value: 'EASY', label: 'Dễ chăm sóc' },
    { value: 'MODERATE', label: 'Trung bình' },
    { value: 'DIFFICULT', label: 'Khó chăm sóc' }
  ];

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private createPlantService: CreateNewPlantService,
    private toastService: ToastService,
    private cdr: ChangeDetectorRef
  ) {
    this.createPlantForm = this.initializeForm();
  }

  ngOnInit() {
    this.loadCategories();
  }

  ngOnDestroy() {
    this.subscriptions.unsubscribe();
  }

  private initializeForm(): FormGroup {
    return this.fb.group({
      scientificName: ['', [Validators.required, Validators.minLength(3)]],
      commonName: ['', [Validators.required, Validators.minLength(2)]],
      categoryId: [{value: '', disabled: false}, Validators.required],
      description: ['', [Validators.required, Validators.minLength(10)]],
      careInstructions: ['', [Validators.required, Validators.minLength(10)]],
      lightRequirement: ['', Validators.required],
      waterRequirement: ['', Validators.required],
      careDifficulty: ['', Validators.required],
      suitableLocation: ['', [Validators.required, Validators.minLength(5)]],
      commonDiseases: ['', [Validators.required, Validators.minLength(5)]]
    });
  }

  loadCategories() {
    this.isLoadingCategories = true;
    // Disable the select while loading
    this.createPlantForm.get('categoryId')?.disable();
    const sub = this.createPlantService.getCategories().subscribe({
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
    this.isUploadingImages = true;
    this.cdr.detectChanges(); // Trigger change detection

    const uploadObservables = files.map(file =>
      this.createPlantService.uploadImage(file).pipe(
        catchError((error: any) => {
          this.toastService.error(`Không thể upload ${file.name}`);
          return of({ url: null });
        })
      )
    );

    forkJoin(uploadObservables).subscribe((results: any[]) => {
      const validUrls = results.map((r: any) => r.url).filter((url: any) => url !== null) as string[];
      this.imageUrls = [...this.imageUrls, ...validUrls];
      // Sửa lỗi ExpressionChangedAfterItHasBeenCheckedError bằng setTimeout
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
      this.toastService.error('Vui lòng điền đầy đủ thông tin');
      return;
    }

    if (this.imageUrls.length === 0) {
      this.toastService.error('Vui lòng thêm ít nhất 1 ảnh');
      return;
    }

    this.isSubmitting = true;

    const formData = this.createPlantForm.value;
    const plantData: CreatePlantRequest = {
      ...formData,
      imageUrls: this.imageUrls
    };

        const sub = this.createPlantService.createNewPlant(plantData).subscribe({
          next: (response) => {
            // Nếu backend trả về status 400 hoặc có message lỗi, không báo thành công
            const statusNum = Number(response?.status);
            if (
              (response && !isNaN(statusNum) && statusNum >= 400 && response.message) ||
              (response && !isNaN(statusNum) && statusNum === 400)
            ) {
              this.isSubmitting = false;
              this.toastService.error(response.message || 'Dữ liệu không hợp lệ. Vui lòng kiểm tra lại');
              return;
            }
            this.toastService.success('Tạo cây mới thành công!');
            this.isSubmitting = false;
            // Reset form
            this.createPlantForm.reset();
            this.imageUrls = [];
            this.selectedImages = [];
            // Hỏi user muốn đi đâu tiếp theo
            this.showSuccessOptions(response);
          },
          error: (error) => {
            this.isSubmitting = false;
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
      if (field.errors['required']) return `${this.getFieldLabel(fieldName)} là bắt buộc`;
      if (field.errors['minlength']) return `${this.getFieldLabel(fieldName)} quá ngắn`;
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
