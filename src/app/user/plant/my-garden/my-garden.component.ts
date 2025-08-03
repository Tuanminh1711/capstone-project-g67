import { environment } from '../../../../environments/environment';
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

import { ChangeDetectionStrategy } from '@angular/core';
@Component({
  selector: 'app-my-garden',
  standalone: true,
  imports: [CommonModule, TopNavigatorComponent, ConfirmationDialogComponent, CareReminderDialogComponent],
  templateUrl: './my-garden.html',
  styleUrls: ['./my-garden.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class MyGardenComponent implements OnInit, OnDestroy {
  // Map to store reminder enabled state for each userPlantId
  reminderEnabledMap: { [userPlantId: number]: boolean } = {};
  userPlants: UserPlant[] = [];
  isLoading = false;
  errorMessage = '';
  successMessage = '';
  // Chỉ còn layout garden, không cần biến layout nữa
  // Không cần filter nữa
  

  private destroy$ = new Subject<void>();

  // Helper method to safely check authentication status
  private checkAuthenticationSafely(): boolean {
    try {
      // You may want to check for a valid token or session here
      return !!this.cookieService.getAuthToken();
    } catch {
      return false;
    }
  }

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

  // After loading userPlants, fetch reminder state for each
  private fetchAllReminders() {
    if (!this.userPlants) return;
    for (const plant of this.userPlants) {
      this.fetchReminderState(plant.userPlantId);
    }
    this.cdr.markForCheck();
  }

  private fetchReminderState(userPlantId: number) {
    this.http.get<any[]>(`${environment.apiUrl}/plant-care/${userPlantId}/care-reminders`).subscribe({
      next: (schedules) => {
        this.reminderEnabledMap[userPlantId] = schedules.some(s => s.enabled);
        this.cdr.markForCheck();
      },
      error: () => {
        this.reminderEnabledMap[userPlantId] = false;
        this.cdr.markForCheck();
      }
    });
  }

  // Call fetchAllReminders after userPlants are loaded/refreshed
  private onUserPlantsLoaded() {
    this.fetchAllReminders();
  }

  // Toggle all reminders for a plant (bật/tắt tất cả loại nhắc nhở)
  toggleAllReminders(plant: UserPlant): void {
    if (!plant) return;
    const enable = !this.reminderEnabledMap[plant.userPlantId];
    // Lấy schedules mặc định (có message và giờ) và set enabled theo trạng thái mong muốn
    const schedules = getDefaultCareReminders().map(s => ({
      ...s,
      enabled: enable
    }));
    this.careReminderService.updateCareReminders(plant.userPlantId, schedules).subscribe({
      next: (res) => {
        // Sau khi cập nhật, reload lại toàn bộ danh sách cây để đảm bảo đồng bộ trạng thái
        this.loadPlantDataImmediate();
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
        this.toastService.error('Không thể lấy thông tin nhắc nhở.');
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
          this.toastService.success('Cập nhật nhắc nhở thành công!');
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





  get isLoggedIn(): boolean {
    return this.checkAuthenticationSafely();
  }


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
    this.myGardenService.getUserPlants(0, 10)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          setTimeout(() => {
            this.isLoading = false;
            
            // Kiểm tra response success
            if (response?.status === 200 && response?.data?.content && Array.isArray(response.data.content)) {
              const plants = response.data.content;
              
              if (plants.length > 0) {
                // Filter out plants with null plantId và log để debug
                const validPlants = plants.filter((p: any) => {
                  if (!p.plantId) {
                    console.warn('Plant with null plantId found:', p);
                    return false;
                  }
                  return true;
                });

                if (validPlants.length > 0) {
                  // Map API response to userPlants array
                  this.userPlants = validPlants.map((p: any) => ({
                    userPlantId: p.userPlantId,
                    plantId: p.plantId,
                    imageUrl: p.imageUrl,
                    nickname: p.nickname,
                    plantLocation: p.plantLocation,
                    // Add default values for fields not present in API
                    reminderEnabled: false
                  }));
                  this.errorMessage = '';
                  // Show success message if this is a refresh after adding a plant
                  if (this.successMessage) {
                    this.toastService.success(`🌱 Tìm thấy ${validPlants.length} cây trong vườn của bạn!`);
                  }
                  this.onUserPlantsLoaded();
                } else {
                  this.userPlants = [];
                  this.errorMessage = 'Có vấn đề với dữ liệu cây trong vườn. Vui lòng liên hệ hỗ trợ.';
                }
              } else {
                this.userPlants = [];
                this.errorMessage = 'Bạn chưa có cây nào trong vườn. 🌱\nHãy bắt đầu bằng cách thêm cây đầu tiên của bạn!';
              }
            } else {
              // Fallback: kiểm tra các format khác
              let plants: any[] = [];
              
              if ((response as any)?.content && Array.isArray((response as any).content)) {
                plants = (response as any).content;
              } else if (response?.data && Array.isArray(response.data)) {
                plants = response.data as any[];
              } else if (Array.isArray(response)) {
                plants = response as any[];
              }
              
              if (plants.length > 0) {
                // Filter out plants with null plantId cho fallback case
                const validPlants = plants.filter((p: any) => {
                  if (!p.plantId && !p.id) {
                    console.warn('Plant with null ID found in fallback:', p);
                    return false;
                  }
                  return true;
                });

                if (validPlants.length > 0) {
                  this.userPlants = validPlants.map((p: any) => ({
                    userPlantId: p.userPlantId || p.id,
                    plantId: p.plantId || p.id,
                    imageUrl: p.imageUrl,
                    nickname: p.nickname || p.name,
                    plantLocation: p.plantLocation || p.location || 'Vị trí không xác định',
                    reminderEnabled: false
                  }));
                  this.errorMessage = '';
                  // Show success message for fallback format too
                  if (this.successMessage) {
                    this.toastService.success(`🌱 Tìm thấy ${validPlants.length} cây trong vườn của bạn!`);
                  }
                  this.onUserPlantsLoaded();
                } else {
                  this.userPlants = [];
                  this.errorMessage = 'Có vấn đề với dữ liệu cây trong vườn. Vui lòng liên hệ hỗ trợ.';
                }
              } else {
                this.userPlants = [];
                this.errorMessage = 'Bạn chưa có cây nào trong vườn. 🌱\nHãy bắt đầu bằng cách thêm cây đầu tiên của bạn!';
              }
            }
            this.cdr.markForCheck();
          }, 0);
        },
        error: (error) => {
          setTimeout(() => {
            this.isLoading = false;
            this.userPlants = [];
            this.handleApiError(error);
            this.cdr.markForCheck();
          }, 0);
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
    // Xử lý lỗi đặc biệt về null plantId
    if (err.error?.message?.includes('Cannot invoke "java.lang.Long.longValue()"')) {
      this.errorMessage = 'Có vấn đề với dữ liệu cây trong hệ thống. 🔧\nVui lòng liên hệ hỗ trợ để khắc phục.';
      this.toastService.error('Dữ liệu không hợp lệ. Vui lòng liên hệ hỗ trợ.');
      return;
    }

    switch(err.status) {
      case 404:
        this.errorMessage = 'Bạn chưa có cây nào trong vườn. 🌱\nHãy bắt đầu bằng cách thêm cây đầu tiên của bạn!';
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
      case 400:
        // Handle 400 errors with more specific messages
        if (err.error?.message) {
          this.errorMessage = 'Có lỗi xảy ra: ' + err.error.message;
        } else {
          this.errorMessage = 'Yêu cầu không hợp lệ. Vui lòng thử lại.';
        }
        break;
      default:
        // Nếu response có dữ liệu rỗng nhưng status thành công thì không phải lỗi
        if (err.status === 200) {
          this.errorMessage = 'Bạn chưa có cây nào trong vườn. 🌱\nHãy bắt đầu bằng cách thêm cây đầu tiên của bạn!';
        } else {
          this.errorMessage = 'Đã có lỗi xảy ra. Vui lòng thử lại.';
        }
    }
    
    // Chỉ hiển thị toast cho lỗi thực sự, không phải empty data
    if (err.status !== 200 && err.status !== 404) {
      this.toastService.error(this.errorMessage);
    }
  }

  viewPlantDetail(userPlantId: number): void {
    // Validate userPlantId
    if (!userPlantId || userPlantId <= 0) {
      this.toastService.error('Dữ liệu cây không hợp lệ. Vui lòng refresh trang.');
      return;
    }

    if (userPlantId) {
      this.router.navigate(['/user/user-plant-detail', userPlantId]);
    } else {
      this.toastService.error('Không tìm thấy cây này trong vườn của bạn');
    }
  }

  removePlantFromCollection(userPlantId: number, plantName?: string): void {
    const targetPlant = this.userPlants.find(p => p.userPlantId === userPlantId);
    if (!targetPlant) {
      this.toastService.error('Không tìm thấy cây trong bộ sưu tập');
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
          this.performDeletePlant(userPlantId, displayName);
        }
      });
  }

  private performDeletePlant(userPlantId: number, plantName?: string): void {    
    // Hiển thị loading state
    this.isLoading = true;
    this.errorMessage = '';
    this.cdr.markForCheck();

    this.myGardenService.removePlantFromCollection(userPlantId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          setTimeout(() => {
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
                // Sau khi reload danh sách cây, đồng bộ lại reminder
                setTimeout(() => {
                  this.fetchAllReminders();
                  this.cdr.markForCheck();
                }, 300);
              }, 500);
            } else {
              // Response không success
              this.toastService.error('Có lỗi xảy ra khi xóa cây. Vui lòng thử lại.');
            }
            this.cdr.markForCheck();
          }, 0);
        },
        error: (err) => {
          setTimeout(() => {
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
            this.cdr.markForCheck();
          }, 0);
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
    // Validate plantId trước khi xử lý
    if (!plantId || plantId <= 0) {
      this.toastService.error('Dữ liệu cây không hợp lệ. Vui lòng refresh trang.');
      return;
    }

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
    this.successMessage = 'refreshing'; // Flag để hiển thị success message
    this.initializeComponent();
  }

  // Method để handle success callback từ các page khác
  onPlantAdded(): void {
    this.successMessage = 'added';
    this.refreshGarden();
  }

  // Thêm method để handle user action khi chưa đăng nhập
  handleAuthRequired(): void {
    this.toastService.warning('Vui lòng đăng nhập để xem khu vườn của bạn');
    this.authDialogService.openLoginDialog();
  }

  // Sửa lại: truyền đúng userPlantId cho nút sửa
  editPlant(userPlantId: number, plantName?: string): void {
    if (!userPlantId) {
      this.toastService.error('Không thể chỉnh sửa cây này');
      return;
    }
    this.router.navigate(['/update-plant', userPlantId]);
  }
}
