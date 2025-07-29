import { environment } from '../../../environments/environment';
import { Component, OnInit, ChangeDetectorRef, OnDestroy } from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';
import { TopNavigatorComponent } from '../../shared/top-navigator/index';
import { CommonModule } from '@angular/common';
import { MatExpansionModule } from '@angular/material/expansion';
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
  reportCount?: number;
  imageError?: boolean;
}

@Component({
  selector: 'app-plant-info',
  standalone: true,
  imports: [TopNavigatorComponent, CommonModule, FormsModule, MatExpansionModule],
  templateUrl: './plant-info.html',
  styleUrl: './plant-info.scss'
})
export class PlantInfoComponent implements OnInit, OnDestroy {

  getPlantImageSrc(imageUrl: string): string {
    if (!imageUrl) return 'assets/image/default-avatar.png';
    if (
      imageUrl.startsWith('data:image') ||
      imageUrl.startsWith('http') ||
      imageUrl.startsWith('/api/')
    ) {
      return imageUrl;
    }
    // Nếu chỉ là tên file
    return `/api/manager/plants${imageUrl ? '/' + encodeURIComponent(imageUrl) : ''}`;
  }
  private plantsSubject = new BehaviorSubject<Plant[]>([]);
  private categoriesSubject = new BehaviorSubject<Array<{ id: number; name: string; description: string }>>([]);

  plants$ = this.plantsSubject.asObservable();
  categories$ = this.categoriesSubject.asObservable();

  searchText = '';
  loading = false;
  error = '';
  loadingCategories = false;
  errorCategories = '';

  selectedCategoryId: number | null = null;
  selectedLightRequirement: string | null = null;
  selectedWaterRequirement: string | null = null;
  selectedCareDifficulty: string | null = null;
  selectedStatus: string | null = null;

  private navigationSubscription: Subscription;
  private searchDebounce: any;

  pageState = {
    currentPage: 0,
    pageSize: 8,
    totalPages: 1,
    totalElements: 0,
    currentKeyword: ''
  };

  trackByCatId(index: number, cat: { id: number; name: string; description: string }) {
    return cat.id;
  }

  constructor(
    private http: HttpClient,
    private cdr: ChangeDetectorRef,
    private router: Router,
    private plantDataService: PlantDataService,
    private toast: ToastService
  ) {
    this.navigationSubscription = this.router.events
      .pipe(filter(event => event instanceof NavigationEnd))
      .subscribe((event: NavigationEnd) => {
        if (event.url === '/main/plant-info') {
          setTimeout(() => this.refreshData(), 100);
        }
      });
  }

  ngOnInit(): void {
    this.loadCategories();
    // Restore filter state from localStorage
    let pageToLoad = 0;
    try {
      const savedCatId = localStorage.getItem('selectedCategoryId');
      if (savedCatId) this.selectedCategoryId = Number(savedCatId);
      const savedLight = localStorage.getItem('selectedLightRequirement');
      if (savedLight) this.selectedLightRequirement = savedLight;
      const savedWater = localStorage.getItem('selectedWaterRequirement');
      if (savedWater) this.selectedWaterRequirement = savedWater;
      const savedDiff = localStorage.getItem('selectedCareDifficulty');
      if (savedDiff) this.selectedCareDifficulty = savedDiff;
      const savedPage = localStorage.getItem('plantInfoCurrentPage');
      if (savedPage) {
        pageToLoad = Number(savedPage) || 0;
        localStorage.removeItem('plantInfoCurrentPage');
      }
    } catch {}
    this.fetchPlants(pageToLoad, this.searchText.trim());
  }

  get totalPages() {
    return this.pageState.totalPages;
  }

  get currentPage() {
    return this.pageState.currentPage;
  }

  getWarningColor(reportCount: number): string {
    if (!reportCount || reportCount <= 0) return '#4caf50';
    if (reportCount <= 2) return '#ffc107';
    if (reportCount <= 4) return '#ff9800';
    return '#f44336';
  }

  private buildSearchParams(page: number, keyword: string): any {
    const trimmedKeyword = keyword.trim();
    let categoryIdToSearch: number | null = null;

    // Nếu có keyword và keyword trùng hoàn toàn tên category (EN/VI), thì search theo categoryId
    if (trimmedKeyword) {
      const found = this.categoriesSubject.value.find(
        cat =>
          cat.name.toLowerCase() === trimmedKeyword.toLowerCase() ||
          this.translateCategoryName(cat.name).toLowerCase() === trimmedKeyword.toLowerCase()
      );
      if (found) {
        categoryIdToSearch = found.id;
      }
    } else if (this.selectedCategoryId) {
      // Nếu không có keyword nhưng có chọn category, search theo categoryId
      categoryIdToSearch = this.selectedCategoryId;
    }

    // Gom filter, chỉ truyền lên nếu có giá trị hợp lệ
    const params: any = {
      pageNo: page,
      pageSize: this.pageState.pageSize
    };
    if (trimmedKeyword) params.keyword = trimmedKeyword;
    if (categoryIdToSearch) params.categoryId = categoryIdToSearch;
    if (this.selectedLightRequirement) params.lightRequirement = this.selectedLightRequirement;
    if (this.selectedWaterRequirement) params.waterRequirement = this.selectedWaterRequirement;
    if (this.selectedCareDifficulty) params.careDifficulty = this.selectedCareDifficulty;
    if (this.selectedStatus) params.status = this.selectedStatus;

    return params;
  }

  fetchPlants(page: number, keyword: string = ''): void {
    this.loading = true;
    this.error = '';
    const params = this.buildSearchParams(page, keyword);

    this.http.get<any>('/api/plants/search', { params }).subscribe({
      next: (res) => {
        const data = res?.data;
        this.loading = false;
        this.pageState.currentKeyword = keyword.trim();

        if (!Array.isArray(data?.plants)) {
          this.resetResults();
          this.plantsSubject.next([]);
          this.cdr.markForCheck();
          return;
        }

        this.pageState = {
          ...this.pageState,
          totalPages: data.totalPages ?? 1,
          totalElements: data.totalElements ?? data.plants.length,
          currentPage: page,
          pageSize: data.pageSize ?? this.pageState.pageSize
        };

        // Gán imageError = false cho mỗi plant để tránh lỗi binding
        const plantsWithErrorFlag = data.plants.map((p: Plant) => ({ ...p, imageError: false }));
        this.plantsSubject.next([...plantsWithErrorFlag]);
        this.plantDataService.setPlantsList([...plantsWithErrorFlag]);
        this.cdr.markForCheck();
      },
      error: () => {
        this.loading = false;
        this.error = 'Không thể tải dữ liệu cây.';
        this.plantsSubject.next([]);
        this.cdr.markForCheck();
      }
    });
  }

  loadCategories(): void {
    this.loadingCategories = true;
    this.errorCategories = '';

    this.http.get<any>(`${environment.apiUrl}/plants/categories`).subscribe({
      next: (res) => {
        this.categoriesSubject.next(res.data || []);
        this.loadingCategories = false;
      },
      error: () => {
        this.errorCategories = 'Không thể tải danh mục cây.';
        this.categoriesSubject.next([]);
        this.loadingCategories = false;
      }
    });
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

  viewPlantDetail(plantId: number): void {
    const selectedPlant = this.plantsSubject.value.find(p => p.id === plantId);
    if (!selectedPlant || selectedPlant.status === 'INACTIVE') {
      this.toast.show('Cây này đang bị khóa để kiểm tra bởi hệ thống', 'warning');
      return;
    }
    // Lưu lại trang hiện tại trước khi chuyển sang detail
    try {
      localStorage.setItem('plantInfoCurrentPage', String(this.pageState.currentPage));
    } catch {}
    this.plantDataService.setSelectedPlant(selectedPlant);
    this.router.navigate(['/plant-info/detail', plantId]);
  }

  forceRefresh(): void {
    this.refreshData();
  }

  private refreshData(): void {
    this.pageState = {
      currentPage: 0,
      pageSize: this.pageState.pageSize,
      totalPages: 0,
      totalElements: 0,
      currentKeyword: ''
    };
    this.searchText = '';
    this.plantsSubject.next([]);
    this.fetchPlants(0, '');
  }

  private resetResults(): void {
    this.pageState.totalPages = 1;
    this.pageState.totalElements = 0;
    this.pageState.currentPage = 0;
    this.pageState.currentKeyword = '';
  }

  trackByPlantId(index: number, plant: Plant): string {
    return `${plant.id}-${index}`;
  }


  handleCategoryClick(categoryId: number): void {
    this.selectedCategoryId = categoryId;
    this.searchText = '';
    try {
      localStorage.setItem('selectedCategoryId', String(categoryId));
    } catch {}
    this.fetchPlants(0, this.searchText.trim());
    setTimeout(() => this.cdr.detectChanges());
  }

  handleAllCategoryClick(): void {
    this.selectedCategoryId = null;
    this.searchText = '';
    try {
      localStorage.removeItem('selectedCategoryId');
    } catch {}
    this.fetchPlants(0, this.searchText.trim());
    setTimeout(() => this.cdr.detectChanges());
  }

  handleLightFilter(value: string | null): void {
    this.selectedLightRequirement = value;
    try {
      if (value) localStorage.setItem('selectedLightRequirement', value);
      else localStorage.removeItem('selectedLightRequirement');
    } catch {}
    this.fetchPlants(0, this.searchText.trim());
    setTimeout(() => this.cdr.detectChanges());
  }

  handleWaterFilter(value: string | null): void {
    this.selectedWaterRequirement = value;
    try {
      if (value) localStorage.setItem('selectedWaterRequirement', value);
      else localStorage.removeItem('selectedWaterRequirement');
    } catch {}
    this.fetchPlants(0, this.searchText.trim());
    setTimeout(() => this.cdr.detectChanges());
  }

  handleDifficultyFilter(value: string | null): void {
    this.selectedCareDifficulty = value;
    try {
      if (value) localStorage.setItem('selectedCareDifficulty', value);
      else localStorage.removeItem('selectedCareDifficulty');
    } catch {}
    this.fetchPlants(0, this.searchText.trim());
    setTimeout(() => this.cdr.detectChanges());
  }

  filterPlantsByCategory(plants: Plant[]): Plant[] {
    if (this.selectedCategoryId == null) return plants;
    return plants.filter(p => p.categoryName === this.getCategoryNameById(this.selectedCategoryId!));
  }

  getCategoryNameById(id: number): string {
    return this.categoriesSubject.value.find(cat => cat.id === id)?.name || '';
  }

 translateEnum(
  value: string,
  type: 'light' | 'water' | 'difficulty'
): string {
  const map = {
    light: {
      LOW: 'Ít ánh sáng',
      MEDIUM: 'Ánh sáng vừa phải',
      HIGH: 'Nhiều ánh sáng',
    },
    water: {
      LOW: 'Ít nước',
      MEDIUM: 'Nước vừa phải',
      HIGH: 'Nhiều nước',
    },
    difficulty: {
      EASY: 'Dễ chăm sóc',
      MODERATE: 'Trung bình',
      DIFFICULT: 'Khó chăm sóc',
    },
  };

  const upperValue = value?.toUpperCase();

  switch (type) {
    case 'light':
    case 'water':
      if (
        upperValue === 'LOW' ||
        upperValue === 'MEDIUM' ||
        upperValue === 'HIGH'
      ) {
        return map[type][upperValue];
      }
      break;

    case 'difficulty':
      if (
        upperValue === 'EASY' ||
        upperValue === 'MODERATE' ||
        upperValue === 'DIFFICULT'
      ) {
        return map.difficulty[upperValue];
      }
      break;
  }

  return 'Chưa có thông tin';
}


  translateCategoryName(name: string): string {
    switch (name) {
      case 'Indoor Plants': return 'Cây trồng trong nhà';
      case 'Outdoor Plants': return 'Cây ngoài trời';
      case 'Succulents': return 'Cây mọng nước';
      default: return name;
    }
  }

  ngOnDestroy(): void {
    this.navigationSubscription?.unsubscribe();
    if (this.searchDebounce) {
      clearTimeout(this.searchDebounce);
    }
  }

  onSearch(): void {
  const keyword = this.searchText.trim();
  this.fetchPlants(0, keyword);
}

translateLightRequirement(value: string): string {
  return this.translateEnum(value, 'light');
}

translateWaterRequirement(value: string): string {
  return this.translateEnum(value, 'water');
}

translateCareDifficulty(value: string): string {
  return this.translateEnum(value, 'difficulty');
}

}
