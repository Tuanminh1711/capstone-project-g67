import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { Router } from '@angular/router';
import { TopNavigatorComponent } from '../../shared/top-navigator/index';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { BehaviorSubject } from 'rxjs';
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
export class PlantInfoComponent implements OnInit {
  private plantsSubject = new BehaviorSubject<Plant[]>([]);
  plants$ = this.plantsSubject.asObservable();

  searchText = '';
  loading = false;
  error = '';

  currentPage = 0;
  pageSize = 8;
  totalPages = 1;
  totalElements = 0;

  private searchDebounce: any;
  private currentKeyword = '';

  constructor(
    private http: HttpClient,
    private cdr: ChangeDetectorRef,
    private router: Router,
    private plantDataService: PlantDataService
  ) {}

  ngOnInit(): void {
    // Luôn fetch mới từ server, không ưu tiên cache khi user thao tác hoặc reload
    this.fetchPlants(0, '');
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
        this.cdr.detectChanges();
      },
      error: () => {
        this.loading = false;
        this.error = 'Không thể tải danh sách cây.';
        this.resetResults();
        this.plantsSubject.next([]);
        this.cdr.detectChanges();
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
}
