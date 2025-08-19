
export const CARE_TYPES = [
  { careTypeId: 1, careTypeName: 'Tưới nước' },
  { careTypeId: 2, careTypeName: 'Bón phân' },
  { careTypeId: 3, careTypeName: 'Cắt tỉa' },
  { careTypeId: 4, careTypeName: 'Phun thuốc trừ sâu' }
];

/**
 * Trả về mảng schedules mặc định cho nút "Bật tất cả nhắc nhở" (8h sáng, message mặc định)
 */
export function getDefaultCareReminders(): any[] {
  // Lấy ngày mai
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const startDate = tomorrow.toISOString().slice(0, 10); // yyyy-MM-dd
  return CARE_TYPES.map(type => ({
    careTypeId: type.careTypeId,
    enabled: true,
    frequencyDays: 1,
    reminderTime: '08:00',
    customMessage: 'Đã tới giờ chăm sóc cây',
    startDate
  }));
}

/**
 * Trả về mảng schedules mặc định với tùy chọn enabled/disabled
 */
export function getDefaultCareRemindersWithStatus(enabled: boolean = true): any[] {
  const schedules = getDefaultCareReminders();
  return schedules.map(schedule => ({
    ...schedule,
    enabled: enabled
  }));
}

/**
 * Trả về mảng schedules mặc định với tùy chọn tần suất
 */
export function getDefaultCareRemindersWithFrequency(frequencyDays: number = 1, enabled: boolean = true): any[] {
  const schedules = getDefaultCareReminders();
  return schedules.map(schedule => ({
    ...schedule,
    frequencyDays: frequencyDays,
    enabled: enabled
  }));
}

/**
 * Trả về mảng schedules mặc định với tùy chọn thời gian
 */
export function getDefaultCareRemindersWithTime(reminderTime: string = '08:00', enabled: boolean = true): any[] {
  const schedules = getDefaultCareReminders();
  return schedules.map(schedule => ({
    ...schedule,
    reminderTime: reminderTime,
    enabled: enabled
  }));
}

import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../../environments/environment';

export interface CareReminderSchedule {
  careTypeId: number;
  enabled: boolean;
  frequencyDays?: number;
  reminderTime?: string;
  customMessage?: string;
  startDate?: string;
}

export interface CareReminderRequest {
  schedules: CareReminderSchedule[];
}

@Injectable({ providedIn: 'root' })
export class CareReminderService {
  private readonly baseUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  updateCareReminders(userPlantId: number, schedules: CareReminderSchedule[]): Observable<any> {
    // Validate userPlantId
    if (!userPlantId || userPlantId <= 0) {
      throw new Error('Invalid userPlantId');
    }
    
    const url = `${this.baseUrl}/plant-care/${userPlantId}/care-reminders`;
    
    // Gửi đầy đủ thông tin lịch nhắc nhở, chỉ bật những loại được chọn
    const body: any = { 
      schedules: schedules.map(schedule => ({
        careTypeId: schedule.careTypeId,
        enabled: schedule.enabled, // Giữ nguyên trạng thái bật/tắt từ user
        // Sử dụng thông tin lịch từ schedule nếu có, nếu không thì dùng mặc định
        frequencyDays: schedule.frequencyDays || 1,
        reminderTime: schedule.reminderTime || '08:00',
        customMessage: schedule.customMessage || 'Đã tới giờ chăm sóc cây',
        startDate: schedule.startDate || this.getTomorrowDate()
      }))
    };
    
    return this.http.post(url, body, { responseType: 'text' as 'json' });
  }

  /**
   * Lấy danh sách trạng thái nhắc nhở từng loại cho một cây
   * @param userPlantId id của user plant
   */
  getCareReminders(userPlantId: number): Observable<CareReminderRequest> {
    // Validate userPlantId
    if (!userPlantId || userPlantId <= 0) {
      throw new Error('Invalid userPlantId');
    }
    
    const url = `${this.baseUrl}/plant-care/${userPlantId}/care-reminders`;
    return this.http.get<CareReminderRequest>(url);
  }

  /**
   * Thiết lập lịch nhắc nhở mặc định cho một cây
   * @param userPlantId id của user plant
   * @param enabled trạng thái bật/tắt
   * @param frequencyDays tần suất (ngày)
   * @param reminderTime thời gian nhắc (HH:mm)
   * @param customMessage tin nhắn tùy chỉnh
   */
  setupDefaultCareReminders(
    userPlantId: number, 
    enabled: boolean = true,
    frequencyDays: number = 1,
    reminderTime: string = '08:00',
    customMessage: string = 'Đã tới giờ chăm sóc cây'
  ): Observable<any> {
    const schedules = CARE_TYPES.map(type => ({
      careTypeId: type.careTypeId,
      enabled: enabled,
      frequencyDays: frequencyDays,
      reminderTime: reminderTime,
      customMessage: customMessage,
      startDate: this.getTomorrowDate()
    }));

    return this.updateCareReminders(userPlantId, schedules);
  }

  /**
   * Lấy ngày mai dưới dạng yyyy-MM-dd
   */
  private getTomorrowDate(): string {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().slice(0, 10);
  }
}
