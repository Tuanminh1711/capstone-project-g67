import { Component, OnInit, OnDestroy, HostListener, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Router, NavigationEnd } from '@angular/router';
import { Subject, takeUntil, filter } from 'rxjs';
import { TopNavigatorComponent } from '../../../shared/top-navigator/index';
import { CookieService } from '../../../auth/cookie.service';
import { ToastService } from '../../../shared/toast/toast.service';
import { AuthDialogService } from '../../../auth/auth-dialog.service';
import { MyGardenService, UserPlant, ApiResponse, PaginatedResponse } from './my-garden.service';
import { CareReminderService, CareReminderSchedule, CARE_TYPES, getDefaultCareReminders } from './care-reminder.service';
import { CareReminderDialogComponent } from './care-reminder-dialog.component';
import { ConfirmationDialogService } from '../../../shared/confirmation-dialog/confirmation-dialog.service';
import { ConfirmationDialogComponent } from '../../../shared/confirmation-dialog/confirmation-dialog.component';

@Component({
  selector: 'app-my-garden',
  standalone: true,
  imports: [CommonModule, TopNavigatorComponent, ConfirmationDialogComponent, CareReminderDialogComponent],
  templateUrl: './my-garden.html',
  styleUrls: ['./my-garden.scss']
})
export class MyGardenComponent implements OnInit, OnDestroy {
  userPlants: UserPlant[] = [];
  isLoading = false;
  errorMessage = '';
  successMessage = '';
  layout: 'grid' | 'list' | 'garden' = 'garden';
  filter: 'all' | 'reminder' | 'no-reminder' | 'recent' = 'all';
  
  private destroy$ = new Subject<void>();

  constructor(
    private http: HttpClient,
    public router: Router,
    public cookieService: CookieService,
    private toastService: ToastService,
    private myGardenService: MyGardenService,
    private authDialogService: AuthDialogService,
    private confirmationDialogService: ConfirmationDialogService,

    private cdr: ChangeDetectorRef,
    private careReminderService: CareReminderService
  ) {
    // Đảm bảo userPlants rỗng ngay từ đầu
    this.userPlants = [];
  }

  // Toggle all reminders for a plant (bật/tắt tất cả loại nhắc nhở)
  toggleAllReminders(plant: UserPlant): void {
    if (!plant) return;
    const enable = !plant.reminderEnabled;
    // Lấy schedules mặc định (có message và giờ) và set enabled theo trạng thái mong muốn
    const schedules = getDefaultCareReminders().map(s => ({
      ...s,
      enabled: enable
    }));
    this.careReminderService.updateCareReminders(plant.userPlantId, schedules).subscribe({
      next: (res) => {
        plant.reminderEnabled = enable;
        if (typeof res === 'string' && res.includes('thành công')) {
          this.toastService.success(res);
        } else {
          this.toastService.success(enable ? 'Đã bật tất cả nhắc nhở cho cây!' : 'Đã tắt tất cả nhắc nhở cho cây!');
        }
        this.cdr.markForCheck();
      },
      error: () => {
        this.toastService.error('Không thể cập nhật nhắc nhở.');
      }
    });
  }

  // State cho dialog tuỳ chỉnh nhắc nhở
  showCareReminderDialog = false;
  careReminderDialogSchedules: CareReminderSchedule[] = [];
  careReminderDialogPlant: UserPlant | null = null;

  openReminderTypeDialog(plant: UserPlant): void {
    this.careReminderService.getCareReminders(plant.userPlantId).subscribe({
      next: (res) => {
        this.careReminderDialogSchedules = res.schedules || CARE_TYPES.map(t => ({ careTypeId: t.careTypeId, enabled: true }));
        this.careReminderDialogPlant = plant;
        this.showCareReminderDialog = true;
        this.cdr.markForCheck();
      },
      error: () => {
        this.toastService.error('Không lấy được trạng thái nhắc nhở.');
      }
    });
  }

  onCareReminderDialogSave(schedules: CareReminderSchedule[]) {
    if (!this.careReminderDialogPlant) return;
    this.careReminderService.updateCareReminders(this.careReminderDialogPlant.userPlantId, schedules).subscribe({
      next: (res) => {
        // Cập nhật trạng thái reminderEnabled tổng nếu tất cả đều bật hoặc tất cả đều tắt
        const allEnabled = schedules.every(s => s.enabled);
        this.careReminderDialogPlant!.reminderEnabled = allEnabled;
        if (typeof res === 'string' && res.includes('thành công')) {
          this.toastService.success(res);
        } else {
          this.toastService.success('Đã cập nhật nhắc nhở từng loại!');
        }
        this.showCareReminderDialog = false;
        this.cdr.markForCheck();
      },
      error: () => {
        this.toastService.error('Không thể cập nhật nhắc nhở.');
      }
    });
  }

  onCareReminderDialogClose() {
    this.showCareReminderDialog = false;
    this.careReminderDialogPlant = null;
    this.careReminderDialogSchedules = [];
    this.cdr.markForCheck();
  }

  get filteredPlants(): UserPlant[] {
    switch (this.filter) {
      case 'reminder':
        return this.userPlants.filter(p => p.reminderEnabled);
      case 'no-reminder':
        return this.userPlants.filter(p => !p.reminderEnabled);
      case 'recent':
        return this.userPlants; // Có thể bổ sung trường plantedDate nếu backend hỗ trợ
      default:
        return this.userPlants;
    }
  }

  private checkAuthenticationSafely(): boolean {
    try {
      if (typeof document === 'undefined') return false;
      const token = this.cookieService.getAuthToken();
      return !!token && token.trim().length > 0;
    } catch {
      return false;
    }
  }

  get isLoggedIn(): boolean {
    return this.checkAuthenticationSafely();
  }

  // Computed properties for backward compatibility with template
  get loading(): boolean {
    return this.isLoading;
  }

  get error(): string {
    return this.errorMessage;
  }

  ngOnInit(): void {
    if (!this.isLoggedIn) this.userPlants = [];
    setTimeout(() => this.initializeComponent(), 100);
    this.router.events
      .pipe(filter(event => event instanceof NavigationEnd), takeUntil(this.destroy$))
      .subscribe(() => {
        if (this.router.url.includes('/my-garden')) this.initializeComponent();
      });
    this.authDialogService.loginSuccess$
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => setTimeout(() => this.initializeComponent(), 300));
  }

  private initializeComponent(): void {
    const isAuthenticated = this.checkAuthenticationSafely();
    if (!isAuthenticated) {
      this.userPlants = [];
      this.isLoading = false;
      setTimeout(() => {
        if (!this.checkAuthenticationSafely()) {
          this.errorMessage = 'Bạn chưa đăng nhập';
          this.cdr.detectChanges();
        } else {
          this.loadPlantDataImmediate();
        }
      }, 200);
      return;
    }
    this.errorMessage = '';
    this.loadPlantDataImmediate();
  }

  private loadPlantDataImmediate(): void {
    this.isLoading = true;
    this.errorMessage = '';
    this.successMessage = '';
    this.myGardenService.getUserPlants(0, 50)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.isLoading = false;
          if (response?.data?.content) {
            this.userPlants = response.data.content;
            this.errorMessage = '';
          } else if (Array.isArray(response)) {
            this.userPlants = response;
            this.errorMessage = '';
          } else {
            this.userPlants = [];
            this.errorMessage = 'Không tìm thấy dữ liệu';
          }
          this.cdr.markForCheck();
        },
        error: (error) => {
          this.isLoading = false;
          this.userPlants = [];
          this.handleApiError(error);
          this.cdr.markForCheck();
        }
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadUserPlants(): void {
    // Public method để template có thể gọi
    this.initializeComponent();
  }

  private handleApiError(err: any): void {
    switch(err.status) {
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
        this.errorMessage = 'Đã có lỗi xảy ra. Vui lòng thử lại.';
    }
    
    this.toastService.error(this.errorMessage);
  }

  viewPlantDetail(userPlantId: number): void {
    if (userPlantId) {
      this.router.navigate(['/user/user-plant-detail', userPlantId]);
    } else {
      this.toastService.error('Không tìm thấy cây này trong vườn của bạn');
    }
  }

  removePlantFromCollection(plantId: number, plantName?: string): void {
    // Find the plant object to get the correct userPlantId
    const targetPlant = this.userPlants.find(p => p.plantId === plantId);
    if (!targetPlant) {
      this.toastService.error('Không tìm thấy cây trong bộ sưu tập');
      return;
    }

    const userPlantId = targetPlant.userPlantId;
    if (!userPlantId) {
      this.toastService.error('Không thể xóa cây này');
      return;
    }
    
    const displayName = plantName || targetPlant.nickname || 'cây này';
    
    const dialogData = {
      title: 'Xóa cây khỏi bộ sưu tập',
      message: `Bạn có chắc chắn muốn xóa cây "${displayName}" khỏi bộ sưu tập không?\n\nHành động này không thể hoàn tác.`,
      confirmText: 'Xóa',
      cancelText: 'Hủy',
      icon: '🗑️',
      type: 'danger' as const
    };

    this.confirmationDialogService.showDialog(dialogData)
      .pipe(takeUntil(this.destroy$))
      .subscribe((confirmed: boolean) => {
        if (confirmed) {
          // Use userPlantId for deletion
          this.performDeletePlant(userPlantId, displayName);
        }
      });
  }

  private performDeletePlant(userPlantId: number, plantName?: string): void {    
    // Hiển thị loading state
    this.isLoading = true;
    this.errorMessage = '';
    this.cdr.detectChanges();

    this.myGardenService.removePlantFromCollection(userPlantId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {          
          this.isLoading = false;
          
          // Kiểm tra response có thực sự success không
          if (response && (response.status === 200 || response.message?.includes('success') || response.message?.includes('thành công'))) {
            // Hiển thị toast thông báo thành công
            const successMessage = plantName 
              ? `Đã xóa cây "${plantName}" khỏi bộ sưu tập thành công!`
              : 'Đã xóa cây khỏi bộ sưu tập thành công!';
            this.toastService.success(successMessage);
            
            // Force reload data với delay để đảm bảo server đã xử lý xong
            setTimeout(() => {
              this.loadPlantDataImmediate();
            }, 500);
          } else {
            // Response không success
            this.toastService.error('Có lỗi xảy ra khi xóa cây. Vui lòng thử lại.');
          }
        },
        error: (err) => {          
          this.isLoading = false;
          
          // Hiển thị toast thông báo lỗi chi tiết
          let errorMessage = 'Không thể xóa cây. Vui lòng thử lại.';
          if (err.status === 404) {
            errorMessage = 'Không tìm thấy cây để xóa.';
          } else if (err.status === 401 || err.status === 403) {
            errorMessage = 'Bạn không có quyền xóa cây này.';
          } else if (err.status === 500) {
            errorMessage = 'Lỗi server. Vui lòng thử lại sau.';
          }
          
          this.toastService.error(errorMessage);
          this.cdr.detectChanges();
        }
      });
  }

  // Method để refresh dữ liệu khi cần thiết
  onPageVisible(): void {
    // Load lại dữ liệu nếu chưa có hoặc không đang loading
    if (!this.isLoading && (this.userPlants.length === 0 || this.errorMessage)) {
      this.initializeComponent();
    }
  }

  @HostListener('window:focus', ['$event'])
  onWindowFocus(event: any): void {
    // Tự động refresh khi window được focus lại
    this.onPageVisible();
  }

  // Removed date-related methods since the new API doesn't provide created_at or plantDate
  // formatDate, getDaysAgo, getPlantAge methods are no longer used

  getReminderEnabledCount(): number {
    return this.userPlants.filter(p => p.reminderEnabled).length;
  }

  getReminderDisabledCount(): number {
    return this.userPlants.filter(p => !p.reminderEnabled).length;
  }

  getHealthyPlantsCount(): number {
    // For now, assume all plants are healthy
    // In a real app, this would check plant health status
    return this.userPlants.length;
  }

  carePlant(plantId: number): void {
    // Tìm userPlantId theo plantId
    const targetPlant = this.userPlants.find(p => p.plantId === plantId);
    const userPlantId = targetPlant?.userPlantId;
    if (userPlantId) {
      this.router.navigate(['/user/plant-care-reminder', userPlantId]);
    } else {
      this.toastService.error('Không tìm thấy cây này trong vườn của bạn');
    }
  }

  refreshGarden(): void {
    // Refresh dữ liệu theo pattern chuẩn
    this.initializeComponent();
  }

  // Thêm method để handle user action khi chưa đăng nhập
  handleAuthRequired(): void {
    this.toastService.warning('Vui lòng đăng nhập để xem khu vườn của bạn');
    this.authDialogService.openLoginDialog();
  }

  editPlant(plantId: number, plantName?: string): void {
    // Find the plant object to get the correct userPlantId
    const targetPlant = this.userPlants.find(p => p.plantId === plantId);
    if (!targetPlant) {
      this.toastService.error('Không tìm thấy cây trong bộ sưu tập');
      return;
    }

    const userPlantId = targetPlant.userPlantId;
    if (!userPlantId) {
      this.toastService.error('Không thể chỉnh sửa cây này');
      return;
    }
    
    // Navigate to update plant page
    this.router.navigate(['/update-plant', userPlantId]);
  }
}
