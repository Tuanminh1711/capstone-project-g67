import { Component, OnInit, OnDestroy, ChangeDetectorRef, ChangeDetectionStrategy, AfterViewInit, ViewEncapsulation } from '@angular/core';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';
import { AdminLayoutComponent } from '../../../shared/admin-layout/admin-layout.component';

interface PlantDetail {
  id: number;
  scientificName: string;
  commonName: string;
  description: string;
  careInstructions: string;
  suitableLocation: string;
  commonDiseases: string;
  status: string;
  statusDisplay: string;
  createdAt: string | null;
  updatedAt: string | null;
  categoryName: string;
  imageUrls: string[];
  images: any;
}

interface ApiResponse {
  status: number;
  message: string;
  data: PlantDetail;
}

interface UpdatePlantRequest {
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
  status: string;
}

@Component({
  selector: 'app-admin-view-plant',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, AdminLayoutComponent],
  templateUrl: './admin-view-plant.component.html',
  styleUrl: './admin-view-plant.scss',
  encapsulation: ViewEncapsulation.None
})
export class AdminViewPlantComponent implements OnInit, AfterViewInit, OnDestroy {
  plant: PlantDetail | null = null;
  loading = false;
  error = '';
  plantId: number = 0;
  private routeSubscription: Subscription | null = null;
  
  // Edit mode variables
  isEditMode = false;
  updating = false;
  updateError = '';
  
  // Form data for editing
  editForm: UpdatePlantRequest = {
    scientificName: '',
    commonName: '',
    categoryId: 1,
    description: '',
    careInstructions: '',
    lightRequirement: 'MEDIUM',
    waterRequirement: 'MEDIUM',
    careDifficulty: 'MODERATE',
    suitableLocation: '',
    commonDiseases: '',
    status: 'ACTIVE'
  };

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private http: HttpClient,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    // Subscribe để handle navigation changes
    this.routeSubscription = this.route.params.subscribe(params => {
      const newPlantId = +params['id'];
      if (newPlantId && newPlantId !== this.plantId) {
        this.plantId = newPlantId;
        this.initializeComponent();
      }
    });
  }

  ngAfterViewInit(): void {
    // Load data sau khi view đã được khởi tạo hoàn toàn
    setTimeout(() => {
      this.initializeComponent();
      // Debug CSS loading
      console.log('Component loaded, checking CSS...');
      const element = document.querySelector('app-admin-view-plant');
      if (element) {
        console.log('Found app-admin-view-plant element:', element);
        console.log('Element styles:', window.getComputedStyle(element));
      } else {
        console.log('app-admin-view-plant element not found');
      }
    }, 0);
  }

  private initializeComponent(): void {
    // Lấy ID từ route
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.plantId = +id;
      
      // Reset state
      this.plant = null;
      this.error = '';
      this.loading = false;
      
      // Load data ngay lập tức
      this.loadPlantDetailImmediate();
    } else {
      this.error = 'ID cây không hợp lệ';
      this.loading = false;
    }
  }

  private loadPlantDetailImmediate(): void {
    // Method này sẽ load dữ liệu ngay lập tức
    if (!this.plantId || this.plantId <= 0) {
      this.error = 'ID cây không hợp lệ';
      return;
    }

    this.loading = true;
    this.error = '';
    
    const apiUrl = `/api/manager/plant-detail/${this.plantId}`;
    console.log('Loading plant detail immediately:', apiUrl);

    this.http.get<ApiResponse>(apiUrl).subscribe({
      next: (response) => {
        console.log('API Response received:', response);
        this.loading = false;
        
        if (response && response.data) {
          this.plant = response.data;
          console.log('Plant loaded successfully:', this.plant);
        } else {
          this.error = 'Không có dữ liệu trả về từ server';
        }
        this.cdr.markForCheck();
      },
      error: (err) => {
        console.error('API Error:', err);
        this.loading = false;
        this.handleApiError(err);
        this.cdr.markForCheck();
      }
    });
  }

  private handleApiError(err: any): void {
    if (err.status === 404) {
      this.error = 'Không tìm thấy thông tin cây này.';
    } else if (err.status === 401 || err.status === 403) {
      this.error = 'Bạn không có quyền truy cập. Vui lòng đăng nhập lại.';
    } else if (err.status === 0) {
      this.error = 'Không thể kết nối đến server. Vui lòng kiểm tra kết nối mạng.';
    } else {
      this.error = `Không thể tải thông tin cây. Lỗi: ${err.status} - ${err.message || 'Unknown error'}`;
    }
  }

  ngOnDestroy(): void {
    if (this.routeSubscription) {
      this.routeSubscription.unsubscribe();
    }
  }

  loadPlantDetail(): void {
    // Public method để retry
    this.loadPlantDetailImmediate();
  }

  // Removed goBack method

  deletePlant(): void {
    if (this.plant) {
      const confirmed = confirm(`Bạn có chắc chắn muốn xóa cây "${this.plant.commonName}"? Hành động này không thể hoàn tác.`);
      if (confirmed) {
        console.log('Deleting plant:', this.plant.id);
        // TODO: Implement delete functionality
        alert('Tính năng xóa sẽ được triển khai sau');
      }
    }
  }

  // Admin Control Methods
  togglePublish(): void {
    console.log('Toggle publish status');
    alert('Tính năng công bố sẽ được triển khai sau');
  }

  toggleFeature(): void {
    console.log('Toggle feature status');
    alert('Tính năng nổi bật sẽ được triển khai sau');
  }

  toggleVerify(): void {
    console.log('Toggle verify status');
    alert('Tính năng xác minh sẽ được triển khai sau');
  }

  toggleArchive(): void {
    console.log('Toggle archive status');
    alert('Tính năng lưu trữ sẽ được triển khai sau');
  }

  editBasicInfo(): void {
    console.log('Edit basic info');
    alert('Chế độ chỉnh sửa nhanh sẽ được triển khai sau');
  }

  copyToClipboard(text: string): void {
    navigator.clipboard.writeText(text).then(() => {
      alert('Đã sao chép vào clipboard: ' + text);
    }).catch(() => {
      alert('Không thể sao chép');
    });
  }

  // Image Management Methods
  addImage(): void {
    console.log('Add new image');
    alert('Tính năng thêm ảnh sẽ được triển khai sau');
  }

  sortImages(): void {
    console.log('Sort images');
    alert('Tính năng sắp xếp ảnh sẽ được triển khai sau');
  }

  editImage(index: number): void {
    console.log('Edit image at index:', index);
    alert(`Chỉnh sửa ảnh ${index + 1} sẽ được triển khai sau`);
  }

  deleteImage(index: number): void {
    const confirmed = confirm(`Bạn có chắc chắn muốn xóa ảnh ${index + 1}?`);
    if (confirmed) {
      console.log('Delete image at index:', index);
      alert(`Xóa ảnh ${index + 1} sẽ được triển khai sau`);
    }
  }

  refreshStats(): void {
    console.log('Refresh statistics');
    alert('Đang làm mới thống kê...');
  }

  calculateDataSize(): number {
    // Mock calculation
    const baseSize = JSON.stringify(this.plant).length / 1024;
    const imageSize = (this.plant?.imageUrls?.length || 0) * 50; // Estimate 50KB per image
    return Math.round(baseSize + imageSize);
  }

  editField(fieldName: string): void {
    console.log('Edit field:', fieldName);
    alert(`Chỉnh sửa trường ${fieldName} sẽ được triển khai sau`);
  }

  viewHistory(): void {
    if (this.plant) {
      console.log('Viewing history for plant:', this.plant.id);
      // TODO: Implement history view
      alert('Lịch sử thay đổi sẽ được hiển thị ở phiên bản tiếp theo');
    }
  }

  formatDate(dateString: string | null): string {
    if (!dateString) return 'Chưa có thông tin';
    return new Date(dateString).toLocaleDateString('vi-VN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  testAPI(): void {
    const originalId = this.plantId;
    this.plantId = 1; // Test with ID = 1
    this.loadPlantDetail();
    // Restore original ID after a few seconds
    setTimeout(() => {
      this.plantId = originalId;
    }, 5000);
  }



  getStatusClass(status: string): string {
    switch (status) {
      case 'ACTIVE':
        return 'status-active';
      case 'INACTIVE':
        return 'status-inactive';
      default:
        return 'status-default';
    }
  }

  openImageModal(imageUrl: string, index: number): void {
    console.log('Opening image modal:', imageUrl, index);
    // TODO: Implement image modal/lightbox
    window.open(imageUrl, '_blank');
  }

  goToPrevious(): void {
    if (this.plantId > 1) {
      const previousId = this.plantId - 1;
      console.log(`Navigating to previous plant: ${previousId}`);
      this.router.navigate(['/admin/plants/view', previousId]);
    } else {
      console.log('Already at the first plant');
      alert('Đây đã là cây đầu tiên');
    }
  }

  goToNext(): void {
    const nextId = this.plantId + 1;
    console.log(`Navigating to next plant: ${nextId}`);
    this.router.navigate(['/admin/plants/view', nextId]);
  }

  onImageError(event: Event): void {
    const target = event.target as HTMLImageElement;
    if (target) {
      target.style.display = 'none';
    }
  }

  editPlant(): void {
    console.log('Navigating to edit plant:', this.plantId);
    this.router.navigate(['/admin/plants/edit', this.plantId]);
  }
}
