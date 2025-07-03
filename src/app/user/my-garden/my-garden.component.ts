import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { TopNavigatorComponent } from '../../shared/top-navigator/index';
import { CookieService } from '../../auth/cookie.service';
import { ToastService } from '../../shared/toast.service';

interface UserPlant {
  id: number;
  plantId: number;
  nickname: string;
  plantingDate: string;
  locationInHouse: string;
  reminderEnabled: boolean;
  plant: {
    id: number;
    commonName: string;
    scientificName: string;
    categoryName: string;
    imageUrls: string[];
    lightRequirement: string;
    waterRequirement: string;
    careDifficulty: string;
  };
}

@Component({
  selector: 'app-my-garden',
  standalone: true,
  imports: [CommonModule, TopNavigatorComponent],
  templateUrl: './my-garden.component.html',
  styleUrls: ['./my-garden.component.scss']
})
export class MyGardenComponent implements OnInit {
  userPlants: UserPlant[] = [];
  loading = false;
  error = '';
  layout: 'grid' | 'list' = 'grid';
  filter: 'all' | 'reminder' | 'no-reminder' = 'all';

  constructor(
    private http: HttpClient,
    public router: Router,
    private cookieService: CookieService,
    private toastService: ToastService
  ) {}

  get filteredPlants(): UserPlant[] {
    if (this.filter === 'all') return this.userPlants;
    if (this.filter === 'reminder') return this.userPlants.filter(p => p.reminderEnabled);
    if (this.filter === 'no-reminder') return this.userPlants.filter(p => !p.reminderEnabled);
    return this.userPlants;
  }

  ngOnInit(): void {
    this.loadUserPlants();
  }

  loadUserPlants(): void {
    const token = this.cookieService.getAuthToken();
    if (!token) {
      this.router.navigate(['/login']);
      return;
    }

    this.loading = true;
    this.error = '';

    this.http.get<any>('http://localhost:8080/api/user-plants').subscribe({
      next: (response) => {
        this.loading = false;
        this.userPlants = response.data || response || [];
      },
      error: (err) => {
        this.loading = false;
        console.error('Error loading user plants:', err);
        
        if (err.status === 401 || err.status === 403) {
          this.router.navigate(['/login']);
        } else {
          this.error = 'Không thể tải danh sách cây của bạn. Vui lòng thử lại.';
        }
      }
    });
  }

  viewPlantDetail(plantId: number): void {
    this.router.navigate(['/plant-detail', plantId]);
  }

  removePlantFromCollection(userPlantId: number): void {
    if (!confirm('Bạn có chắc chắn muốn xóa cây này khỏi bộ sưu tập?')) {
      return;
    }

    this.http.delete(`http://localhost:8080/api/user-plants/${userPlantId}`).subscribe({
      next: () => {
        this.toastService.success('Đã xóa cây khỏi bộ sưu tập');
        this.loadUserPlants(); // Reload list
      },
      error: (err) => {
        console.error('Error removing plant:', err);
        this.toastService.error('Không thể xóa cây. Vui lòng thử lại.');
      }
    });
  }

  formatDate(dateString: string): string {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString('vi-VN');
  }

  // Translation methods
  translateLightRequirement(value?: string): string {
    if (!value) return 'Chưa có thông tin';
    const translations: { [key: string]: string } = {
      'LOW': 'Ít ánh sáng',
      'MEDIUM': 'Ánh sáng vừa phải',
      'HIGH': 'Nhiều ánh sáng'
    };
    return translations[value.toUpperCase()] || value || 'Chưa có thông tin';
  }

  translateWaterRequirement(value?: string): string {
    if (!value) return 'Chưa có thông tin';
    const translations: { [key: string]: string } = {
      'LOW': 'Ít nước',
      'MEDIUM': 'Nước vừa phải',
      'HIGH': 'Nhiều nước'
    };
    return translations[value.toUpperCase()] || value || 'Chưa có thông tin';
  }

  translateCareDifficulty(value?: string): string {
    if (!value) return 'Chưa có thông tin';
    const translations: { [key: string]: string } = {
      'EASY': 'Dễ chăm sóc',
      'MODERATE': 'Trung bình',
      'DIFFICULT': 'Khó chăm sóc'
    };
    return translations[value.toUpperCase()] || value || 'Chưa có thông tin';
  }
}
