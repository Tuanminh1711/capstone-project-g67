
export const CARE_TYPES = [
  { careTypeId: 1, careTypeName: 'Tưới nước' },
  { careTypeId: 2, careTypeName: 'Bón phân' },
  { careTypeId: 3, careTypeName: 'Cắt tỉa' },
  { careTypeId: 4, careTypeName: 'Bón phân' }

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
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';

export interface CareReminderSchedule {
  careTypeId: number;
  enabled: boolean;
}

export interface CareReminderRequest {
  schedules: CareReminderSchedule[];
}

@Injectable({ providedIn: 'root' })
export class CareReminderService {
  private readonly baseUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  updateCareReminders(UserPlant: number, schedules: CareReminderSchedule[]): Observable<any> {
    const url = `${this.baseUrl}/plant-care/${UserPlant}/care-reminders`;
    // Nếu muốn truyền customMessage, thêm vào body
    const body: any = { schedules };
    body.customMessage = 'Đã đến lúc tưới nước/bón phân cho cây!';
    return this.http.post(url, body, { responseType: 'text' as 'json' });
  }

  /**
   * Lấy danh sách trạng thái nhắc nhở từng loại cho một cây
   * @param plantId id của cây
   */
  getCareReminders(plantId: number): Observable<CareReminderRequest> {
    const url = `${this.baseUrl}/plant-care/${plantId}/care-reminders`;
    return this.http.get<CareReminderRequest>(url);
  }
}
