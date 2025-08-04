import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class PlantUiHelperService {
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

  /**
   * Report Status Translation
   */
  translateReportStatus(status: string): string {
    const translations: { [key: string]: string } = {
      'PENDING': 'Đang chờ xử lý',
      'CLAIMED': 'Đã tiếp nhận',
      'APPROVED': 'Đã phê duyệt',
      'REJECTED': 'Đã từ chối',
      'IN_PROGRESS': 'Đang xử lý'
    };
    return translations[status?.toUpperCase()] || status || 'Không rõ';
  }

  getReportStatusClass(status: string): string {
    const classes: { [key: string]: string } = {
      'PENDING': 'status-pending',
      'CLAIMED': 'status-claimed',
      'APPROVED': 'status-approved',
      'REJECTED': 'status-rejected',
      'IN_PROGRESS': 'status-in-progress'
    };
    return classes[status?.toUpperCase()] || 'status-default';
  }

  getReportStatusIcon(status: string): string {
    const icons: { [key: string]: string } = {
      'PENDING': 'fas fa-clock',
      'CLAIMED': 'fas fa-hand-paper',
      'APPROVED': 'fas fa-check-circle',
      'REJECTED': 'fas fa-times-circle',
      'IN_PROGRESS': 'fas fa-spinner'
    };
    return icons[status?.toUpperCase()] || 'fas fa-question-circle';
  }
}
