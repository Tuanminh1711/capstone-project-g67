import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export interface Plant {
  id: number;
  scientificName: string;
  commonName: string;
  categoryName: string;
  description: string;
  careInstructions?: string;
  lightRequirement: string;
  waterRequirement: string;
  careDifficulty: string;
  suitableLocation: string;
  commonDiseases?: string;
  status: string;
  imageUrls: string[];
  createdAt: string | null;
}

/**
 * Service chia sẻ dữ liệu cây giữa các components
 */
@Injectable({
  providedIn: 'root'
})
export class PlantDataService {
  private selectedPlantSubject = new BehaviorSubject<Plant | null>(null);
  public selectedPlant$ = this.selectedPlantSubject.asObservable();

  private plantsListSubject = new BehaviorSubject<Plant[]>([]);
  public plantsList$ = this.plantsListSubject.asObservable();

  /**
   * Đặt cây được chọn
   */
  setSelectedPlant(plant: Plant): void {
    this.selectedPlantSubject.next(plant);
    try {
      localStorage.setItem('selectedPlant', JSON.stringify(plant));
    } catch {}
  }

  /**
   * Lấy cây được chọn
   */
  getSelectedPlant(): Plant | null {
    const current = this.selectedPlantSubject.value;
    if (current) return current;
    // Nếu chưa có trong subject, thử lấy từ localStorage
    try {
      const raw = localStorage.getItem('selectedPlant');
      if (raw) {
        const plant = JSON.parse(raw);
        // Validate dữ liệu: phải có id
        if (!plant || typeof plant.id !== 'number') {
          this.clearData();
          return null;
        }
        // Đảm bảo imageUrls luôn là mảng
        if (!Array.isArray(plant.imageUrls)) {
          plant.imageUrls = [];
        }
        this.selectedPlantSubject.next(plant);
        return plant;
      }
    } catch {
      this.clearData();
    }
    return null;
  }

  /**
   * Đặt danh sách cây
   */
  setPlantsList(plants: Plant[]): void {
    this.plantsListSubject.next(plants);
  }

  /**
   * Tìm cây theo ID từ danh sách đã cache
   */
  getPlantById(id: number): Plant | null {
    const plants = this.plantsListSubject.value;
    return plants.find(p => p.id === id) || null;
  }

  /**
   * Clear dữ liệu
   */
  clearData(): void {
    this.selectedPlantSubject.next(null);
    this.plantsListSubject.next([]);
    try {
      localStorage.removeItem('selectedPlant');
    } catch {}
  }
}
