import { environment } from '../../../../../environments/environment';
import { Component, OnInit, OnDestroy, HostListener, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Router, NavigationEnd } from '@angular/router';
import { Subject, takeUntil, filter } from 'rxjs';
import { TopNavigatorComponent } from '../../../../shared/top-navigator/index';
import { CookieService } from '../../../../auth/cookie.service';
import { ToastService } from '../../../../shared/toast/toast.service';
import { AuthDialogService } from '../../../../auth/auth-dialog.service';
import { MyGardenService, UserPlant, ApiResponse, PaginatedResponse } from './my-garden.service';

// Extend UserPlant type to include imageUrls and images for template compatibility
declare module './my-garden.service' {
  interface UserPlant {
    imageUrls?: string[];
    images?: any[];
  }
}
import { CareReminderService, CareReminderSchedule, CARE_TYPES, getDefaultCareReminders } from './care-reminder.service';
import { CareReminderDialogComponent } from './care-reminder-dialog.component';
import { ConfirmationDialogService } from '../../../../shared/services/confirmation-dialog/confirmation-dialog.service';
import { ConfirmationDialogComponent } from '../../../../shared/components/confirmation-dialog/confirmation-dialog.component';

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
  // Track current image index for each plant (userPlantId)
  plantImageSlideIndex: { [userPlantId: number]: number } = {};

  // Get the image to display for a plant (slide)
  getPlantSlideImage(plant: UserPlant): string {
    if (plant.imageUrls && plant.imageUrls.length > 0) {
      const idx = this.plantImageSlideIndex[plant.userPlantId] ?? 0;
      return plant.imageUrls.slice(-3).reverse()[idx] || '/assets/image/logo.png';
    }
    return plant.imageUrl || '/assets/image/logo.png';
  }

  // Get number of images in the slide (max 3 newest)
  getPlantSlideCount(plant: UserPlant): number {
    return plant.imageUrls && plant.imageUrls.length > 0 ? Math.min(3, plant.imageUrls.length) : 1;
  }

  // Go to next image in slide
  nextPlantImage(plant: UserPlant): void {
    const count = this.getPlantSlideCount(plant);
    const current = this.plantImageSlideIndex[plant.userPlantId] ?? 0;
    this.plantImageSlideIndex[plant.userPlantId] = (current + 1) % count;
  }

  // Go to previous image in slide
  prevPlantImage(plant: UserPlant): void {
    const count = this.getPlantSlideCount(plant);
    const current = this.plantImageSlideIndex[plant.userPlantId] ?? 0;
    this.plantImageSlideIndex[plant.userPlantId] = (current - 1 + count) % count;
  }
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
    
    // Sử dụng service mới để thiết lập lịch mặc định hoàn chỉnh
    this.careReminderService.setupDefaultCareReminders(
      plant.userPlantId,
      enable,           // enabled status
      1,                // frequencyDays: 1 ngày
      '08:00',          // reminderTime: 8h sáng
      'Đã tới giờ chăm sóc cây'  // customMessage
    ).subscribe({
      next: (res) => {
        // Sau khi cập nhật, reload lại toàn bộ danh sách cây để đảm bảo đồng bộ trạng thái
        this.loadPlantDataImmediate();
        if (typeof res === 'string' && res.includes('thành công')) {
          this.toastService.success(res);
        } else {
          if (enable) {
            this.toastService.success('Đã thiết lập lịch nhắc nhở mặc định cho cây!', 5000);
          } else {
            this.toastService.success('Đã tắt tất cả nhắc nhở cho cây!');
          }
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
        // Nếu có schedules từ backend, sử dụng. Nếu không, tạo schedules mặc định đầy đủ
        if (res.schedules && res.schedules.length > 0) {
          this.careReminderDialogSchedules = res.schedules;
        } else {
          // Tạo schedules mặc định với thông tin lịch đầy đủ
          const tomorrow = new Date();
          tomorrow.setDate(tomorrow.getDate() + 1);
          const startDate = tomorrow.toISOString().slice(0, 10);
          
          this.careReminderDialogSchedules = CARE_TYPES.map(type => ({
            careTypeId: type.careTypeId,
            enabled: true,
            frequencyDays: 1,
            reminderTime: '08:00',
            customMessage: 'Đã tới giờ chăm sóc cây',
            startDate: startDate
          }));
        }
        
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
          // Hiển thị thông báo chi tiết về lịch đã thiết lập
          const enabledCount = schedules.filter(s => s.enabled).length;
          const totalCount = schedules.length;
          
          if (enabledCount === 0) {
            this.toastService.success('Đã tắt tất cả nhắc nhở cho cây!');
          } else if (enabledCount === totalCount) {
            this.toastService.success('Đã bật tất cả loại nhắc nhở với lịch mặc định: 8h sáng, 1 ngày/lần, bắt đầu từ ngày mai!', 6000);
          } else {
            // Hiển thị danh sách cụ thể những loại đã bật
            const enabledTypes = schedules
              .filter(s => s.enabled)
              .map(s => {
                const careType = CARE_TYPES.find(t => t.careTypeId === s.careTypeId);
                return careType?.careTypeName || `Loại ${s.careTypeId}`;
              })
              .join(', ');
            
            this.toastService.success(`Đã bật ${enabledCount}/${totalCount} loại nhắc nhở: ${enabledTypes}`, 6000);
          }
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
                  // Kiểm tra cả plantId và userPlantId
                  if (!p.plantId || !p.userPlantId) {
                    // Plant with null ID found - filtered out
                    return false;
                  }
                  // Đảm bảo plantId và userPlantId là số dương
                  if (isNaN(p.plantId) || isNaN(p.userPlantId) || p.plantId <= 0 || p.userPlantId <= 0) {
                    // Plant with invalid ID found - filtered out
                    return false;
                  }
                  return true;
                });

                if (validPlants.length > 0) {
                  // Map API response to userPlants array với validation
                  this.userPlants = validPlants.map((p: any) => {
                    // Always assign up to 3 newest imageUrls for slide and detail
                    let imageUrls: string[] = [];
                    if (Array.isArray(p.imageUrls) && p.imageUrls.length > 0) {
                      imageUrls = p.imageUrls.slice(-3).reverse();
                    } else if (Array.isArray(p.images) && p.images.length > 0) {
                      imageUrls = p.images.map((img: any) => img?.imageUrl).filter((url: string) => !!url).slice(-3).reverse();
                    } else if (p.imageUrl) {
                      imageUrls = [p.imageUrl];
                    }
                    return {
                      userPlantId: Number(p.userPlantId),
                      plantId: Number(p.plantId),
                      imageUrl: p.imageUrl,
                      imageUrls,
                      nickname: p.nickname || 'Cây chưa có tên',
                      plantLocation: p.plantLocation || 'Vị trí không xác định',
                      reminderEnabled: false
                    };
                  });
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
                  // Kiểm tra cả plantId/id và userPlantId
                  const plantId = p.plantId || p.id;
                  const userPlantId = p.userPlantId || p.id;
                  
                  if (!plantId || !userPlantId) {
                    // Plant with null ID found in fallback - filtered out
                    return false;
                  }
                  
                  // Đảm bảo IDs là số dương
                  if (isNaN(plantId) || isNaN(userPlantId) || plantId <= 0 || userPlantId <= 0) {
                    // Plant with invalid ID found in fallback - filtered out
                    return false;
                  }
                  
                  return true;
                });

                if (validPlants.length > 0) {
                  this.userPlants = validPlants.map((p: any) => {
                    let imageUrls: string[] = [];
                    if (Array.isArray(p.imageUrls) && p.imageUrls.length > 0) {
                      imageUrls = p.imageUrls.slice(-3).reverse();
                    } else if (Array.isArray(p.images) && p.images.length > 0) {
                      imageUrls = p.images.map((img: any) => img?.imageUrl).filter((url: string) => !!url).slice(-3).reverse();
                    } else if (p.imageUrl) {
                      imageUrls = [p.imageUrl];
                    }
                    return {
                      userPlantId: Number(p.userPlantId || p.id),
                      plantId: Number(p.plantId || p.id),
                      imageUrl: p.imageUrl,
                      imageUrls,
                      nickname: p.nickname || p.name || 'Cây chưa có tên',
                      plantLocation: p.plantLocation || p.location || 'Vị trí không xác định',
                      reminderEnabled: false
                    };
                  });
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
    // Xử lý lỗi đặc biệt về null plantId - lỗi backend data integrity
    if (err.error?.message?.includes('Cannot invoke "java.lang.Long.longValue()"') || 
        err.error?.message?.includes('getPlantId()') || 
        err.error?.message?.includes('getUserPlantId()') ||
        err.error?.message?.includes('Get user plants failed')) {
      
      // Thông báo rõ ràng về vấn đề database và hướng dẫn giải quyết
      this.errorMessage = '⚠️ Database có dữ liệu không hợp lệ (null plantId)\n\n' +
                          'Nguyên nhân: Có records trong UserPlants table với plantId = null\n' +
                          'Giải pháp: Admin cần:\n' +
                          '• Kiểm tra database: SELECT * FROM user_plants WHERE plant_id IS NULL;\n' +
                          '• Xóa hoặc update các records có plant_id = null\n' +
                          '• Hoặc thêm validation ở backend để filter null records';
      
      this.toastService.error('Database integrity issue. Liên hệ admin để clean up data.');
      
      // Retry với một request khác để test
      // Attempting fallback request...
      setTimeout(() => {
        // Có thể thử call với page size nhỏ hơn hoặc offset khác
        this.attemptFallbackRequest();
      }, 2000);
      
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

  // Fallback request method để test với parameters khác
  private attemptFallbackRequest(): void {
    // Attempting fallback request with different parameters...
    
    // Thử request với page size nhỏ hơn
    this.http.get<any>(`${environment.apiUrl}/user-plants?page=0&size=5`)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          // Fallback request successful
          this.toastService.success('Đã khôi phục kết nối. Đang load dữ liệu...');
          // Process the response như bình thường
          this.processUserPlantsResponse(response);
        },
        error: (err) => {
          this.toastService.error('Vẫn gặp lỗi database. Cần admin khắc phục.');
        }
      });
  }

  // Helper method để xử lý response 
  private processUserPlantsResponse(response: any): void {
    this.isLoading = false;
    
    // Kiểm tra response success
    if (response?.status === 200 && response?.data?.content && Array.isArray(response.data.content)) {
      const plants = response.data.content;
      
      if (plants.length > 0) {
        // Filter out plants with null plantId và log để debug
        const validPlants = plants.filter((p: any) => {
          // Kiểm tra cả plantId và userPlantId
          if (!p.plantId || !p.userPlantId) {
            return false;
          }
          // Đảm bảo plantId và userPlantId là số dương
          if (isNaN(p.plantId) || isNaN(p.userPlantId) || p.plantId <= 0 || p.userPlantId <= 0) {
            return false;
          }
          return true;
        });

        if (validPlants.length > 0) {
          // Map API response to userPlants array với validation
          this.userPlants = validPlants.map((p: any) => {
            let imageUrls: string[] = [];
            if (Array.isArray(p.imageUrls) && p.imageUrls.length > 0) {
              imageUrls = p.imageUrls.slice(-3).reverse();
            } else if (Array.isArray(p.images) && p.images.length > 0) {
              imageUrls = p.images.map((img: any) => img?.imageUrl).filter((url: string) => !!url).slice(-3).reverse();
            } else if (p.imageUrl) {
              imageUrls = [p.imageUrl];
            }
            return {
              userPlantId: Number(p.userPlantId),
              plantId: Number(p.plantId),
              imageUrl: p.imageUrl,
              imageUrls,
              nickname: p.nickname || 'Cây chưa có tên',
              plantLocation: p.plantLocation || 'Vị trí không xác định',
              reminderEnabled: false
            };
          });
          this.errorMessage = '';
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
  }

  viewPlantDetail(userPlantId: number): void {
    // Validate userPlantId với kiểm tra chặt chẽ hơn
    if (!userPlantId || isNaN(userPlantId) || userPlantId <= 0) {
      this.toastService.error('Dữ liệu cây không hợp lệ. Vui lòng refresh trang.');
      return;
    }

    // Double check plant exists in current list
    const plant = this.userPlants.find(p => p.userPlantId === userPlantId);
    if (!plant) {
      this.toastService.error('Không tìm thấy cây này trong vườn của bạn');
      return;
    }

    this.router.navigate(['/user/user-plant-detail', userPlantId]);
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

  carePlant(userPlantId: number): void {
    // Validate userPlantId
    if (!userPlantId || isNaN(userPlantId) || userPlantId <= 0) {
      this.toastService.error('Dữ liệu cây không hợp lệ. Vui lòng refresh trang.');
      return;
    }

    // Tìm đúng cây theo userPlantId
    const plant = this.userPlants.find(p => p.userPlantId === userPlantId);
    if (!plant) {
      this.toastService.error('Không tìm thấy cây này trong vườn của bạn');
      return;
    }

    this.router.navigate(['/user/plant-care-reminder', userPlantId]);
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

  // Sửa lại: truyền đúng userPlantId cho nút sửa với validation
  editPlant(userPlantId: number, plantName?: string): void {
    if (!userPlantId || isNaN(userPlantId) || userPlantId <= 0) {
      this.toastService.error('Không thể chỉnh sửa cây này - dữ liệu không hợp lệ');
      return;
    }

    // Verify plant exists in current list
    const plant = this.userPlants.find(p => p.userPlantId === userPlantId);
    if (!plant) {
      this.toastService.error('Không tìm thấy cây này trong danh sách');
      return;
    }

    this.router.navigate(['/update-plant', userPlantId]);
  }
}
