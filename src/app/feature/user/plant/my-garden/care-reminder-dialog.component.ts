import { Component, Inject, Input, Output, EventEmitter } from '@angular/core';
import { CARE_TYPES, CareReminderSchedule } from './care-reminder.service';

@Component({
  selector: 'app-care-reminder-dialog',
  template: `
    <div class="dialog-backdrop" (click)="onClose()"></div>
    <div class="dialog-content">
      <div class="dialog-icon">🔔</div>
      <h2>Tuỳ chỉnh nhắc nhở từng loại</h2>
      <div class="dialog-desc">Chọn những loại nhắc nhở bạn muốn bật. Những loại không chọn sẽ bị tắt:</div>
      
      <!-- Thông tin lịch mặc định -->
      <div class="default-schedule-info">
        <div class="schedule-header">
          <i class="fas fa-calendar-alt"></i>
          <span>Lịch nhắc nhở mặc định</span>
        </div>
        <div class="schedule-details">
          <div class="schedule-item">
            <span class="label">Ngày tiếp theo:</span>
            <span class="value">{{ getTomorrowDate() }}</span>
          </div>
          <div class="schedule-item">
            <span class="label">Tần suất:</span>
            <span class="value">1 ngày</span>
          </div>
          <div class="schedule-item">
            <span class="label">Thời gian nhắc:</span>
            <span class="value">08:00</span>
          </div>
          <div class="schedule-item">
            <span class="label">Ghi chú:</span>
            <span class="value">Đã tới giờ chăm sóc cây</span>
          </div>
        </div>
      </div>

      <div class="reminder-list">
        @for (type of careTypes; track type.careTypeId) {
          <label class="reminder-label-item">
            <input type="checkbox" [checked]="isEnabled(type.careTypeId)" (change)="toggleType(type.careTypeId, $any($event.target).checked)" />
            <span class="reminder-type-name">{{ type.careTypeName }}</span>
            <span class="reminder-status" [class.on]="isEnabled(type.careTypeId)" [class.off]="!isEnabled(type.careTypeId)">
              {{ isEnabled(type.careTypeId) ? 'Đang bật' : 'Đang tắt' }}
            </span>
          </label>
        }
      </div>
      
      <div class="dialog-actions">
        <button class="save-btn" (click)="onSave()"><i class="fas fa-save"></i> Lưu</button>
        <button class="cancel-btn" (click)="onClose()"><i class="fas fa-times"></i> Huỷ</button>
      </div>
    </div>
  `,
  styles: [`
    .dialog-backdrop { position: fixed; top:0; left:0; right:0; bottom:0; background:rgba(0,0,0,0.25); z-index:1000; }
    .dialog-content { position: fixed; top:50%; left:50%; transform:translate(-50%,-50%); background:white; padding:24px 28px 20px 28px; border-radius:16px; z-index:1001; min-width:380px; max-height:85vh; overflow-y:auto; box-shadow:0 8px 32px rgba(56,161,105,0.18); display: flex; flex-direction: column; align-items: stretch; }
    .dialog-icon { font-size:2rem; text-align:center; margin-bottom: 6px; }
    h2 { font-size: 1.2rem; font-weight: 700; color: #38a169; margin-bottom: 6px; text-align: center; }
    .dialog-desc { color: #4a5568; font-size: 0.95rem; text-align: center; margin-bottom: 14px; }
    
    .default-schedule-info { 
      background: #f7fafc; 
      border: 1px solid #e2e8f0; 
      border-radius: 10px; 
      padding: 12px; 
      margin-bottom: 16px; 
    }
    .schedule-header { 
      display: flex; 
      align-items: center; 
      gap: 6px; 
      font-weight: 600;  
      color: #38a169; 
      margin-bottom: 10px; 
      font-size: 1rem;
    }
    .schedule-header i { color: #38a169; }
    .schedule-details { display: grid; gap: 6px; }
    .schedule-item { 
      display: flex; 
      justify-content: space-between; 
      align-items: center; 
      padding: 4px 0; 
      border-bottom: 1px solid #edf2f7; 
    }
    .schedule-item:last-child { border-bottom: none; }
    .schedule-item .label { 
      font-weight: 500; 
      color: #4a5568; 
      font-size: 0.9rem; 
    }
    .schedule-item .value { 
      font-weight: 600; 
      color: #2d3748; 
      font-size: 0.9rem; 
    }
    
    .reminder-list { margin-bottom: 8px; }
    .reminder-label-item { display: flex; align-items: center; gap: 10px; font-size: 1rem; margin-bottom: 12px; padding: 8px 0 8px 6px; border-radius: 8px; transition: background 0.2s; cursor: pointer; background: #f7fafc; box-shadow: 0 1px 4px rgba(56,161,105,0.04); }
    .reminder-label-item:hover { background: #e6fffa; }
    .reminder-type-name { flex: 1; font-weight: 600; color: #22543d; }
    .reminder-status { font-size: 0.9rem; font-weight: 600; padding: 3px 12px; border-radius: 6px; background: #e2e8f0; color: #718096; margin-left: 6px; transition: all 0.2s; }
    .reminder-status.on { background: #38a169; color: #fff; }
    .reminder-status.off { background: #e53e3e; color: #fff; }
    input[type="checkbox"] { accent-color: #38a169; width: 20px; height: 20px; }
    .dialog-actions { margin-top: 20px; display: flex; gap: 12px; justify-content: flex-end; }
    .save-btn { background: linear-gradient(90deg, #38a169 0%, #48bb78 100%); color: #fff; font-weight: 700; border: none; border-radius: 10px; padding: 8px 22px; font-size: 1rem; box-shadow: 0 2px 8px rgba(56,161,105,0.12); transition: all 0.2s; }
    .save-btn:hover { background: linear-gradient(90deg, #2f855a 0%, #38a169 100%); }
    .cancel-btn { background: #e2e8f0; color: #2d3748; font-weight: 600; border: none; border-radius: 10px; padding: 8px 20px; font-size: 1rem; margin-left: 8px; transition: all 0.2s; }
    .cancel-btn:hover { background: #cbd5e0; }
    
    /* Responsive improvements */
    @media (max-width: 480px) { 
      .dialog-content { 
        min-width: 92vw; 
        max-height: 90vh;
        padding: 20px 16px 16px 16px; 
        margin: 20px;
        top: 50%;
        transform: translate(-50%, -50%);
      }
      .dialog-icon { font-size: 1.8rem; margin-bottom: 4px; }
      h2 { font-size: 1.1rem; margin-bottom: 4px; }
      .dialog-desc { font-size: 0.9rem; margin-bottom: 12px; }
      .default-schedule-info { padding: 10px; margin-bottom: 14px; }
      .schedule-header { font-size: 0.95rem; margin-bottom: 8px; }
      .schedule-item { padding: 3px 0; }
      .schedule-item .label, .schedule-item .value { font-size: 0.85rem; }
      .reminder-label-item { 
        font-size: 0.95rem; 
        margin-bottom: 10px; 
        padding: 6px 0 6px 4px; 
      }
      .reminder-status { font-size: 0.85rem; padding: 2px 10px; }
      .dialog-actions { margin-top: 16px; gap: 10px; }
      .save-btn, .cancel-btn { 
        padding: 7px 18px; 
        font-size: 0.95rem; 
        border-radius: 8px; 
      }
    }
    
    @media (max-height: 600px) {
      .dialog-content { 
        max-height: 95vh; 
        padding: 18px 24px 16px 24px; 
      }
      .dialog-icon { font-size: 1.6rem; margin-bottom: 4px; }
      h2 { font-size: 1.1rem; margin-bottom: 4px; }
      .dialog-desc { margin-bottom: 10px; }
      .default-schedule-info { padding: 10px; margin-bottom: 12px; }
      .schedule-header { margin-bottom: 8px; }
      .reminder-label-item { margin-bottom: 8px; padding: 6px 0 6px 4px; }
      .dialog-actions { margin-top: 16px; }
    }
  `]
})
export class CareReminderDialogComponent {
  @Input() schedules: CareReminderSchedule[] = []
  @Output() save = new EventEmitter<CareReminderSchedule[]>();
  @Output() close = new EventEmitter<void>();

  careTypes = CARE_TYPES;
  private state: { [careTypeId: number]: boolean } = {};

  ngOnInit() {
    const arr = this.schedules || [];
    
    // Nếu có schedules với thông tin lịch đầy đủ, sử dụng
    if (arr.length > 0 && arr[0].frequencyDays !== undefined) {
      for (const t of this.careTypes) {
        const found = arr.find(s => s.careTypeId === t.careTypeId);
        this.state[t.careTypeId] = found ? found.enabled : true;
      }
    } else {
      // Fallback: chỉ có enabled status
      for (const t of this.careTypes) {
        const found = arr.find(s => s.careTypeId === t.careTypeId);
        this.state[t.careTypeId] = found ? found.enabled : true;
      }
    }
  }

  isEnabled(careTypeId: number): boolean {
    return this.state[careTypeId];
  }

  toggleType(careTypeId: number, enabled: boolean) {
    this.state[careTypeId] = enabled;
  }

  getTomorrowDate(): string {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toLocaleDateString('vi-VN', { 
      day: '2-digit', 
      month: '2-digit', 
      year: 'numeric' 
    });
  }

  onSave() {
    // Lấy ngày mai
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const startDate = tomorrow.toISOString().slice(0, 10); // yyyy-MM-dd
    
    const result: CareReminderSchedule[] = this.careTypes.map(t => {
      const existingSchedule = this.schedules.find(s => s.careTypeId === t.careTypeId);
      const isEnabled = this.state[t.careTypeId]; // Chỉ bật những loại được chọn
      
      return {
        careTypeId: t.careTypeId,
        enabled: isEnabled, // Chỉ bật những loại được chọn
        // Sử dụng thông tin lịch từ schedules nếu có, nếu không thì dùng mặc định
        frequencyDays: existingSchedule?.frequencyDays || 1,
        reminderTime: existingSchedule?.reminderTime || '08:00',
        customMessage: existingSchedule?.customMessage || 'Đã tới giờ chăm sóc cây',
        startDate: existingSchedule?.startDate || startDate
      };
    });
    
    this.save.emit(result);
  }

  onClose() {
    this.close.emit();
  }
}
