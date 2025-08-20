import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { TopNavigatorComponent } from '../../shared/top-navigator/index';
import { CookieService } from '../../auth/cookie.service';
import { AuthService } from '../../auth/auth.service';
import { PlantDataService, Plant } from '../../shared/services/plant-data.service';
import { PlantDetailLoaderService } from '../../shared/services/plant-detail-loader.service';
import { AuthDialogService } from '../../auth/auth-dialog.service';
import { FormsModule } from '@angular/forms';
import { ToastService } from '../../shared/toast/toast.service';
import { ConfirmationDialogService } from '../../shared/services/confirmation-dialog/confirmation-dialog.service';
import { MatDialog } from '@angular/material/dialog';
import { PlantUiHelperService } from '../../shared/services/helpers/plant-ui-helper.service';

/**
 * Component hiển thị chi tiết thông tin của một cây
 */
@Component({
  selector: 'app-plant-detail',
  standalone: true,
  imports: [CommonModule, TopNavigatorComponent, FormsModule, RouterModule],
  templateUrl: './plant-detail.component.html',
  styleUrl: './plant-detail.component.scss'
})
export class PlantDetailComponent implements OnInit {
  plant: Plant | null = null;
  error = '';
  selectedImage = '';
  requiresAuth = false;
  loading = true; // Mặc định là loading
  isGuest = false;
  private plantId: string | null = null;
  private toast = inject(ToastService);
  private confirmationDialog = inject(ConfirmationDialogService);
  private dialog = inject(MatDialog);
  public plantUiHelper = inject(PlantUiHelperService);

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private http: HttpClient,
    private cookieService: CookieService,
    private authService: AuthService,
    private plantDataService: PlantDataService,
    private authDialogService: AuthDialogService,
    private cdr: ChangeDetectorRef,
    private plantDetailLoader: PlantDetailLoaderService
  ) {}

  ngOnInit(): void {
    // Kiểm tra auth status ngay từ đầu
    this.checkAuthStatus();
    
    // Extract id
    this.plantId = this.route.snapshot.paramMap.get('id');
    
    if (!this.plantId) {
      this.handleError('ID cây không hợp lệ');
      return;
    }

    // Luôn ưu tiên lấy cache trước để hiển thị ngay
    this.loadFromCache();
    
    // Sau đó gọi API để cập nhật mới nhất
    this.loadPlantDetail();
  }

  /**
   * Kiểm tra trạng thái đăng nhập
   */
  private checkAuthStatus(): void {
    this.isGuest = !this.authService.isLoggedIn();
  }

  /**
   * Load dữ liệu từ cache trước
   */
  private loadFromCache(): void {
    const cached = this.plantDataService.getSelectedPlant();
    if (cached && cached.id === Number(this.plantId)) {
      this.plant = cached;
      this.setSelectedImage();
      this.loading = false; // Có cache thì không loading nữa
      this.cdr.detectChanges();
    }
  }

  /**
   * Tải thông tin chi tiết của cây
   */
  loadPlantDetail(): void {
    if (!this.plantId) {
      this.handleError('ID cây không hợp lệ');
      return;
    }

    // Chỉ set loading = true nếu chưa có cache
    if (!this.plant) {
      this.loading = true;
    }

    this.http.get<any>(`/api/plants/detail/${this.plantId}`).subscribe({
      next: (res) => {
        const plant = res?.data || res;
        this.plant = plant;
        this.plantDataService.setSelectedPlant(plant);
        this.setSelectedImage();
        this.loading = false;
        this.error = '';
        this.requiresAuth = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.loading = false;
        
        if (err.status === 404) {
          this.handleError('Không tìm thấy thông tin cây với ID này');
        } else if (err.status === 403 || err.status === 401) {
          this.handleError('', true);
        } else {
          // Nếu lỗi và chưa có cache, hiển thị lỗi
          if (!this.plant) {
            this.handleError('Không thể tải thông tin cây. Vui lòng thử lại.');
          } else {
            // Nếu có cache rồi thì chỉ hiển thị toast lỗi, không ẩn dữ liệu
            this.toast.error('Không thể cập nhật thông tin mới nhất. Vui lòng thử lại.');
          }
        }
        this.cdr.detectChanges();
      }
    });
  }

  /**
   * Helper: cập nhật state khi lỗi
   */
  private handleError(errorMsg: string, requiresAuth = false) {
    this.loading = false;
    this.error = errorMsg;
    this.requiresAuth = requiresAuth;
    this.cdr.detectChanges();
  }

  private setSelectedImage(): void {
    if (this.plant?.imageUrls?.length) {
      this.selectedImage = this.plant.imageUrls[0];
    }
  }

  // UI Methods
  selectImage(imageUrl: string): void {
    this.selectedImage = imageUrl;
  }

  goBack(): void {
    this.router.navigate(['/plant-info']);
  }

  goToLogin(): void {
    this.router.navigate(['/login']);
  }

  openLoginDialog(): void {
    this.authDialogService.openLoginDialog();
  }

  addToCollection(): void {
    if (!this.plant) return;
    
    // Check if user is authenticated
    const token = this.cookieService.getAuthToken();
    if (!token) {
      this.toast.error('Vui lòng đăng nhập để thêm cây vào bộ sưu tập!');
      this.openLoginDialog();
      return;
    }
    
    // Set selected plant in service for the add component
    this.plantDataService.setSelectedPlant(this.plant);
    
    // Navigate to add plant to collection page
    this.router.navigate(['/user/add-plant', this.plant.id]);
  }

  reloadPlantDetail(): void {
    this.error = '';
    this.requiresAuth = false;
    this.loadPlantDetail();
  }

  formatDate(dateString: string): string {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString('vi-VN');
  }

  async onReportPlant(): Promise<void> {
    if (!this.plant) return;
    const token = this.cookieService.getAuthToken();
    if (!token) {
      this.openLoginDialog();
      this.toast.error('Vui lòng đăng nhập để báo cáo thông tin cây!');
      return;
    }
    // Kiểm tra đã báo cáo chưa bằng cách lấy danh sách báo cáo của mình
    const plantId = this.plant?.id;
    if (!plantId) {
      this.toast.error('Không tìm thấy thông tin cây');
      return;
    }
    this.http.get(`/api/plants-report/my-reports?page=0&size=100&status=PENDING`, { headers: { Authorization: `Bearer ${token}` } }).subscribe({
      next: (res: any) => {
        const reports = res?.data?.reports || [];
        const reported = Array.isArray(reports) && reports.some((r: any) => r.plantId === plantId);
        if (reported) {
          this.toast.error('Bạn đã báo cáo cây này rồi');
          return;
        }
        this.router.navigate(['/user/report-plant', plantId]);
      },
      error: () => {
        // Nếu lỗi vẫn cho báo cáo
        this.router.navigate(['/user/report-plant', plantId]);
      }
    });
  }

  get latestImages(): string[] {
    if (this.plant?.imageUrls?.length) {
      return this.plant.imageUrls.slice(-3);
    }
    return [];
  }
}
