import { Injectable } from '@angular/core';

export interface PlantOption {
  value: string;
  label: string;
}

@Injectable({
  providedIn: 'root'
})
export class PlantOptionsService {

  // Vị trí phù hợp cho cây - tương tự như trong add plant to collection
  readonly suitableLocationOptions: PlantOption[] = [
    { value: 'Phòng khách', label: 'Phòng khách' },
    { value: 'Phòng ngủ', label: 'Phòng ngủ' },
    { value: 'Phòng bếp', label: 'Phòng bếp' },
    { value: 'Ban công', label: 'Ban công' },
    { value: 'Sân vườn', label: 'Sân vườn' },
    { value: 'Phòng làm việc', label: 'Phòng làm việc' },
    { value: 'Phòng tắm', label: 'Phòng tắm' },
    { value: 'Hành lang', label: 'Hành lang' },
    { value: 'Góc cửa sổ', label: 'Góc cửa sổ' },
    { value: 'Góc tường', label: 'Góc tường' },
    { value: 'Trên bàn làm việc', label: 'Trên bàn làm việc' },
    { value: 'Trên kệ sách', label: 'Trên kệ sách' },
    { value: 'Trên tủ', label: 'Trên tủ' },
    { value: 'Ngoài trời', label: 'Ngoài trời' },
    { value: 'Trong nhà', label: 'Trong nhà' },
    { value: 'Khác', label: 'Khác' }
  ];

  // Yêu cầu ánh sáng
  readonly lightRequirementOptions: PlantOption[] = [
    { value: 'LOW', label: 'Ánh sáng yếu' },
    { value: 'MEDIUM', label: 'Ánh sáng vừa phải' },
    { value: 'HIGH', label: 'Ánh sáng mạnh' },
    { value: 'DIRECT', label: 'Ánh sáng trực tiếp' }
  ];

  // Yêu cầu nước
  readonly waterRequirementOptions: PlantOption[] = [
    { value: 'LOW', label: 'Ít nước' },
    { value: 'MEDIUM', label: 'Nước vừa phải' },
    { value: 'HIGH', label: 'Nhiều nước' }
  ];

  // Độ khó chăm sóc
  readonly careDifficultyOptions: PlantOption[] = [
    { value: 'EASY', label: 'Dễ chăm sóc' },
    { value: 'MODERATE', label: 'Trung bình' },
    { value: 'DIFFICULT', label: 'Khó chăm sóc' }
  ];

  // Trạng thái cây
  readonly statusOptions: PlantOption[] = [
    { value: 'ACTIVE', label: 'Hoạt động' },
    { value: 'INACTIVE', label: 'Không hoạt động' }
  ];

  constructor() { }

  /**
   * Lấy danh sách vị trí phù hợp
   */
  getSuitableLocationOptions(): PlantOption[] {
    return [...this.suitableLocationOptions];
  }

  /**
   * Lấy danh sách yêu cầu ánh sáng
   */
  getLightRequirementOptions(): PlantOption[] {
    return [...this.lightRequirementOptions];
  }

  /**
   * Lấy danh sách yêu cầu nước
   */
  getWaterRequirementOptions(): PlantOption[] {
    return [...this.waterRequirementOptions];
  }

  /**
   * Lấy danh sách độ khó chăm sóc
   */
  getCareDifficultyOptions(): PlantOption[] {
    return [...this.careDifficultyOptions];
  }

  /**
   * Lấy danh sách trạng thái
   */
  getStatusOptions(): PlantOption[] {
    return [...this.statusOptions];
  }

  /**
   * Lấy label từ value
   */
  getLabelByValue(options: PlantOption[], value: string): string {
    const option = options.find(opt => opt.value === value);
    return option ? option.label : value;
  }
}
