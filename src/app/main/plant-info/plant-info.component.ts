

import { environment } from '../../../environments/environment';
import { Component, OnInit, ChangeDetectorRef, OnDestroy } from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';
import { TopNavigatorComponent } from '../../shared/top-navigator/index';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { BehaviorSubject, Subscription, filter } from 'rxjs';
import { PlantDataService } from '../../shared/plant-data.service';
import { ToastService } from '../../shared/toast/toast.service';

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
  reportCount?: number; // số lần bị báo cáo
}

@Component({
  selector: 'app-plant-info',
  standalone: true,
  imports: [TopNavigatorComponent, CommonModule, FormsModule],
  templateUrl: './plant-info.html',
  styleUrl: './plant-info.scss'
})
export class PlantInfoComponent implements OnInit, OnDestroy {
  private toast: ToastService;
  private plantsSubject = new BehaviorSubject<Plant[]>([]);
  plants$ = this.plantsSubject.asObservable();

  searchText = '';
  loading = false;
  error = '';
  // Đã loại bỏ demo data
  // Getter cho template sử dụng các biến phân trang
  get totalPages() {
    return this.pageState.totalPages;
  }

  /**
   * Trả về màu cảnh báo dựa trên số lượng report (reportCount)
   * 0: xanh lá, 1-2: vàng, 3-4: cam, >=5: đỏ
   */
  getWarningColor(reportCount: number): string {
    if (!reportCount || reportCount <= 0) return '#4caf50'; // xanh lá
    if (reportCount <= 2) return '#ffc107'; // vàng
    if (reportCount <= 4) return '#ff9800'; // cam
    return '#f44336'; // đỏ
  }
  get currentPage() {
    return this.pageState.currentPage;
  }
  get usingDemoData() {
    return false;
  }

  // Gom state phân trang vào một object
  pageState = {
    currentPage: 0,
    pageSize: 8,
    totalPages: 1,
    totalElements: 0,
    currentKeyword: ''
  };

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
    private plantDataService: PlantDataService,
    toast: ToastService
  ) {
    this.toast = toast;
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
    let url = `/api/plants/search?pageNo=${page}&pageSize=${this.pageState.pageSize}`;
    if (keyword.trim()) {
      url += `&keyword=${encodeURIComponent(keyword.trim())}`;
    }
    return url;
  }

  fetchPlants(page: number, keyword: string = ''): void {
    this.loading = true;
    this.error = '';
    const trimmedKeyword = keyword.trim();
    const url = this.buildUrl(page, trimmedKeyword);

    this.http.get<any>(url).subscribe({
      next: (res) => {
        const data = res?.data;
        this.loading = false;
        this.pageState.currentKeyword = trimmedKeyword;

        if (!data || !Array.isArray(data.plants)) {
          this.resetResults();
          this.plantsSubject.next([]);
          this.cdr.detectChanges();
          return;
        }

        this.pageState.totalPages = data.totalPages ?? 1;
        this.pageState.totalElements = data.totalElements ?? data.plants.length;
        this.pageState.currentPage = page;
        this.pageState.pageSize = data.pageSize ?? this.pageState.pageSize;

        this.plantsSubject.next(data.plants);
        this.plantDataService.setPlantsList(data.plants);
        this.cdr.detectChanges();
      },
      error: (error) => {
        this.loading = false;
        this.error = 'Không thể tải dữ liệu cây.';
        this.plantsSubject.next([]);
        this.cdr.detectChanges();
      }
    });
  }

  loadCategories() {
    this.loadingCategories = true;
    this.errorCategories = '';
    this.http.get<any>(`${environment.apiUrl}/plants/categories`).subscribe({
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
    if (keyword !== this.pageState.currentKeyword) {
      this.fetchPlants(0, keyword);
    }
  }
  onSearchInputChange(): void {
    clearTimeout(this.searchDebounce);
    this.searchDebounce = setTimeout(() => {
      const keyword = this.searchText.trim();
      if (keyword !== this.pageState.currentKeyword) {
        this.fetchPlants(0, keyword);
      }
    }, 300);
  }

  goToPage(page: number): void {
    if (page >= 0 && page < this.pageState.totalPages) {
      this.fetchPlants(page, this.pageState.currentKeyword);
    }
  }

  private resetResults(): void {
    this.pageState.totalPages = 1;
    this.pageState.totalElements = 0;
    this.pageState.currentPage = 0;
  }

  viewPlantDetail(plantId: number): void {
    const currentPlants = this.plantsSubject.value;
    const selectedPlant = currentPlants.find(p => p.id === plantId);
    if (selectedPlant) {
      if (selectedPlant.status === 'INACTIVE') {
        this.toast.show('Cây này đang bị khóa để kiểm tra bởi hệ thống', 'warning');
        return;
      }
      this.plantDataService.setSelectedPlant(selectedPlant);
      this.router.navigate(['/plant-info/detail', plantId]);
    }
  }

  forceRefresh(): void {
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
    this.pageState.currentPage = 0;
    this.searchText = '';
    this.pageState.currentKeyword = '';
    this.plantsSubject.next([]);
    this.pageState.totalElements = 0;
    this.pageState.totalPages = 0;
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
