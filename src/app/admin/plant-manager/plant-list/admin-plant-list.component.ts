import { Component, OnInit, ChangeDetectorRef, AfterViewInit } from '@angular/core';
import { AuthService } from '../../../auth/auth.service';
import { AdminPlantService } from './admin-plant.service';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { CommonModule, NgIf, NgForOf } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { BehaviorSubject } from 'rxjs';
import { ToastService } from '../../../shared/toast/toast.service';
import { shareReplay } from 'rxjs';
import { BaseAdminListComponent } from '../../shared/base-admin-list.component';
import { environment } from '../../../../environments/environment'; 


interface Plant {
  id: number;
  scientificName: string;
  commonName: string;
  categoryName?: string;
  description: string;
  careInstructions?: string;
  lightRequirement?: string;
  waterRequirement?: string;
  careDifficulty?: string;
  suitableLocation?: string;
  commonDiseases?: string;
  status: string;
  imageUrl?: string;
  imageUrls?: string[];
  createdAt: string | null;
  locked?: boolean;
  isUpdating?: boolean;
}

@Component({
  selector: 'app-admin-plant-list',
  templateUrl: './admin-plant-list.component.html',
  styleUrls: ['./admin-plant-list.component.scss'],
  imports: [
    CommonModule, FormsModule]
})

export class AdminPlantListComponent extends BaseAdminListComponent implements OnInit, AfterViewInit {
  sidebarCollapsed = false;
  plantsSubject = new BehaviorSubject<Plant[]>([]);
  plants$ = this.plantsSubject.asObservable().pipe(shareReplay(1));
  // loading and errorMsg handled by BaseAdminListComponent
  pageNo = 0;
  pageSize = 10;
  totalPages = 1;
  totalElements = 0;
  currentKeyword = '';
  searchText = '';
  searchDebounce: any;
  private dataLoaded = false; // Track if data has been loaded
  
  // Sort properties
  sortField: string = '';
  sortDirection: 'asc' | 'desc' = 'asc';
  sortableFields = ['id', 'commonName', 'categoryName', 'createdAt'];

  constructor(
    private http: HttpClient, 
    private router: Router,
    private cdr: ChangeDetectorRef,
    private authService: AuthService,
    private plantService: AdminPlantService,
    private toast: ToastService
  ) {
    super();
  }


  ngOnInit() {
    // Check role before loading data
    const role = this.authService.getCurrentUserRole();
    if (role !== 'ADMIN' && role !== 'STAFF') {
      this.router.navigate(['/login-admin']);
      return;
    }
    // Load plants immediately if not already loaded
    if (!this.dataLoaded) {
      this.fetchPlants(0, '');
    }
  }

  ngAfterViewInit() {
    // Ensure change detection after view init
    this.cdr.detectChanges();
  }

  private buildUrl(page: number, keyword: string): string {
    const apiBase = '/api'; // Always use proxy path
    let url = `${apiBase}/manager/get-all-plants?page=${page}&size=${this.pageSize}`;
    if (keyword.trim()) {
      url += `&search=${encodeURIComponent(keyword.trim())}`;
    }
    // Spring Boot standard sort format
    if (this.sortField) {
      url += `&sort=${this.sortField},${this.sortDirection}`;
    }
    return url;
  }

  fetchPlants(page: number, keyword: string) {
    this.setLoading(true);
    this.setError('');
    const url = `${environment.apiUrl}/manager/search-plants`;
  const body: any = { page, size: this.pageSize };
    if (keyword && keyword.trim()) {
      body.keyword = keyword.trim();
    }
  // Không gửi sort lên backend vì DTO không hỗ trợ
    this.http.post<any>(url, body).subscribe({
      next: (res) => {
        const data = res?.data;
        let plants = data?.content;
        if (!data || !Array.isArray(plants)) {
          this.plantsSubject.next([]);
          this.setError('Không có dữ liệu cây.');
          this.setLoading(false);
          this.cdr.detectChanges();
          return;
        }
        // Sort client-side nếu có sortField
        if (this.sortField) {
          plants = [...plants].sort((a, b) => {
            const field = this.sortField;
            let aValue = a[field];
            let bValue = b[field];
            // Nếu là string thì so sánh không phân biệt hoa thường
            if (typeof aValue === 'string' && typeof bValue === 'string') {
              aValue = aValue.toLowerCase();
              bValue = bValue.toLowerCase();
            }
            if (aValue < bValue) return this.sortDirection === 'asc' ? -1 : 1;
            if (aValue > bValue) return this.sortDirection === 'asc' ? 1 : -1;
            return 0;
          });
        }
        const plantsWithDefaults = plants.map((plant: Plant) => ({
          ...plant,
          locked: plant.locked ?? false,
          isUpdating: false
        }));
        this.plantsSubject.next(plantsWithDefaults);
        this.totalElements = data.totalElements || plantsWithDefaults.length;
        this.totalPages = data.totalPages || Math.ceil(plantsWithDefaults.length / this.pageSize);
        this.pageNo = data.number || page;
        this.setLoading(false);
        this.currentKeyword = keyword;
        this.dataLoaded = true;
        this.cdr.detectChanges();
      },
      error: (error) => {
        this.setError(`Không thể tải danh sách cây. ${error.status ? `(${error.status})` : ''}`);
        this.plantsSubject.next([]);
        this.setLoading(false);
        this.cdr.detectChanges();
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

  viewPlantDetail(plant: Plant) {
    // Navigate to the plant detail view page
    this.router.navigate(['/admin/plants/view', plant.id]);
  }

  deletePlant(plant: Plant) {
    if (!confirm('Bạn có chắc chắn muốn xóa plant này?')) return;
    this.http.delete(`/api/plants/${plant.id}`).subscribe({
      next: () => {
        this.fetchPlants(this.pageNo, this.currentKeyword);
      },
      error: () => {
        this.setError('Xóa plant thất bại!');
      }
    });
  }

  goToCreatePlant() {
    this.router.navigate(['/admin/plants/create']);
  }

  // Sort functionality
  onSort(field: string) {
    if (this.sortField === field) {
      // Toggle direction if same field
      this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      // New field, default to ascending
      this.sortField = field;
      this.sortDirection = 'asc';
    }
    // Fetch data with new sort parameters from server
    this.fetchPlants(0, this.currentKeyword); // Reset to first page when sorting
  }

  // Remove client-side sorting since we're doing server-side sorting
  // private sortPlants() - This method is no longer needed

  getSortIcon(field: string): string {
    if (this.sortField !== field) {
      return 'fas fa-sort'; // No sort applied
    }
    return this.sortDirection === 'asc' ? 'fas fa-sort-up' : 'fas fa-sort-down';
  }

  isSortable(field: string): boolean {
    return this.sortableFields.includes(field);
  }

  // Lock/Unlock functionality
  lockUnlockPlant(plant: Plant): void {
    if (plant.isUpdating) {
      return; // Prevent multiple clicks
    }

    const isCurrentlyActive = plant.status === 'ACTIVE';
    const action = isCurrentlyActive ? 'lock' : 'unlock';
    const actionText = isCurrentlyActive ? 'khóa' : 'mở khóa';
    const newStatus = isCurrentlyActive ? 'INACTIVE' : 'ACTIVE';
    
    if (!confirm(`Bạn có chắc chắn muốn ${actionText} cây "${plant.commonName}"?`)) {
      return;
    }

    // Set updating state
    plant.isUpdating = true;

    const lockData = {
      plantId: plant.id,
      lock: isCurrentlyActive // true = khóa (INACTIVE), false = mở khóa (ACTIVE)
    };

    this.http.post('/api/manager/lock-unlock', lockData).subscribe({
      next: (response: any) => {
        // Update the plant status locally
        plant.status = newStatus;
        plant.isUpdating = false;
        // Update the plants in BehaviorSubject
        const currentPlants = this.plantsSubject.getValue();
        const updatedPlants = currentPlants.map((p: Plant) => 
          p.id === plant.id ? { ...p, status: newStatus, isUpdating: false } : p
        );
        this.plantsSubject.next(updatedPlants);
        this.cdr.detectChanges();
        // Show success toast
        this.toast.success(`Đã ${actionText} cây thành công!`);
      },
      error: (error) => {
        // Reset updating state
        plant.isUpdating = false;
        let errorMessage = `Không thể ${actionText} cây. `;
        if (error.status === 401) {
          errorMessage += 'Bạn không có quyền thực hiện thao tác này.';
        } else if (error.status === 404) {
          errorMessage += 'Không tìm thấy cây này.';
        } else if (error.error?.message) {
          errorMessage += error.error.message;
        } else {
          errorMessage += 'Vui lòng thử lại sau.';
        }
        alert(errorMessage);
      }
    });
  }

  getLockButtonText(plant: Plant): string {
    // Nếu cây INACTIVE, hiển thị "Mở khóa", nếu ACTIVE thì hiển thị "Khóa"
    return plant.status === 'INACTIVE' ? 'Mở khóa' : 'Khóa';
  }

  getLockButtonClass(plant: Plant): string {
    // Nếu cây INACTIVE, style như unlock button, nếu ACTIVE thì style như lock button
    return plant.status === 'INACTIVE' ? 'btn-unlock' : 'btn-lock';
  }

  getLockIcon(plant: Plant): string {
    // Nếu cây INACTIVE, icon unlock, nếu ACTIVE thì icon lock
    return plant.status === 'INACTIVE' ? 'fas fa-unlock' : 'fas fa-lock';
  }

  getStatusClass(status: string): string {
    return status === 'ACTIVE' ? 'status-active' : 'status-inactive';
  }

  trackByPlant(index: number, plant: Plant): number {
    return plant.id;
  }

  formatDate(dateString: string | null): string {
    if (!dateString) return '';
    try {
      return new Date(dateString).toLocaleString('vi-VN', {
        day: '2-digit', month: '2-digit', year: 'numeric',
        hour: '2-digit', minute: '2-digit', second: '2-digit'
      });
    } catch {
      return dateString;
    }
  }

  // Format ngày không có giây
  formatDateNoSeconds(dateString: string | null): string {
    if (!dateString) return '';
    try {
      const d = new Date(dateString);
      return d.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', hour12: false }) +
        ' ' + d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
    } catch {
      return dateString;
    }
  }

  // Đổi trạng thái cây từ dropdown
  changePlantStatus(plant: Plant, event: Event) {
    const select = event.target as HTMLSelectElement;
    const newStatus = select.value;
    if (plant.status === newStatus) {
      return; // No change
    }
    // Confirmation dialog
    const confirmMsg = newStatus === 'ACTIVE' ?
      'Bạn có chắc chắn muốn mở khóa cây này?' :
      'Bạn có chắc chắn muốn khóa cây này?';
    if (!window.confirm(confirmMsg)) {
      // Revert dropdown selection if cancelled
      select.value = plant.status;
      return;
    }
    plant.isUpdating = true;
    // You need to implement changePlantStatus in AdminPlantService
    // Compose the update request with all required fields
    const updateRequest = {
      scientificName: plant.scientificName,
      commonName: plant.commonName,
      categoryId: (plant as any).categoryId || 1, // fallback if missing
      description: plant.description,
      careInstructions: plant.careInstructions || '',
      lightRequirement: plant.lightRequirement || 'LOW',
      waterRequirement: plant.waterRequirement || 'LOW',
      careDifficulty: plant.careDifficulty || 'EASY',
      suitableLocation: plant.suitableLocation || '',
      commonDiseases: plant.commonDiseases || '',
      status: newStatus
    };
    this.plantService.updatePlant(plant.id, updateRequest).subscribe({
      next: (response: any) => {
        plant.status = newStatus;
        plant.isUpdating = false;
        // Update the plants in BehaviorSubject
        const currentPlants = this.plantsSubject.getValue();
        const updatedPlants = currentPlants.map((p: Plant) =>
          p.id === plant.id ? { ...p, status: newStatus, isUpdating: false } : p
        );
        this.plantsSubject.next(updatedPlants);
        this.cdr.detectChanges();
        // Show success toast if BE trả status 200
        if (response && (response.status === 200 || response.success === true)) {
          this.toast.success('Thay đổi trạng thái thành công!');
        }
      },
      error: (error: any) => {
        plant.isUpdating = false;
        let errorMessage = `Không thể đổi trạng thái cây. `;
        if (error.status === 401) {
          errorMessage += 'Bạn không có quyền thực hiện thao tác này.';
        } else if (error.status === 404) {
          errorMessage += 'Không tìm thấy cây này.';
        } else if (error.error?.message) {
          errorMessage += error.error.message;
        } else {
          errorMessage += 'Vui lòng thử lại sau.';
        }
        alert(errorMessage);
        // Revert dropdown selection on error
        select.value = plant.status;
      }
    });
  }
}
