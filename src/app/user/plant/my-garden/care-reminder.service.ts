// Danh sách careType cố định (có thể lấy từ API nếu cần động)
export const CARE_TYPES = [
  { careTypeId: 1, careTypeName: 'Tưới nước' },
  { careTypeId: 2, careTypeName: 'Bón phân' }
];
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
