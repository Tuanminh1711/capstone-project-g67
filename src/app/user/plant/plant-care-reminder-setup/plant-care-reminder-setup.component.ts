
import { environment } from 'environments/environment';
import { Component, ChangeDetectorRef } from '@angular/core';
import { FormArray, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { HttpClient, HttpHeaders } from '@angular/common/http';

import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';
import { ToastService } from '../../../shared/toast/toast.service';
import { TopNavigatorComponent } from '../../../shared/top-navigator/top-navigator.component';



@Component({
  selector: 'app-plant-care-reminder-setup',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, HttpClientModule, TopNavigatorComponent],
  templateUrl: './plant-care-reminder-setup.component.html',
  styleUrls: ['./plant-care-reminder-setup.component.scss']
})
export class PlantCareReminderSetupComponent {
  // Trả về mảng FormGroup cho template, tránh lỗi AbstractControl
  get scheduleFormGroups(): FormGroup[] {
    return this.schedules.controls as FormGroup[];
  }
  // Trả về schedule của loại đang chọn (nếu có), null nếu chưa setup
  getScheduleByType(typeId: number): FormGroup | null {
    const found = this.schedules.controls.find((s: any) => s.get('careTypeId')?.value === typeId);
    return found ? (found as FormGroup) : null;
  }
  userPlantId: string | null = null;
  loading = false;

  careTypes = [
    { id: 1, name: 'Tưới nước', icon: 'fas fa-tint' },
    { id: 2, name: 'Bón phân', icon: 'fas fa-leaf' },
    { id: 3, name: 'Cắt tỉa', icon: 'fas fa-cut' },
    { id: 4, name: 'Phun thuốc', icon: 'fas fa-spray-can' }
  ];
  // Chọn loại chăm sóc từ sidebar
  selectCareType(typeId: number) {
    this.selectedCareTypeId = typeId;
    
    // Nếu chọn 1 loại cụ thể mà chưa có schedule cho loại đó, tạo mới
    if (typeId !== 0 && !this.hasSchedule(typeId)) {
      this.addSchedule(typeId, true);
    }
  }

  // Kiểm tra loại đã có lịch chưa
  hasSchedule(typeId: number): boolean {
    return this.schedules.controls.some((s: any) => s.get('careTypeId')?.value === typeId);
  }

  // Lưu từng lịch nhắc riêng
  saveSchedule(i: number) {
    const schedule = this.schedules.at(i);
    if (schedule.invalid || !this.userPlantId) return;
    
    this.loading = true;
    const s = schedule.value;
    const startDateObj = s.startDate ? new Date(s.startDate).toISOString() : null;
    
    // Tạo payload với format mà backend mong đợi
    const payload = {
      schedules: [{
        careTypeId: s.careTypeId,
        enabled: s.enabled ?? true,
        frequencyDays: s.frequencyDays,
        reminderTime: s.reminderTime,
        customMessage: s.customMessage,
        startDate: startDateObj
      }]
    };
    
    const getCookie = (name: string) => {
      const value = `; ${document.cookie}`;
      const parts = value.split(`; ${name}=`);
      if (parts.length === 2) return parts.pop()?.split(';').shift();
      return '';
    };
    
    const token = getCookie('auth_token');
    const options: any = {
      responseType: 'text' as 'text',
      headers: token ? { Authorization: `Bearer ${token}` } : {}
    };
    
    this.http.post(
      `${environment.apiUrl}/plant-care/${this.userPlantId}/care-reminders`,
      payload,
      options
    ).subscribe({
      next: (res: any) => {
        this.toast.success(typeof res === 'string' ? res : 'Đã lưu lịch nhắc nhở thành công!');
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: err => {
        console.error('Save schedule error:', err);
        console.error('Request URL:', `${environment.apiUrl}/plant-care/${this.userPlantId}/care-reminders`);
        console.error('Payload:', payload);
        console.error('UserPlantId:', this.userPlantId);
        
        if (err.status === 404) {
          this.toast.error('Không tìm thấy endpoint API. Vui lòng kiểm tra backend.');
        } else if (err.status === 401 || err.status === 403) {
          this.toast.error('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.');
        } else if (err.error?.message) {
          this.toast.error(`Lỗi: ${err.error.message}`);
        } else {
          this.toast.error(`Có lỗi xảy ra khi lưu. Status: ${err.status}`);
        }
        this.loading = false;
        this.cdr.detectChanges();
      }
    });
  }

  // Mở tất cả form (chọn tất cả loại)
  openAllSchedules() {
    this.selectedCareTypeId = 0;
  }

  form: FormGroup;
  newCareTypeId: number | null = null;
  selectedCareTypeId: number = 0; // 0 = hiện tất cả

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private http: HttpClient,
    private router: Router,
    private toast: ToastService,
    private cdr: ChangeDetectorRef
  ) {
    this.form = this.fb.group({
      schedules: this.fb.array([]),
      newCareTypeId: [null]
    });
    // Mặc định hiện tất cả
    this.selectedCareTypeId = 0;
  }
  // Kiểm tra đã setup lịch cho loại đang chọn chưa
  hasSetupForSelectedType(): boolean {
    return this.schedules.controls.some((s: any) => s.get('careTypeId')?.value === this.selectedCareTypeId);
  }

  // Kiểm tra loại chăm sóc đã setup chưa (dùng cho sidebar)
  isTypeSetup(typeId: number): boolean {
    return this.schedules.controls.some((s: any) => s.get('careTypeId')?.value === typeId);
  }

  openGuide() {
    this.router.navigate(['/huong-dan-nhac-nho']);
  }

  ngOnInit() {
    this.userPlantId = this.route.snapshot.paramMap.get('userPlantId');
    // Load lịch cũ từ backend nếu có
    if (this.userPlantId) {
      this.loading = true;
      this.http.get<any[]>(`${environment.apiUrl}/plant-care/${this.userPlantId}/care-reminders`).subscribe({
        next: (data) => {
          this.schedules.clear();
          if (Array.isArray(data) && data.length > 0) {
            data.forEach(reminder => {
              let startDateStr = new Date().toISOString().slice(0,10);
              if (reminder.startDate) {
                if (typeof reminder.startDate === 'string') {
                  // Nếu là string, slice lấy yyyy-mm-dd
                  startDateStr = reminder.startDate.slice(0,10);
                } else if (reminder.startDate instanceof Date) {
                  // Nếu là Date object
                  startDateStr = reminder.startDate.toISOString().slice(0,10);
                } else {
                  // Nếu là số timestamp
                  try {
                    startDateStr = new Date(reminder.startDate).toISOString().slice(0,10);
                  } catch {}
                }
              }
              this.schedules.push(this.fb.group({
                careTypeId: [reminder.careTypeId, Validators.required],
                enabled: [reminder.enabled ?? true],
                frequencyDays: [reminder.frequencyDays ?? 1, [Validators.required, Validators.min(1)]],
                reminderTime: [reminder.reminderTime ?? '08:00', Validators.required],
                customMessage: [reminder.customMessage ?? 'Đã tới giờ chăm sóc cây', [Validators.maxLength(100), this.customMessageValidator]],
                startDate: [startDateStr, Validators.required]
              }));
            });
            // Nếu đã có setup rồi, mặc định hiện tất cả
            this.selectedCareTypeId = 0;
          } else {
            // Chưa có setup gì cả, tạo tất cả loại và hiện tất cả
            this.enableAllRemindersDefaultTomorrow8h();
            this.selectedCareTypeId = 0;
          }
          this.loading = false;
        },
        error: () => {
          this.loading = false;
          // Nếu không có lịch thì khởi tạo mặc định cho tất cả loại
          if (this.schedules.length === 0) {
            this.enableAllRemindersDefaultTomorrow8h();
            this.selectedCareTypeId = 0;
          }
        }
      });
    } else {
      // Nếu không có userPlantId thì khởi tạo mặc định cho tất cả loại
      if (this.schedules.length === 0) {
        this.enableAllRemindersDefaultTomorrow8h();
        this.selectedCareTypeId = 0;
      }
    }
  }

  get hasWaterReminder(): boolean {
    return this.schedules.controls.some(s => s.get('careTypeId')?.value === 1);
  }
  get hasFertilizerReminder(): boolean {
    return this.schedules.controls.some(s => s.get('careTypeId')?.value === 2);
  }
  get hasPruneReminder(): boolean {
    return this.schedules.controls.some(s => s.get('careTypeId')?.value === 3);
  }
  get hasSprayReminder(): boolean {
    return this.schedules.controls.some(s => s.get('careTypeId')?.value === 4);
  }

  get schedules() {
    return this.form.get('schedules') as FormArray;
  }

  addSchedule(careTypeId?: number, useTomorrow8h?: boolean) {
    const typeId = careTypeId || 1;
    // Không cho thêm lịch trùng loại
    if (this.schedules.controls.some(s => s.get('careTypeId')?.value === typeId)) {
      this.toast.error('Bạn đã có lịch cho loại chăm sóc này!');
      return;
    }
    let startDate = new Date();
    let reminderTime = '08:00';
    if (useTomorrow8h) {
      startDate = new Date();
      startDate.setDate(startDate.getDate() + 1);
      reminderTime = '08:00';
    }
    // Validate ngày bắt đầu không quá khứ
    const todayStr = new Date().toISOString().slice(0,10);
    const startDateStr = startDate.toISOString().slice(0,10);
    if (startDateStr < todayStr) {
      this.toast.error('Ngày bắt đầu không được nhỏ hơn hôm nay!');
      return;
    }
    // Xác thực customMessage: chỉ cho chữ, số, dấu câu cơ bản
    const defaultMsg = 'Đã tới giờ chăm sóc cây';
    this.schedules.push(this.fb.group({
      careTypeId: [typeId, Validators.required],
      enabled: [true],
      frequencyDays: [1, [Validators.required, Validators.min(1)]],
      reminderTime: [reminderTime, Validators.required],
      customMessage: [defaultMsg, [Validators.maxLength(100), this.customMessageValidator]],
      startDate: [startDateStr, Validators.required]
    }));
    this.form.get('newCareTypeId')?.setValue(null);
  }

  customMessageValidator(control: any) {
    const value = control.value as string;
    if (!value) return null;
    // Chỉ cho chữ, số, dấu câu cơ bản
    const regex = /^[a-zA-Z0-9À-ỹ .,!?()\-]+$/u;
    return regex.test(value) ? null : { invalidChars: true };
  }
  // Hàm chỉnh sửa lịch
  editSchedule(i: number, changes: Partial<{ frequencyDays: number; reminderTime: string; customMessage: string; startDate: string; enabled: boolean; }>) {
    const group = this.schedules.at(i) as FormGroup;
    Object.keys(changes).forEach(key => {
      if (group.get(key)) {
        group.get(key)?.setValue((changes as any)[key]);
      }
    });
  }

  // Hàm bật tất cả nhắc nhở với trạng thái mặc định 8h sáng ngày hôm sau
  enableAllRemindersDefaultTomorrow8h() {
    this.schedules.clear();
    // Tạo schedule cho tất cả loại chăm sóc
    for (const type of this.careTypes) {
      this.addSchedule(type.id, true);
    }
    // Hiện tất cả
    this.selectedCareTypeId = 0;
  }

  getCareTypeName(id: number): string {
    const found = this.careTypes.find(t => t.id === id);
    return found ? found.name : 'Lịch nhắc';
  }

  getCareTypeIcon(id: number): string {
    const found = this.careTypes.find(t => t.id === id);
    return found ? found.icon : 'fas fa-bell';
  }

  removeSchedule(i: number) {
    this.schedules.removeAt(i);
  }

  trackBySchedule(index: number, control: import('@angular/forms').AbstractControl) {
    return control.get('careTypeId')?.value;
  }

 submit() {
  if (this.form.invalid || !this.userPlantId) return;
  this.loading = true;

  // Chỉ chuyển startDate sang ISO, giữ nguyên reminderTime là string
  const raw = this.form.value;
  const schedules = (raw.schedules || []).map((s: any) => {
    let startDateObj = null;
    if (s.startDate) {
      startDateObj = new Date(s.startDate).toISOString();
    }
    return {
      careTypeId: s.careTypeId,
      enabled: s.enabled ?? true,
      frequencyDays: s.frequencyDays,
      reminderTime: s.reminderTime, // giữ nguyên string '08:00'
      customMessage: s.customMessage,
      startDate: startDateObj
    };
  });

  const getCookie = (name: string) => {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return parts.pop()?.split(';').shift();
    return '';
  };
  const token = getCookie('auth_token');
  const options: any = {
    responseType: 'text' as 'text',
    headers: token ? { Authorization: `Bearer ${token}` } : {}
  };
  this.http.post(
    `${environment.apiUrl}/plant-care/${this.userPlantId}/care-reminders`,
    { schedules },
    options
  ).subscribe({
    next: (res: any) => {
      this.toast.success(typeof res === 'string' ? res : 'Đã lưu lịch nhắc nhở thành công!');
      setTimeout(() => this.router.navigate(['/user/my-garden']), 1200);
    },
    error: err => {
      console.error('Submit error:', err);
      if (err.status === 403) {
        this.toast.error('Bạn không có quyền thực hiện thao tác này!');
      } else if (err.status === 401) {
        this.toast.error('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.');
      } else {
        const msg = typeof err?.error === 'string' ? err.error : (err?.error?.message || 'Có lỗi xảy ra khi lưu.');
        this.toast.error(msg);
      }
      this.loading = false;
      this.cdr.detectChanges();
    }
  });
}

}
