import { Component, Inject, Input, Output, EventEmitter } from '@angular/core';
import { CARE_TYPES, CareReminderSchedule } from './care-reminder.service';

@Component({
  selector: 'app-care-reminder-dialog',
  template: `
    <div class="dialog-backdrop" (click)="onClose()"></div>
    <div class="dialog-content">
      <div class="dialog-icon">🔔</div>
      <h2>Tuỳ chỉnh nhắc nhở từng loại</h2>
      <div class="dialog-desc">Bật/tắt nhắc nhở cho từng loại chăm sóc cây bên dưới:</div>
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
    .dialog-content { position: fixed; top:50%; left:50%; transform:translate(-50%,-50%); background:white; padding:38px 32px 30px 32px; border-radius:18px; z-index:1001; min-width:340px; box-shadow:0 8px 32px rgba(56,161,105,0.18); display: flex; flex-direction: column; align-items: stretch; }
    .dialog-icon { font-size:2.5rem; text-align:center; margin-bottom: 8px; }
    h2 { font-size: 1.3rem; font-weight: 700; color: #38a169; margin-bottom: 8px; text-align: center; }
    .dialog-desc { color: #4a5568; font-size: 1rem; text-align: center; margin-bottom: 18px; }
    .reminder-list { margin-bottom: 10px; }
    .reminder-label-item { display: flex; align-items: center; gap: 12px; font-size: 1.08rem; margin-bottom: 16px; padding: 10px 0 10px 6px; border-radius: 10px; transition: background 0.2s; cursor: pointer; background: #f7fafc; box-shadow: 0 1px 4px rgba(56,161,105,0.04); }
    .reminder-label-item:hover { background: #e6fffa; }
    .reminder-type-name { flex: 1; font-weight: 600; color: #22543d; }
    .reminder-status { font-size: 0.98rem; font-weight: 600; padding: 4px 14px; border-radius: 8px; background: #e2e8f0; color: #718096; margin-left: 8px; transition: all 0.2s; }
    .reminder-status.on { background: #38a169; color: #fff; }
    .reminder-status.off { background: #e53e3e; color: #fff; }
    input[type="checkbox"] { accent-color: #38a169; width: 22px; height: 22px; }
    .dialog-actions { margin-top: 28px; display: flex; gap: 16px; justify-content: flex-end; }
    .save-btn { background: linear-gradient(90deg, #38a169 0%, #48bb78 100%); color: #fff; font-weight: 700; border: none; border-radius: 12px; padding: 10px 26px; font-size: 1.05rem; box-shadow: 0 2px 8px rgba(56,161,105,0.12); transition: all 0.2s; }
    .save-btn:hover { background: linear-gradient(90deg, #2f855a 0%, #38a169 100%); }
    .cancel-btn { background: #e2e8f0; color: #2d3748; font-weight: 600; border: none; border-radius: 12px; padding: 10px 22px; font-size: 1.05rem; margin-left: 8px; transition: all 0.2s; }
    .cancel-btn:hover { background: #cbd5e0; }
    @media (max-width: 480px) { .dialog-content { min-width: 90vw; padding: 18px 4vw 18px 4vw; } }
  `]
})
export class CareReminderDialogComponent {
  @Input() schedules: CareReminderSchedule[] = [];
  @Output() save = new EventEmitter<CareReminderSchedule[]>();
  @Output() close = new EventEmitter<void>();

  careTypes = CARE_TYPES;
  private state: { [careTypeId: number]: boolean } = {};

  ngOnInit() {
    const arr = this.schedules || [];
    for (const t of this.careTypes) {
      const found = arr.find(s => s.careTypeId === t.careTypeId);
      this.state[t.careTypeId] = found ? found.enabled : true;
    }
  }

  isEnabled(careTypeId: number): boolean {
    return this.state[careTypeId];
  }

  toggleType(careTypeId: number, enabled: boolean) {
    this.state[careTypeId] = enabled;
  }

  onSave() {
    const result: CareReminderSchedule[] = this.careTypes.map(t => ({
      careTypeId: t.careTypeId,
      enabled: this.state[t.careTypeId]
    }));
    this.save.emit(result);
  }

  onClose() {
    this.close.emit();
  }
}
