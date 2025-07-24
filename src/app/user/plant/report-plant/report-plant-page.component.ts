import { Component, inject, OnInit, ChangeDetectorRef } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ToastService } from '../../../shared/toast/toast.service';
import { PlantDataService, Plant } from '../../../shared/plant-data.service';
import { TopNavigatorComponent } from '../../../shared/top-navigator/index';
import { CookieService } from '../../../auth/cookie.service';

@Component({
  selector: 'app-report-plant-page',
  standalone: true,
  imports: [CommonModule, FormsModule, TopNavigatorComponent],
  templateUrl: './report-plant-page.component.html',
  styleUrls: ['./report-plant-page.component.scss']
})
export class ReportPlantPageComponent implements OnInit {
  plant: Plant | null = null;
  reason = '';
  errorMsg = '';
  submitting = false;
  private toast = inject(ToastService);
  private http = inject(HttpClient);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private plantDataService = inject(PlantDataService);
  private cdr = inject(ChangeDetectorRef);
  private cookieService = inject(CookieService);

  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.loadPlantDetailWithCacheLogic(+id);
    }
  }

  /**
   * Logic giống trang plant detail: ưu tiên cache, service, fallback API
   */
  private loadPlantDetailWithCacheLogic(plantId: number) {
    // 1. Thử từ cache localStorage (giống plant detail)
    const cached = this.loadCachedPlant(plantId);
    if (cached) {
      this.plant = cached;
      return;
    }
    // 2. Thử từ service
    const selectedPlant = this.plantDataService.getSelectedPlant();
    if (selectedPlant?.id === plantId) {
      this.plant = selectedPlant;
      if (this.plant) this.cachePlant(this.plant);
      return;
    }
    const cachedListPlant = this.plantDataService.getPlantById(plantId);
    if (cachedListPlant) {
      this.plant = cachedListPlant;
      if (this.plant) this.cachePlant(this.plant);
      return;
    }
    // 3. Fallback gọi API (nếu backend hỗ trợ)
    this.http.get<any>(`/api/plants/${plantId}`).subscribe({
      next: (res) => {
        this.plant = res.data || res;
        if (this.plant) {
          this.cachePlant(this.plant);
        }
      },
      error: () => {
        this.errorMsg = 'Không tìm thấy thông tin cây.';
      }
    });
  }

  /**
   * Copy từ plant detail
   */
  private loadCachedPlant(plantId: number): Plant | null {
    try {
      const cached = localStorage.getItem(`plant_${plantId}`);
      if (cached) {
        const plantData = JSON.parse(cached);
        const cacheTime = new Date(plantData.cachedAt).getTime();
        const now = new Date().getTime();
        if (now - cacheTime < 5 * 60 * 1000) { // 5 minutes
          return plantData.plant;
        }
      }
    } catch (e) {}
    return null;
  }

  private cachePlant(plant: Plant): void {
    try {
      const cacheData = {
        plant: plant,
        cachedAt: new Date().toISOString()
      };
      localStorage.setItem(`plant_${plant.id}`, JSON.stringify(cacheData));
    } catch (e) {}
  }

  submitReport() {
    if (!this.reason.trim() || !this.plant) {
      this.toast.error('Vui lòng nhập lý do báo cáo.');
      return;
    }
    this.submitting = true;
    // Lấy token từ cookie
    const token = this.cookieService.getAuthToken();
    const headers = token ? new HttpHeaders({ 'Authorization': `Bearer ${token}` }) : undefined;
    this.http.post('/api/plants-report/reason', {
      plantId: this.plant.id,
      reason: this.reason.trim()
    }, { withCredentials: true, headers }).subscribe({
      next: () => {
        this.toast.success('Báo cáo của bạn đã được gửi!');
        if (this.plant) {
          this.router.navigate(['/plant-detail', this.plant.id]);
        }
      },
      error: (err) => {
        // Ưu tiên hiện err.message nếu có, sau đó đến err.error.message
        if (err?.message) {
          this.toast.error(err.message);
        } else if (err?.error?.message) {
          this.toast.error(err.error.message);
        } else {
          this.toast.error('Gửi báo cáo thất bại!');
        }
        this.submitting = false;
        this.cdr.detectChanges();
      }
    });
  }

  goToPlantInfo() {
    if (this.plant?.id) {
      this.router.navigate(['/plant-detail', this.plant.id]);
    } else {
      this.router.navigate(['/plant-info']);
    }
  }

  // Translation Methods
  translateLightRequirement(value: string): string {
    const translations: { [key: string]: string } = {
      'LOW': 'Ít ánh sáng',
      'MEDIUM': 'Ánh sáng vừa phải',
      'HIGH': 'Nhiều ánh sáng'
    };
    return translations[value?.toUpperCase()] || value || 'Chưa có thông tin';
  }

  translateWaterRequirement(value: string): string {
    const translations: { [key: string]: string } = {
      'LOW': 'Ít nước',
      'MEDIUM': 'Nước vừa phải',
      'HIGH': 'Nhiều nước'
    };
    return translations[value?.toUpperCase()] || value || 'Chưa có thông tin';
  }

  translateCareDifficulty(value: string): string {
    const translations: { [key: string]: string } = {
      'EASY': 'Dễ chăm sóc',
      'MODERATE': 'Trung bình',
      'DIFFICULT': 'Khó chăm sóc'
    };
    return translations[value?.toUpperCase()] || value || 'Chưa có thông tin';
  }

  formatDate(dateString: string): string {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString('vi-VN');
  }

  // New helper methods for enhanced UI
  getLightPosition(value: string): string {
    const positions: { [key: string]: string } = {
      'LOW': 'Góc tối, xa cửa sổ',
      'MEDIUM': 'Gần cửa sổ, ánh sáng gián tiếp',
      'HIGH': 'Cửa sổ hướng nam, ánh sáng trực tiếp'
    };
    return positions[value?.toUpperCase()] || 'Tùy theo loại cây';
  }

  getWaterFrequency(value: string): string {
    const frequencies: { [key: string]: string } = {
      'LOW': '1-2 lần/tuần',
      'MEDIUM': '2-3 lần/tuần',
      'HIGH': '3-4 lần/tuần'
    };
    return frequencies[value?.toUpperCase()] || 'Theo nhu cầu';
  }

  getDifficultyClass(value: string): string {
    const classes: { [key: string]: string } = {
      'EASY': 'easy-indicator',
      'MODERATE': 'moderate-indicator',
      'DIFFICULT': 'difficult-indicator'
    };
    return classes[value?.toUpperCase()] || 'default-indicator';
  }

  getDifficultyTip(value: string): string {
    const tips: { [key: string]: string } = {
      'EASY': 'Phù hợp người mới bắt đầu',
      'MODERATE': 'Cần chút kinh nghiệm',
      'DIFFICULT': 'Dành cho người có kinh nghiệm'
    };
    return tips[value?.toUpperCase()] || 'Tùy theo kinh nghiệm';
  }

  addSuggestion(suggestion: string): void {
    if (!this.reason.includes(suggestion)) {
      this.reason += (this.reason ? '. ' : '') + suggestion;
    }
  }
}
