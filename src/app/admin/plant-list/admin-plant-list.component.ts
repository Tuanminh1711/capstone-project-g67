import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { CommonModule, NgForOf, NgIf } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { BehaviorSubject } from 'rxjs';
import { AdminTopNavigatorComponent } from '../../shared/admin-top-navigator/admin-top-navigator.component';
import { AdminSidebarComponent } from '../../shared/admin-sidebar/admin-sidebar.component';
import { AdminFooterComponent } from '../../shared/admin-footer/admin-footer.component';
import { AdminLayoutComponent } from '../../shared/admin-layout/admin-layout.component';

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
  selector: 'app-admin-plant-list',
  templateUrl: './admin-plant-list.component.html',
  styleUrls: ['./admin-plant-list.component.scss'],
  imports: [
    CommonModule, FormsModule, NgIf, NgForOf,
    AdminLayoutComponent
  ]
})
export class AdminPlantListComponent implements OnInit {
  sidebarCollapsed = false;
  plantsSubject = new BehaviorSubject<Plant[]>([]);
  plants$ = this.plantsSubject.asObservable();
  loading = false;
  errorMsg = '';
  pageNo = 0;
  pageSize = 10;
  totalPages = 1;
  totalElements = 0;
  currentKeyword = '';
  searchText = '';
  searchDebounce: any;

  constructor(private http: HttpClient) {}

  ngOnInit() {
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

  fetchPlants(page: number, keyword: string) {
    this.loading = true;
    this.errorMsg = '';
    this.http.get<any>(this.buildUrl(page, keyword)).subscribe({
      next: (res) => {
        const data = res?.data;
        if (!data || !Array.isArray(data.plants)) {
          this.plantsSubject.next([]);
          this.errorMsg = 'Không có dữ liệu cây.';
          this.loading = false;
          return;
        }
        this.plantsSubject.next(data.plants);
        this.totalElements = data.totalElements || data.plants.length;
        this.totalPages = data.totalPages || 1;
        this.pageNo = data.currentPage ?? page;
        this.loading = false;
        this.currentKeyword = keyword;
      },
      error: () => {
        this.errorMsg = 'Không thể tải danh sách cây.';
        this.plantsSubject.next([]);
        this.loading = false;
      }
    });
  }

  onSearch() {
    this.fetchPlants(0, this.searchText.trim());
  }

  onSearchInputChange() {
    clearTimeout(this.searchDebounce);
    this.searchDebounce = setTimeout(() => {
      const keyword = this.searchText.trim();
      if (keyword !== this.currentKeyword) {
        this.fetchPlants(0, keyword);
      }
    }, 300);
  }

  goToPage(page: number) {
    if (page >= 0 && page < this.totalPages) {
      this.fetchPlants(page, this.currentKeyword);
    }
  }

  nextPage() {
    if (this.pageNo + 1 < this.totalPages) {
      this.pageNo++;
      this.fetchPlants(this.pageNo, this.currentKeyword);
    }
  }

  prevPage() {
    if (this.pageNo > 0) {
      this.pageNo--;
      this.fetchPlants(this.pageNo, this.currentKeyword);
    }
  }

  editPlant(plant: Plant) {
    // Chuyển sang trang sửa plant
    window.location.href = `/admin/plants/edit/${plant.id}`;
  }

  deletePlant(plant: Plant) {
    if (!confirm('Bạn có chắc chắn muốn xóa plant này?')) return;
    this.http.delete(`/api/plants/${plant.id}`).subscribe({
      next: () => {
        this.fetchPlants(this.pageNo, this.currentKeyword);
      },
      error: () => {
        this.errorMsg = 'Xóa plant thất bại!';
      }
    });
  }
}
