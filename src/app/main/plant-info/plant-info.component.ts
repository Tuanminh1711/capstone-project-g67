import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { TopNavigatorComponent } from '../../shared/top-navigator/index';
import { CommonModule } from '@angular/common';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { BehaviorSubject } from 'rxjs';

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
  imports: [TopNavigatorComponent, CommonModule, HttpClientModule, FormsModule],
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
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    // Đảm bảo Angular ổn định trước khi fetch
    setTimeout(() => {
      this.fetchPlants(0, '');
    }, 0);
  }

  private buildUrl(page: number, keyword: string): string {
    let url = `/api/plants/search?pageNo=${page}&pageSize=${this.pageSize}`;
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
        this.currentKeyword = trimmedKeyword;

        if (!data || !Array.isArray(data.plants)) {
          this.resetResults();
          this.plantsSubject.next([]);
          this.cdr.detectChanges(); // đảm bảo cập nhật view
          return;
        }

        this.totalPages = data.totalPages ?? 1;
        this.totalElements = data.totalElements ?? data.plants.length;
        this.currentPage = page;
        this.pageSize = data.pageSize ?? this.pageSize;

        this.plantsSubject.next(data.plants);
        this.cdr.detectChanges(); // đảm bảo cập nhật view
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
}
