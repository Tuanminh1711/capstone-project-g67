
import { environment } from 'environments/environment';
import { Component, ChangeDetectorRef } from '@angular/core';
import { FormArray, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { HttpClient, HttpHeaders } from '@angular/common/http';

import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatSelectModule } from '@angular/material/select';
import { MatIconModule } from '@angular/material/icon';
import { HttpClientModule } from '@angular/common/http';
import { ToastService } from '../../../../shared/toast/toast.service';
import { TopNavigatorComponent } from '../../../../shared/top-navigator/top-navigator.component';



@Component({
  selector: 'app-plant-care-reminder-setup',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule, HttpClientModule, TopNavigatorComponent, MatButtonModule, MatSelectModule, MatIconModule],
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
    
    if (typeId !== 0) {
      // Nếu chọn 1 loại cụ thể
      if (!this.hasSchedule(typeId)) {
        // Nếu chưa có schedule cho loại đó, tạo mới
        this.addSchedule(typeId, true);
      }
      
      // Hiển thị thông báo
      const careTypeName = this.getCareTypeName(typeId);
      this.toast.success(`Đã chọn ${careTypeName}. Bạn có thể bật/tắt nhắc nhở cho từng loại riêng biệt.`);
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
    
    // Tạo payload với tất cả loại chăm sóc
    // Loại đang được setup sẽ có enabled: true, các loại khác sẽ có enabled: false
    const allSchedules = this.careTypes.map(type => {
      if (type.id === s.careTypeId) {
        // Loại đang được setup
        return {
          careTypeId: type.id,
          enabled: true,
          frequencyDays: s.frequencyDays,
          reminderTime: s.reminderTime,
          customMessage: s.customMessage || 'Đã tới giờ chăm sóc cây',
          startDate: startDateObj
        };
      } else {
        // Các loại khác - tắt nhắc nhở
        return {
          careTypeId: type.id,
          enabled: false,
          frequencyDays: 1,
          reminderTime: '08:00',
          customMessage: 'Đã tới giờ chăm sóc cây',
          startDate: new Date().toISOString()
        };
      }
    });

    // Gửi tất cả lên backend để đảm bảo chỉ có 1 loại được bật
  this.http.post(`${environment.apiUrl}/plant-care/${this.userPlantId}/care-reminders`, { schedules: allSchedules }, { responseType: 'text' as 'json' }).subscribe({
      next: (res: any) => {
        this.toast.success('Đã lưu lịch nhắc nhở thành công! Các loại chăm sóc khác đã được tắt nhắc nhở.');
        this.loading = false;
        // Sử dụng setTimeout để tránh ExpressionChangedAfterItHasBeenCheckedError
        setTimeout(() => {
          this.cdr.detectChanges();
          // Cập nhật trạng thái enabled trong form để phản ánh thay đổi
          this.updateScheduleStates(s.careTypeId);
        }, 0);
      },
      error: err => {
        this.toast.error('Có lỗi xảy ra khi lưu. Vui lòng thử lại.');
        this.loading = false;
        console.error('Error saving schedule:', err);
      }
    });
  }

  // Cập nhật trạng thái enabled trong form sau khi lưu
  private updateScheduleStates(activeCareTypeId: number) {
    this.schedules.controls.forEach((control: any) => {
      const careTypeId = control.get('careTypeId')?.value;
      if (careTypeId === activeCareTypeId) {
        control.get('enabled')?.setValue(true);
      } else {
        control.get('enabled')?.setValue(false);
      }
    });
  }

  // Xử lý khi toggle bật/tắt nhắc nhở
  onToggleReminder(index: number) {
    const schedule = this.schedules.at(index);
    const isEnabled = schedule.get('enabled')?.value;
    
    // Hiển thị thông báo
    const careTypeName = this.getCareTypeName(schedule.get('careTypeId')?.value);
    if (isEnabled) {
      this.toast.success(`Đã bật nhắc nhở cho ${careTypeName}.`);
    } else {
      this.toast.info(`Đã tắt nhắc nhở cho ${careTypeName}.`);
    }
    
    // Cập nhật thông tin về số loại đang được bật
    const enabledCount = this.getEnabledCount();
    if (enabledCount > 1) {
      this.toast.info(`Hiện tại có ${enabledCount} loại chăm sóc đang được bật. Bạn có thể cập nhật tất cả cùng lúc.`);
    }
  }

  // Đếm số loại đang được bật
  getEnabledCount(): number {
    return this.schedules.controls.filter((control: any) => control.get('enabled')?.value).length;
  }

  // Kiểm tra xem có thay đổi gì không
  hasAnyChanges(): boolean {
    // So sánh với dữ liệu gốc (có thể lưu trữ trong một biến riêng)
    // Hoặc đơn giản là luôn return true để cho phép cập nhật
    return true;
  }

  // Cập nhật tất cả schedules cùng lúc
  updateAllSchedules() {
    if (this.form.invalid || !this.userPlantId) return;
    this.loading = true;

    // Gửi đủ 4 loại, loại nào có trên form thì enabled=true, không có thì enabled=false
    const formCareTypeIds = this.schedules.controls.map((c: any) => c.get('careTypeId')?.value);
    const allSchedules = this.careTypes.map(type => {
      const control = this.schedules.controls.find((c: any) => c.get('careTypeId')?.value === type.id);
      if (control) {
        return {
          careTypeId: type.id,
          enabled: true,
          frequencyDays: control.get('frequencyDays')?.value,
          reminderTime: control.get('reminderTime')?.value,
          customMessage: control.get('customMessage')?.value,
          startDate: control.get('startDate')?.value ? new Date(control.get('startDate')?.value).toISOString() : null
        };
      } else {
        return {
          careTypeId: type.id,
          enabled: false,
          frequencyDays: 1,
          reminderTime: '08:00',
          customMessage: 'Đã tới giờ chăm sóc cây',
          startDate: new Date().toISOString()
        };
      }
    });

    // Gửi đúng các schedule user setup lên backend
    this.http.post(`${environment.apiUrl}/plant-care/${this.userPlantId}/care-reminders`, { schedules: allSchedules }, { responseType: 'text' as 'json' }).subscribe({
      next: (res: any) => {
        // Kiểm tra response format
        if (res && (res.success !== false)) {
          this.toast.success(`Đã cập nhật thành công!`);
          this.loading = false;
          setTimeout(() => {
            this.cdr.detectChanges();
          }, 0);
        } else {
          // Response có thể là error message
          const errorMsg = res?.message || res?.error || 'Có lỗi xảy ra khi cập nhật';
          this.toast.error(errorMsg);
          this.loading = false;
        }
      },
      error: err => {
        this.toast.error('Có lỗi xảy ra khi cập nhật. Vui lòng thử lại.');
        this.loading = false;
        console.error('Error updating all schedules:', err);
      }
    });
  }

  // Mở tất cả form (chọn tất cả loại)
  openAllSchedules() {
    setTimeout(() => {
      this.selectedCareTypeId = 0;
      this.cdr.detectChanges(); // Đảm bảo UI được cập nhật
    }, 0);
    this.toast.info('Bạn có thể quản lý nhiều loại chăm sóc cùng lúc. Sử dụng nút "Cập nhật tất cả" để lưu thay đổi. Chỉ những loại có dữ liệu mới được bật nhắc nhở.');
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
                enabled: [reminder.enabled ?? false], // Mặc định false nếu không có
                frequencyDays: [reminder.frequencyDays ?? 1, [Validators.required, Validators.min(1)]],
                reminderTime: [reminder.reminderTime ?? '08:00', Validators.required],
                customMessage: [reminder.customMessage ?? 'Đã tới giờ chăm sóc cây', [Validators.maxLength(100), this.customMessageValidator]],
                startDate: [startDateStr, Validators.required]
              }));
            });
            // Nếu đã có setup rồi, mặc định hiện tất cả
            this.selectedCareTypeId = 0;
            // Kiểm tra xem có loại nào được bật không
            const hasEnabledType = this.schedules.controls.some((s: any) => s.get('enabled')?.value);
            if (!hasEnabledType) {
              // Nếu không có loại nào được bật, bật loại đầu tiên
              if (this.schedules.length > 0) {
                this.schedules.at(0).get('enabled')?.setValue(true);
                this.toast.info('Không có loại chăm sóc nào được bật. Đã tự động bật loại đầu tiên.');
              }
            }
          } else {
            // Chưa có setup gì cả, tạo tất cả loại và hiện tất cả
            this.enableAllRemindersDefaultTomorrow8h();
            this.selectedCareTypeId = 0;
          }
          this.loading = false;
          setTimeout(() => { this.cdr.detectChanges(); }, 0);
        },
        error: () => {
          this.loading = false;
          // Nếu không có lịch thì khởi tạo mặc định cho tất cả loại
          if (this.schedules.length === 0) {
            this.enableAllRemindersDefaultTomorrow8h();
            this.selectedCareTypeId = 0;
          }
          setTimeout(() => { this.cdr.detectChanges(); }, 0);
        }
      });
    } else {
      // Nếu không có userPlantId thì khởi tạo mặc định cho tất cả loại
      if (this.schedules.length === 0) {
        this.enableAllRemindersDefaultTomorrow8h();
        this.selectedCareTypeId = 0;
      }
      setTimeout(() => { this.cdr.detectChanges(); }, 0);
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
    
    // Lấy ngày mai
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const startDate = tomorrow.toISOString().slice(0, 10); // yyyy-MM-dd
    
    // Tạo schedule cho tất cả loại chăm sóc với thông tin mặc định đầy đủ
    // Mặc định chỉ bật loại đầu tiên (tưới nước), các loại khác tắt
    for (let i = 0; i < this.careTypes.length; i++) {
      const type = this.careTypes[i];
      const isEnabled = i === 0; // Chỉ loại đầu tiên (tưới nước) được bật
      
      this.schedules.push(this.fb.group({
        careTypeId: [type.id, Validators.required],
        enabled: [isEnabled],
        frequencyDays: [1, [Validators.required, Validators.min(1)]],
        reminderTime: ['08:00', Validators.required],
        customMessage: ['Đã tới giờ chăm sóc cây', [Validators.maxLength(100), this.customMessageValidator]],
        startDate: [startDate, Validators.required]
      }));
    }
    
    // Hiện tất cả
    this.selectedCareTypeId = 0;
    
    // Hiển thị thông báo
    this.toast.success('Đã thiết lập lịch nhắc nhở mặc định: 8h sáng, 1 ngày/lần, bắt đầu từ ngày mai! Chỉ loại tưới nước được bật, các loại khác đã tắt.');
  }

  getCareTypeName(id: number): string {
    const found = this.careTypes.find(t => t.id === id);
    return found ? found.name : 'Lịch nhắc';
  }

  getCareTypeIcon(id: number): string {
    const found = this.careTypes.find(t => t.id === id);
    return found ? found.icon : 'fas fa-bell';
  }

  // Xóa schedule theo index
  removeSchedule(index: number) {
    this.schedules.removeAt(index);
  }

  // Xóa schedule theo loại chăm sóc
  removeScheduleByType(careTypeId: number) {
    const index = this.schedules.controls.findIndex((control: any) => 
      control.get('careTypeId')?.value === careTypeId
    );
    if (index !== -1) {
      this.schedules.removeAt(index);
    }
  }

  trackBySchedule(index: number, control: import('@angular/forms').AbstractControl) {
    return control.get('careTypeId')?.value;
  }

  submit() {
    if (this.form.invalid || !this.userPlantId) return;
    this.loading = true;

    // Gửi đủ 4 loại, loại nào có trên form thì enabled=true, không có thì enabled=false
    const formCareTypeIds = this.schedules.controls.map((c: any) => c.get('careTypeId')?.value);
    const allSchedules = this.careTypes.map(type => {
      const control = this.schedules.controls.find((c: any) => c.get('careTypeId')?.value === type.id);
      if (control) {
        return {
          careTypeId: type.id,
          enabled: true,
          frequencyDays: control.get('frequencyDays')?.value,
          reminderTime: control.get('reminderTime')?.value,
          customMessage: control.get('customMessage')?.value,
          startDate: control.get('startDate')?.value ? new Date(control.get('startDate')?.value).toISOString() : null
        };
      } else {
        return {
          careTypeId: type.id,
          enabled: false,
          frequencyDays: 1,
          reminderTime: '08:00',
          customMessage: 'Đã tới giờ chăm sóc cây',
          startDate: new Date().toISOString()
        };
      }
    });

    // Gửi tất cả lên backend
    this.http.post(`${environment.apiUrl}/plant-care/${this.userPlantId}/care-reminders`, { schedules: allSchedules }).subscribe({
      next: (res: any) => {
        const enabledCount = this.getEnabledCount();
        this.toast.success(`Đã lưu thành công! ${enabledCount} loại chăm sóc đang được bật nhắc nhở.`);
        this.loading = false;
        // Sử dụng setTimeout để tránh ExpressionChangedAfterItHasBeenCheckedError
        setTimeout(() => {
          this.cdr.detectChanges();
        }, 0);
      },
      error: err => {
        this.toast.error('Có lỗi xảy ra khi lưu. Vui lòng thử lại.');
        this.loading = false;
        console.error('Error submitting form:', err);
      }
    });
  }

}
