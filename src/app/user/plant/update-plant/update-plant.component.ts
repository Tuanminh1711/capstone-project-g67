import { Component, OnInit, OnDestroy, HostListener, ChangeDetectorRef, ViewEncapsulation } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router, ActivatedRoute, NavigationEnd } from '@angular/router';
import { Subject, takeUntil, filter } from 'rxjs';
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
    // Clear current plant initially
    this.currentPlant = null;
  }

  ngOnInit(): void {
    // Clear current plant if not authenticated
    if (!this.checkAuthenticationSafely()) {
      this.currentPlant = null;
      this.allUserPlants = [];
    }

    // Delay to ensure cookie service is ready on page reload
    setTimeout(() => {
      this.initializeComponent();
    }, 100);

    // Listen to route parameter changes
    this.route.params
      .pipe(takeUntil(this.destroy$))
      .subscribe(params => {
        this.userPlantId = params['id'];
        if (this.userPlantId && this.allUserPlants.length > 0) {
          this.findAndSetCurrentPlant();
        } else if (this.userPlantId) {
          // If we have userPlantId but no plants data, load it
          this.initializeComponent();
        }
      });

    // Listen to route navigation changes
    this.router.events
      .pipe(
        filter(event => event instanceof NavigationEnd),
        takeUntil(this.destroy$)
      )
      .subscribe(() => {
        // Reload if we're on the update-plant route
        if (this.router.url.includes('/update-plant')) {
          this.initializeComponent();
        }
      });

    // Listen to successful login events
    this.authDialogService.loginSuccess$
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        // Reload data after successful login
        setTimeout(() => {
          this.initializeComponent();
        }, 300);
      });
  }

  ngOnDestroy(): void {
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

    this.currentPlant = this.allUserPlants.find(p => p.userPlantId.toString() === this.userPlantId) || null;
    
    if (this.currentPlant) {
      this.populateForm();
      this.errorMessage = '';
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
    
    // Convert date to the required format
    const plantingDate = new Date(formValues.plantingDate);
    plantingDate.setHours(0, 0, 0, 0); // Set to start of day
    
    const updateData: UpdatePlantRequest = {
      userPlantId: this.userPlantId,
      nickname: formValues.nickname.trim(),
      plantingDate: plantingDate.toISOString(),
      locationInHouse: formValues.locationInHouse.trim(),
      reminderEnabled: formValues.reminderEnabled
    };

    console.log('Updating plant with data:', updateData);

    this.myGardenService.updateUserPlant(updateData)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.isSubmitting = false;
          
          if (response && (response.status === 200 || response.message?.includes('success') || response.message?.includes('thành công'))) {
            this.toastService.success('Cập nhật thông tin cây thành công!');
            
            // Navigate back to my garden after successful update
            setTimeout(() => {
              this.router.navigate(['/user/my-garden']);
            }, 1000);
          } else {
            this.errorMessage = 'Không thể cập nhật thông tin cây';
            this.toastService.error('Có lỗi xảy ra khi cập nhật. Vui lòng thử lại.');
          }
        },
        error: (error) => {
          this.isSubmitting = false;
          this.handleUpdateError(error);
        }
      });
  }

  private handleUpdateError(error: any): void {
    let errorMessage = 'Không thể cập nhật thông tin cây';
    
    switch(error.status) {
      case 400:
        errorMessage = 'Thông tin không hợp lệ. Vui lòng kiểm tra lại.';
        break;
      case 401:
      case 403:
        errorMessage = 'Bạn không có quyền chỉnh sửa cây này.';
        break;
      case 404:
        errorMessage = 'Không tìm thấy cây để cập nhật.';
        break;
      case 500:
        errorMessage = 'Lỗi server. Vui lòng thử lại sau.';
        break;
      default:
        errorMessage = 'Có lỗi xảy ra. Vui lòng thử lại.';
    }
    
    this.errorMessage = errorMessage;
    this.toastService.error(errorMessage);
    console.error('Update error:', error);
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
