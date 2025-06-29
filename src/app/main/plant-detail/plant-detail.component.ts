import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { TopNavigatorComponent } from '../../shared/top-navigator/index';
import { CookieService } from '../../auth/cookie.service';
import { PlantDataService, Plant } from '../../shared/plant-data.service';
import { AuthDialogService } from '../../auth/auth-dialog.service';

/**
 * Interface định nghĩa cấu trúc dữ liệu chi tiết của cây
 */
interface PlantDetail extends Plant {
  // Extend Plant interface if needed for additional detail fields
}

/**
 * Component hiển thị chi tiết thông tin của một cây
 * Yêu cầu người dùng đăng nhập để xem thông tin đầy đủ
 */
@Component({
  selector: 'app-plant-detail',
  standalone: true,
  imports: [CommonModule, TopNavigatorComponent],
  templateUrl: './plant-detail.component.html',
  styleUrl: './plant-detail.component.scss'
})
export class PlantDetailComponent implements OnInit {
  // Dữ liệu cây
  plant: PlantDetail | null = null;
  
  // Trạng thái loading - bắt đầu với false để không hiển thị loading state
  loading = false;
  
  // Thông báo lỗi
  error = '';
  
  // Ảnh được chọn để hiển thị
  selectedImage = '';
  
  // Có yêu cầu xác thực không
  requiresAuth = false;

  // Kiểm tra xem có hiển thị thông tin giới hạn không
  isLimitedInfo = false;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private http: HttpClient,
    private cookieService: CookieService,
    private plantDataService: PlantDataService,
    private authDialogService: AuthDialogService
  ) {}

  ngOnInit(): void {
    console.log('PlantDetailComponent ngOnInit called');
    this.loadPlantDetail();
  }

  /**
   * Tải thông tin chi tiết của cây
   * Ưu tiên: Service data → Public endpoint → Search fallback → Auth endpoint
   */
  loadPlantDetail(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) {
      this.error = 'ID cây không hợp lệ';
      return;
    }

    const plantId = parseInt(id);
    // Không hiển thị loading state để UX mượt mà hơn
    // this.loading = true;
    this.error = '';
    this.requiresAuth = false;
    this.isLimitedInfo = false;

    console.log('🚀 Starting loadPlantDetail for ID:', plantId);

    // Gọi ngay lập tức thay vì setTimeout
    this.loadFromServiceFirst(plantId);
  }

  /**
   * Thử load từ service trước (đã có data từ trang list)
   */
  private loadFromServiceFirst(plantId: number): void {
    console.log('=== LOADING PLANT DETAIL ===');
    console.log('Plant ID:', plantId);
    
    // Kiểm tra auth token trước
    const token = this.cookieService.getAuthToken();
    console.log('Has auth token:', !!token);
    
    // 1. Thử từ localStorage cache trước
    const cachedPlant = this.loadCachedPlant(plantId);
    if (cachedPlant) {
      console.log('✅ Found plant in localStorage cache:', cachedPlant);
      this.plant = cachedPlant;
      this.isLimitedInfo = !token; // Limited nếu không có token
      if (this.plant?.imageUrls && this.plant.imageUrls.length > 0) {
        this.selectedImage = this.plant.imageUrls[0];
      }
      
      // Vẫn thử upgrade nếu có token
      if (token) {
        this.tryUpgradeToFullDataImmediate(plantId.toString());
      }
      return;
    }
    
    // 2. Thử lấy từ selected plant
    const selectedPlant = this.plantDataService.getSelectedPlant();
    console.log('Selected plant from service:', selectedPlant);
    
    if (selectedPlant && selectedPlant.id === plantId) {
      console.log('✅ Found plant in selected plant:', selectedPlant);
      this.plant = selectedPlant;
      // this.loading = false; // Không cần set loading
      
      // Cache plant data
      this.cachePlant(selectedPlant);
      
      // Nếu có token, thử lấy full data ngay lập tức thay vì hiển thị limited info
      if (token) {
        console.log('User is authenticated, trying to get full data immediately');
        this.isLimitedInfo = false; // Tạm thời set false
        this.tryUpgradeToFullDataImmediate(plantId.toString());
      } else {
        this.isLimitedInfo = true; // Chỉ set limited khi không có token
      }
      
      if (this.plant?.imageUrls && this.plant.imageUrls.length > 0) {
        this.selectedImage = this.plant.imageUrls[0];
      }
      return;
    }

    // 3. Thử tìm từ cached plants list
    const cachedListPlant = this.plantDataService.getPlantById(plantId);
    console.log('Cached plant from service:', cachedListPlant);
    
    if (cachedListPlant) {
      console.log('✅ Found plant in cached list:', cachedListPlant);
      this.plant = cachedListPlant;
      // this.loading = false; // Không cần set loading
      
      // Cache plant data
      this.cachePlant(cachedListPlant);
      
      // Nếu có token, thử lấy full data ngay lập tức
      if (token) {
        console.log('User is authenticated, trying to get full data immediately');
        this.isLimitedInfo = false;
        this.tryUpgradeToFullDataImmediate(plantId.toString());
      } else {
        this.isLimitedInfo = true;
      }
      
      if (this.plant?.imageUrls && this.plant.imageUrls.length > 0) {
        this.selectedImage = this.plant.imageUrls[0];
      }
      return;
    }

    // 4. Không có data trong service, thử API
    console.log('❌ No cached data, trying API endpoints');
    this.tryPublicDetailEndpoint(plantId.toString());
  }

  /**
   * Thử upgrade data hiện tại lên full data (background)
   */
  private tryUpgradeToFullData(id: string): void {
    const token = this.cookieService.getAuthToken();
    if (token) {
      // Có token, thử lấy full data ở background
      this.http.get<any>(`/api/plants/detail/${id}`).subscribe({
        next: (response) => {
          if (response && (response.data || response.id)) {
            console.log('Upgraded to full data:', response);
            this.plant = response.data || response;
            this.isLimitedInfo = false; // Đã có full data
            if (this.plant?.imageUrls && this.plant.imageUrls.length > 0) {
              this.selectedImage = this.plant.imageUrls[0];
            }
          }
        },
        error: (err) => {
          console.log('Cannot upgrade to full data:', err);
          // Không upgrade được cũng không sao, vẫn hiển thị basic data
        }
      });
    }
  }

  /**
   * Thử upgrade data hiện tại lên full data ngay lập tức (không background)
   */
  private tryUpgradeToFullDataImmediate(id: string): void {
    console.log('Trying immediate upgrade to full data for ID:', id);
    
    this.http.get<any>(`/api/plants/detail/${id}`).subscribe({
      next: (response) => {
        if (response && (response.data || response.id)) {
          console.log('✅ Successfully upgraded to full data:', response);
          this.plant = response.data || response;
          this.isLimitedInfo = false; // Đã có full data
          if (this.plant?.imageUrls && this.plant.imageUrls.length > 0) {
            this.selectedImage = this.plant.imageUrls[0];
          }
        } else {
          console.log('⚠️ Full data response invalid, keeping basic data');
          this.isLimitedInfo = true;
        }
      },
      error: (err) => {
        console.log('❌ Cannot get full data:', err);
        // Nếu không lấy được full data, giữ basic data và đánh dấu limited
        this.isLimitedInfo = true;
        
        // Nếu lỗi 403/401, có thể token hết hạn
        if (err.message && (err.message.includes('403') || err.message.includes('401'))) {
          console.log('Auth token may be expired');
        }
      }
    });
  }

  /**
   * Thử endpoint /api/plants/{id} trước (có thể là public)
   * @param id ID của cây
   */
  private tryPublicDetailEndpoint(id: string): void {
    const token = this.cookieService.getAuthToken();
    
    this.http.get<any>(`/api/plants/${id}`).subscribe({
      next: (response) => {
        console.log('Public detail endpoint response:', response); // Debug log
        // this.loading = false; // Không hiển thị loading
        if (response && (response.data || response.id)) {
          // Xử lý response - có thể là response.data hoặc trực tiếp response
          this.plant = response.data || response;
          
          // Nếu có token, endpoint này sẽ trả về thông tin đầy đủ
          // Nếu không có token, sẽ là thông tin cơ bản
          this.isLimitedInfo = !token;
          
          console.log(`Data loaded from public endpoint. Has token: ${!!token}, isLimitedInfo: ${this.isLimitedInfo}`);
          
          if (this.plant?.imageUrls && this.plant.imageUrls.length > 0) {
            this.selectedImage = this.plant.imageUrls[0];
          }
        } else {
          console.log('No valid data in public detail response, trying search fallback');
          this.tryPublicSearchFallback(id);
        }
      },
      error: (err) => {
        console.log('Public detail endpoint failed (error:', err?.status || 'unknown', '), trying search fallback');
        // Nếu có token và gặp lỗi, thử endpoint authenticated
        if (token) {
          console.log('Has token, trying authenticated endpoint');
          this.fetchPlantDetailWithAuth(id);
        } else {
          this.tryPublicSearchFallback(id);
        }
      }
    });
  }

  /**
   * Thử truy cập thông tin cây thông qua endpoint search public (fallback)
   * @param id ID của cây
   */
  private tryPublicSearchFallback(id: string): void {
    console.log('Trying public search fallback for ID:', id);
    
    // Thử tìm cây trong search results để lấy thông tin cơ bản
    this.http.get<any>(`/api/plants/search?pageNo=0&pageSize=100`).subscribe({
      next: (response) => {
        console.log('Search fallback response:', response);
        if (response?.data?.plants) {
          const foundPlant = response.data.plants.find((p: any) => p.id.toString() === id);
          if (foundPlant) {
            console.log('✅ Found plant in search results:', foundPlant);
            // Tìm thấy cây trong danh sách public, hiển thị thông tin cơ bản
            this.plant = foundPlant;
            // this.loading = false; // Không hiển thị loading
            this.isLimitedInfo = true; // Đánh dấu là thông tin giới hạn
            if (this.plant?.imageUrls && this.plant.imageUrls.length > 0) {
              this.selectedImage = this.plant.imageUrls[0];
            }
            return;
          } else {
            console.log('❌ Plant not found in search results');
          }
        }
        // Không tìm thấy trong search public, thử endpoint detail với auth
        console.log('Trying authenticated access...');
        this.tryAuthenticatedAccess(id);
      },
      error: (err) => {
        console.log('Search fallback failed:', err);
        // Lỗi search public, thử endpoint detail với auth
        this.tryAuthenticatedAccess(id);
      }
    });
  }

  /**
   * Thử truy cập endpoint detail với authentication
   * @param id ID của cây
   */
  private tryAuthenticatedAccess(id: string): void {
    const token = this.cookieService.getAuthToken();
    
    console.log('tryAuthenticatedAccess - Has token:', !!token);
    
    if (!token) {
      console.log('No token, showing auth required');
      // this.loading = false; // Không hiển thị loading
      this.requiresAuth = true;
      return;
    }

    console.log('Trying to fetch plant detail with auth...');
    this.fetchPlantDetailWithAuth(id);
  }

  /**
   * Gọi API để lấy thông tin chi tiết cây với xác thực
   * @param id ID của cây
   */
  private fetchPlantDetailWithAuth(id: string): void {
    this.http.get<any>(`/api/plants/detail/${id}`).subscribe({
      next: (response) => {
        console.log('Auth endpoint response:', response);
        // this.loading = false; // Không hiển thị loading
        if (response && (response.data || response.id)) {
          console.log('✅ Successfully loaded plant with auth');
          this.plant = response.data || response;
          this.isLimitedInfo = false; // Thông tin đầy đủ
          console.log('Set isLimitedInfo to false - Full data loaded');
          
          // Cache the full data
          if (this.plant) {
            this.cachePlant(this.plant);
          }
          
          // Đặt ảnh đầu tiên làm ảnh chính
          if (this.plant?.imageUrls && this.plant.imageUrls.length > 0) {
            this.selectedImage = this.plant.imageUrls[0];
          }
        } else {
          console.log('❌ No valid data in auth response');
          this.error = 'Không tìm thấy thông tin cây';
        }
      },
      error: (err) => {
        // this.loading = false; // Không hiển thị loading
        console.error('❌ Error loading plant detail with auth:', err);
        
        // Kiểm tra loại lỗi
        if (err.status === 404) {
          this.error = 'Không tìm thấy thông tin cây với ID này';
        } else if (err.status === 403 || err.status === 401) {
          console.log('Auth failed, showing auth required');
          this.requiresAuth = true;
        } else {
          this.error = 'Không thể tải thông tin cây. Vui lòng thử lại.';
        }
      }
    });
  }

  /**
   * Chọn ảnh để hiển thị trong gallery
   * @param imageUrl URL của ảnh
   */
  selectImage(imageUrl: string): void {
    this.selectedImage = imageUrl;
  }

  /**
   * Quay lại trang danh sách cây
   */
  goBack(): void {
    this.router.navigate(['/plant-info']);
  }

  /**
   * Chuyển đến trang đăng nhập
   */
  goToLogin(): void {
    this.router.navigate(['/login']);
  }

  /**
   * Mở dialog đăng nhập
   */
  openLoginDialog(): void {
    this.authDialogService.openLoginDialog();
    // Subscribe to auth state changes để reload khi đăng nhập thành công
    // (giả sử AuthDialogService có cơ chế thông báo khi auth state thay đổi)
  }

  /**
   * Format ngày tháng theo định dạng Việt Nam
   * @param dateString Chuỗi ngày tháng
   * @returns Ngày tháng đã format
   */
  formatDate(dateString: string): string {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('vi-VN');
  }

  /**
   * Reload lại thông tin cây (dùng cho button retry)
   */
  reloadPlantDetail(): void {
    this.loadPlantDetail();
  }

  /**
   * Load cached plant data from localStorage
   */
  private loadCachedPlant(plantId: number): Plant | null {
    try {
      const cached = localStorage.getItem(`plant_${plantId}`);
      if (cached) {
        const plantData = JSON.parse(cached);
        // Check if cache is still valid (e.g., less than 5 minutes old)
        const cacheTime = new Date(plantData.cachedAt).getTime();
        const now = new Date().getTime();
        if (now - cacheTime < 5 * 60 * 1000) { // 5 minutes
          console.log('✅ Found cached plant data:', plantData.plant);
          return plantData.plant;
        }
      }
    } catch (e) {
      console.log('Failed to load cached plant:', e);
    }
    return null;
  }

  /**
   * Cache plant data to localStorage
   */
  private cachePlant(plant: Plant): void {
    try {
      const cacheData = {
        plant: plant,
        cachedAt: new Date().toISOString()
      };
      localStorage.setItem(`plant_${plant.id}`, JSON.stringify(cacheData));
      console.log('💾 Cached plant data for ID:', plant.id);
    } catch (e) {
      console.log('Failed to cache plant:', e);
    }
  }
}
