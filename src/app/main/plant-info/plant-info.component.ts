import { Component, OnInit, ChangeDetectorRef, OnDestroy } from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';
import { TopNavigatorComponent } from '../../shared/top-navigator/index';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { BehaviorSubject, Subscription, filter } from 'rxjs';
import { PlantDataService } from '../../shared/plant-data.service';

interface Plant {
  id: number;
  scientificName: string;
  commonName: string;
  categoryName: string;
  description: string;
  careInstructions: string;
  lightRequirement: string;
  waterRequirement: string;
  careDifficulty: string;
  suitableLocation: string;
  commonDiseases: string;
  status: string;
  imageUrls: string[];
  createdAt: string | null;
}

@Component({
  selector: 'app-plant-info',
  standalone: true,
  imports: [TopNavigatorComponent, CommonModule, FormsModule],
  templateUrl: './plant-info.html',
  styleUrl: './plant-info.scss'
})
export class PlantInfoComponent implements OnInit, OnDestroy {
  private plantsSubject = new BehaviorSubject<Plant[]>([]);
  plants$ = this.plantsSubject.asObservable();

  searchText = '';
  loading = false;
  error = '';
  usingDemoData = false;

  currentPage = 0;
  pageSize = 8;
  totalPages = 1;
  totalElements = 0;

  private searchDebounce: any;
  private currentKeyword = '';
  private navigationSubscription: Subscription;

  private categoriesSubject = new BehaviorSubject<Array<{ id: number; name: string; description: string }>>([]);
  categories$ = this.categoriesSubject.asObservable();
  loadingCategories = false;
  errorCategories = '';

  selectedCategoryId: number | null = null;

  constructor(
    private http: HttpClient,
    private cdr: ChangeDetectorRef,
    private router: Router,
    private plantDataService: PlantDataService
  ) {
    // Listen for navigation events to refresh data when coming from create page
    this.navigationSubscription = this.router.events
      .pipe(filter(event => event instanceof NavigationEnd))
      .subscribe((event: NavigationEnd) => {
        if (event.url === '/main/plant-info') {
          console.log('🔄 Detected navigation to plant-info, refreshing data...');
          setTimeout(() => this.refreshData(), 100);
        }
      });
  }

  ngOnInit(): void {
    // Force refresh từ server mỗi khi component init
    // Điều này đảm bảo luôn có dữ liệu mới nhất
    console.log('🔄 PlantInfo Component init - fetching fresh data');
    this.fetchPlants(0, '');
    this.loadCategories();

    // Đọc lại category đã chọn từ localStorage khi reload
    try {
      const savedCatId = localStorage.getItem('selectedCategoryId');
      if (savedCatId) {
        this.selectedCategoryId = Number(savedCatId);
      }
    } catch {}
  }

  private buildUrl(page: number, keyword: string): string {
    let url = `/api/plants/search?pageNo=${page}&pageSize=${this.pageSize}`;
    if (keyword.trim()) {
      url += `&keyword=${encodeURIComponent(keyword.trim())}`;
    }
    return url;
  }

  fetchPlants(page: number, keyword: string = ''): void {
    // Luôn fetch mới từ server, không ưu tiên cache khi user thao tác hoặc reload
    this.loading = true;
    this.error = '';
    const trimmedKeyword = keyword.trim();
    const url = this.buildUrl(page, trimmedKeyword);

    this.http.get<any>(url).subscribe({
      next: (res) => {
        const data = res?.data;
        this.loading = false;
        this.currentKeyword = trimmedKeyword;

        if (!data || !Array.isArray(data.plants)) {
          this.resetResults();
          this.plantsSubject.next([]);
          this.cdr.detectChanges();
          return;
        }

        this.totalPages = data.totalPages ?? 1;
        this.totalElements = data.totalElements ?? data.plants.length;
        this.currentPage = page;
        this.pageSize = data.pageSize ?? this.pageSize;

        this.plantsSubject.next(data.plants);
        this.plantDataService.setPlantsList(data.plants);
        this.cachePlants(data.plants, page, trimmedKeyword);
        this.usingDemoData = false;
        this.cdr.detectChanges();
      },
      error: (error) => {
        console.warn('Plants API not available, using demo data:', error.message);
        this.loading = false;
        this.usingDemoData = true;
        
        // Provide demo/fallback data when API fails
        const demoPlants: Plant[] = this.getDemoPlants();
        
        // Filter demo plants based on keyword if provided
        let filteredPlants = demoPlants;
        if (trimmedKeyword) {
          filteredPlants = demoPlants.filter(plant => 
            plant.commonName.toLowerCase().includes(trimmedKeyword.toLowerCase()) ||
            plant.scientificName.toLowerCase().includes(trimmedKeyword.toLowerCase()) ||
            plant.categoryName.toLowerCase().includes(trimmedKeyword.toLowerCase())
          );
        }
        
        // Simulate pagination
        const startIndex = page * this.pageSize;
        const endIndex = startIndex + this.pageSize;
        const paginatedPlants = filteredPlants.slice(startIndex, endIndex);
        
        this.totalPages = Math.ceil(filteredPlants.length / this.pageSize);
        this.totalElements = filteredPlants.length;
        this.currentPage = page;
        this.currentKeyword = trimmedKeyword;
        
        this.plantsSubject.next(paginatedPlants);
        this.plantDataService.setPlantsList(paginatedPlants);
        this.cdr.detectChanges();
        
        // Show info message only once
        if (page === 0 && !trimmedKeyword) {
          console.info('Sử dụng dữ liệu demo do API không khả dụng');
        }
      }
    });
  }

  loadCategories() {
    this.loadingCategories = true;
    this.errorCategories = '';
    this.http.get<any>('http://localhost:8080/api/plants/categories').subscribe({
      next: (res) => {
        this.categoriesSubject.next(res.data || []);
        this.loadingCategories = false;
      },
      error: (err) => {
        this.errorCategories = 'Không thể tải danh mục cây.';
        this.categoriesSubject.next([]);
        this.loadingCategories = false;
      }
    });
  }

  onSearch(): void {
    const keyword = this.searchText.trim();
    if (keyword !== this.currentKeyword) {
      this.fetchPlants(0, keyword);
    }
  }

  onSearchInputChange(): void {
    clearTimeout(this.searchDebounce);
    this.searchDebounce = setTimeout(() => {
      const keyword = this.searchText.trim();
      if (keyword !== this.currentKeyword) {
        this.fetchPlants(0, keyword);
      }
    }, 300);
  }

  goToPage(page: number): void {
    if (page >= 0 && page < this.totalPages) {
      this.fetchPlants(page, this.currentKeyword);
    }
  }

  private resetResults(): void {
    this.totalPages = 1;
    this.totalElements = 0;
    this.currentPage = 0;
  }

  viewPlantDetail(plantId: number): void {
    // Tìm cây trong danh sách hiện tại và lưu vào service
    const currentPlants = this.plantsSubject.value;
    const selectedPlant = currentPlants.find(p => p.id === plantId);
    
    console.log('ViewPlantDetail called with ID:', plantId);
    console.log('Current plants:', currentPlants);
    console.log('Selected plant:', selectedPlant);
    
    if (selectedPlant) {
      this.plantDataService.setSelectedPlant(selectedPlant);
      console.log('Plant saved to service');
    } else {
      console.log('Plant not found in current list');
    }
    
    this.router.navigate(['/plant-info/detail', plantId]);
  }

  /**
   * Clear cache khi cần refresh dữ liệu
   */
  private clearCache(): void {
    try {
      localStorage.removeItem('plants_list_cache');
      console.log('🗑️ Cleared plants cache');
    } catch (e) {
      console.log('Failed to clear cache:', e);
    }
  }

  /**
   * Force refresh - clear cache và fetch lại
   */
  forceRefresh(): void {
    this.clearCache();
    this.plantsSubject.next([]);
    this.fetchPlants(0, '');
  }

  /**
   * Translate light requirement enum to Vietnamese
   */
  translateLightRequirement(value: string): string {
    const translations: { [key: string]: string } = {
      'LOW': 'Ít ánh sáng',
      'MEDIUM': 'Ánh sáng vừa phải',
      'HIGH': 'Nhiều ánh sáng'
    };
    return translations[value?.toUpperCase()] || value || 'Chưa có thông tin';
  }

  /**
   * Translate water requirement enum to Vietnamese
   */
  translateWaterRequirement(value: string): string {
    const translations: { [key: string]: string } = {
      'LOW': 'Ít nước',
      'MEDIUM': 'Nước vừa phải',
      'HIGH': 'Nhiều nước'
    };
    return translations[value?.toUpperCase()] || value || 'Chưa có thông tin';
  }

  /**
   * Translate care difficulty enum to Vietnamese
   */
  translateCareDifficulty(value: string): string {
    const translations: { [key: string]: string } = {
      'EASY': 'Dễ chăm sóc',
      'MODERATE': 'Trung bình',
      'DIFFICULT': 'Khó chăm sóc'
    };
    return translations[value?.toUpperCase()] || value || 'Chưa có thông tin';
  }

  /**
   * Translate category name to Vietnamese
   */
  translateCategoryName(name: string): string {
    switch (name) {
      case 'Indoor Plants': return 'Cây trồng trong nhà';
      case 'Outdoor Plants': return 'Cây ngoài trời';
      case 'Succulents': return 'Cây mọng nước';
      default: return name;
    }
  }

  /**
   * Cache dữ liệu vào localStorage
   */
  private cachePlants(plants: Plant[], page: number, keyword: string): void {
    try {
      const cacheData = {
        plants: plants,
        currentPage: page,
        totalPages: this.totalPages,
        totalElements: this.totalElements,
        keyword: keyword,
        cachedAt: new Date().toISOString()
      };
      localStorage.setItem('plants_list_cache', JSON.stringify(cacheData));
      console.log('💾 Cached plants list:', plants.length, 'items');
    } catch (e) {
      console.log('Failed to cache plants:', e);
    }
  }

  /**
   * Tạo dữ liệu demo khi API không hoạt động
   */
  private getDemoPlants(): Plant[] {
    return [
      {
        id: 1,
        scientificName: 'Ficus elastica',
        commonName: 'Cây cao su',
        categoryName: 'Cây cảnh trong nhà',
        description: 'Cây cao su là một loại cây cảnh phổ biến với lá to, bóng và màu xanh đậm. Rất dễ chăm sóc và phù hợp trồng trong nhà.',
        careInstructions: 'Tưới nước khi đất khô, đặt nơi có ánh sáng gián tiếp, lau lá thường xuyên để giữ độ bóng.',
        lightRequirement: 'MEDIUM',
        waterRequirement: 'MEDIUM',
        careDifficulty: 'EASY',
        suitableLocation: 'Phòng khách, ban công có mái che',
        commonDiseases: 'Rỉ sắt, thối rễ do tưới nước quá nhiều',
        status: 'APPROVED',
        imageUrls: ['https://picsum.photos/400/300?random=1'],
        createdAt: '2024-01-15T10:30:00Z'
      },
      {
        id: 2,
        scientificName: 'Sansevieria trifasciata',
        commonName: 'Cây lưỡi hổ',
        categoryName: 'Cây cảnh trong nhà',
        description: 'Cây lưỡi hổ có lá dài, thẳng đứng với họa tiết sọc vàng xanh đặc trưng. Rất dễ chăm sóc và có khả năng lọc không khí tốt.',
        careInstructions: 'Tưới nước ít, khoảng 1-2 tuần/lần. Có thể sống trong điều kiện ánh sáng yếu.',
        lightRequirement: 'LOW',
        waterRequirement: 'LOW',
        careDifficulty: 'EASY',
        suitableLocation: 'Phòng ngủ, văn phòng, phòng tắm',
        commonDiseases: 'Thối rễ do tưới nước quá nhiều',
        status: 'APPROVED',
        imageUrls: ['https://picsum.photos/400/300?random=2'],
        createdAt: '2024-01-20T14:15:00Z'
      },
      {
        id: 3,
        scientificName: 'Pothos aureus',
        commonName: 'Cây trầu bà',
        categoryName: 'Cây cảnh trong nhà',
        description: 'Cây trầu bà là loại cây leo với lá có màu xanh và vàng đẹp mắt. Dễ trồng và có thể phát triển tốt trong nước hoặc đất.',
        careInstructions: 'Tưới nước đều đặn, đặt nơi có ánh sáng gián tiếp, có thể cắt tỉa để tạo hình.',
        lightRequirement: 'MEDIUM',
        waterRequirement: 'MEDIUM',
        careDifficulty: 'EASY',
        suitableLocation: 'Treo ở ban công, kệ sách, bàn làm việc',
        commonDiseases: 'Lá vàng do thiếu nước hoặc ánh sáng',
        status: 'APPROVED',
        imageUrls: ['https://picsum.photos/400/300?random=3'],
        createdAt: '2024-02-01T09:45:00Z'
      },
      {
        id: 4,
        scientificName: 'Aloe vera',
        commonName: 'Nha đam',
        categoryName: 'Cây thảo dược',
        description: 'Nha đam là cây mọng nước có nhiều công dụng trong y học và làm đẹp. Lá dày, chứa gel trong suốt có tính kháng khuẩn.',
        careInstructions: 'Tưới nước ít, đặt nơi có ánh sáng trực tiếp, tránh úng nước.',
        lightRequirement: 'HIGH',
        waterRequirement: 'LOW',
        careDifficulty: 'EASY',
        suitableLocation: 'Ban công có ánh nắng, cửa sổ hướng nam',
        commonDiseases: 'Thối rễ, cháy lá do ánh nắng quá mạnh',
        status: 'APPROVED',
        imageUrls: ['https://picsum.photos/400/300?random=4'],
        createdAt: '2024-02-10T16:20:00Z'
      },
      {
        id: 5,
        scientificName: 'Monstera deliciosa',
        commonName: 'Cây lá xẻ',
        categoryName: 'Cây cảnh trong nhà',
        description: 'Cây lá xẻ có lá to với những lỗ thủng tự nhiên đặc trưng, tạo vẻ đẹp nhiệt đới. Là cây cảnh nội thất được ưa chuộng.',
        careInstructions: 'Tưới nước khi đất khô, đặt nơi có ánh sáng gián tiếp, cần cột hỗ trợ khi cây lớn.',
        lightRequirement: 'MEDIUM',
        waterRequirement: 'MEDIUM',
        careDifficulty: 'MODERATE',
        suitableLocation: 'Phòng khách rộng, góc phòng có ánh sáng',
        commonDiseases: 'Lá vàng, rệp, nhện đỏ',
        status: 'APPROVED',
        imageUrls: ['https://picsum.photos/400/300?random=5'],
        createdAt: '2024-02-15T11:10:00Z'
      },
      {
        id: 6,
        scientificName: 'Rosa damascena',
        commonName: 'Hoa hồng',
        categoryName: 'Cây hoa',
        description: 'Hoa hồng là biểu tượng của tình yêu với hương thơm quyến rũ và vẻ đẹp kiêu sa. Có nhiều màu sắc và giống khác nhau.',
        careInstructions: 'Tưới nước đều đặn, bón phân định kỳ, cắt tỉa cành khô, phòng trừ sâu bệnh.',
        lightRequirement: 'HIGH',
        waterRequirement: 'HIGH',
        careDifficulty: 'MODERATE',
        suitableLocation: 'Sân vườn, ban công có ánh nắng trực tiếp',
        commonDiseases: 'Bệnh đốm đen, rỉ sắt, rệp và sâu róm',
        status: 'APPROVED',
        imageUrls: ['https://picsum.photos/400/300?random=6'],
        createdAt: '2024-02-20T08:30:00Z'
      },
      {
        id: 7,
        scientificName: 'Lavandula angustifolia',
        commonName: 'Oải hương',
        categoryName: 'Cây thảo dược',
        description: 'Oải hương có hương thơm dễ chịu, giúp thư giãn và có tác dụng chống côn trùng tự nhiên. Hoa màu tím đẹp mắt.',
        careInstructions: 'Tưới nước vừa phải, đặt nơi có ánh sáng trực tiếp, cắt tỉa sau khi ra hoa.',
        lightRequirement: 'HIGH',
        waterRequirement: 'LOW',
        careDifficulty: 'MODERATE',
        suitableLocation: 'Sân vườn, ban công có nắng, cửa sổ',
        commonDiseases: 'Thối rễ do tưới nước quá nhiều',
        status: 'APPROVED',
        imageUrls: ['https://picsum.photos/400/300?random=7'],
        createdAt: '2024-03-01T13:45:00Z'
      },
      {
        id: 8,
        scientificName: 'Citrus limon',
        commonName: 'Cây chanh',
        categoryName: 'Cây ăn quả',
        description: 'Cây chanh cho quả chua, giàu vitamin C. Có thể trồng trong chậu hoặc vườn, vừa có quả ăn vừa làm cảnh.',
        careInstructions: 'Tưới nước đều đặn, bón phân hữu cơ, đặt nơi có ánh sáng trực tiếp, tỉa cành để thông thoáng.',
        lightRequirement: 'HIGH',
        waterRequirement: 'HIGH',
        careDifficulty: 'MODERATE',
        suitableLocation: 'Sân vườn, ban công lớn có nắng',
        commonDiseases: 'Canker, rệp, nhện đỏ, thiếu dinh dưỡng',
        status: 'APPROVED',
        imageUrls: ['https://picsum.photos/400/300?random=8'],
        createdAt: '2024-03-05T15:20:00Z'
      }
    ];
  }

  ngOnDestroy(): void {
    if (this.navigationSubscription) {
      this.navigationSubscription.unsubscribe();
    }
    if (this.searchDebounce) {
      clearTimeout(this.searchDebounce);
    }
  }

  /**
   * Track function để tránh duplicate keys
   */
  trackByPlantId(index: number, plant: Plant): string {
    return `${plant.id}-${index}`;
  }

  private refreshData() {
    console.log('🔄 Refreshing plant data after create operation');
    this.currentPage = 0;
    this.searchText = '';
    this.currentKeyword = '';
    this.plantsSubject.next([]);
    this.totalElements = 0;
    this.totalPages = 0;
    this.fetchPlants(0, '');
  }

  filterByCategory(categoryId: number) {
    this.selectedCategoryId = categoryId;
    // Lưu category đã chọn vào localStorage để giữ trạng thái khi reload
    try {
      localStorage.setItem('selectedCategoryId', String(categoryId));
    } catch {}
  }

  // Thêm hàm để filter trong template nếu cần
  filterPlantsByCategory(plants: any[]): any[] {
    if (!this.selectedCategoryId) return plants;
    return plants.filter(p => p.categoryId === this.selectedCategoryId);
  }
}
