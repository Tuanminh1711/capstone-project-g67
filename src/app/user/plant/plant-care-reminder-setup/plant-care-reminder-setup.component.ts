

import { environment } from 'environments/environment';
import { Component, ChangeDetectorRef } from '@angular/core';
import { FormArray, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { HttpClient, HttpHeaders } from '@angular/common/http';

import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatNativeDateModule } from '@angular/material/core';
import { ToastService } from '../../../shared/toast/toast.service';
import { TopNavigatorComponent } from '../../../shared/top-navigator/top-navigator.component';



@Component({
  selector: 'app-plant-care-reminder-setup',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, HttpClientModule, TopNavigatorComponent, MatDatepickerModule, MatFormFieldModule, MatInputModule, MatNativeDateModule],
  templateUrl: './plant-care-reminder-setup.component.html',
  styleUrls: ['./plant-care-reminder-setup.component.scss']
})
export class PlantCareReminderSetupComponent {
  userPlantId: string | null = null;
  loading = false;

  careTypes = [
    { id: 1, name: 'Tưới nước' },
    { id: 2, name: 'Bón phân' },
    { id: 3, name: 'Cắt tỉa' },
    { id: 4, name: 'Phun thuốc' }
  ];

  form: FormGroup;
  newCareTypeId: number | null = null;

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
  }

  openGuide() {
    this.router.navigate(['/huong-dan-nhac-nho']);
  }

  ngOnInit() {
    this.userPlantId = this.route.snapshot.paramMap.get('userPlantId');
    if (!this.userPlantId) return;
    this.loading = true;
    this.http.get<any[]>(`${environment.apiUrl}/plant-care/${this.userPlantId}/care-reminders`).subscribe({
      next: (data) => {
        this.schedules.clear();
        if (data && data.length > 0) {
          for (const s of data) {
            let startDateValue = s.startDate;
            this.schedules.push(this.fb.group({
              scheduleId: [s.scheduleId],
              careTypeId: [s.careTypeId, Validators.required],
              enabled: [s.enabled],
              frequencyDays: [s.frequencyDays, [Validators.required, Validators.min(1)]],
              reminderTime: [s.reminderTime, Validators.required],
              customMessage: [s.customMessage || '', Validators.maxLength(100)],
              startDate: [startDateValue, Validators.required]
            }));
          }
          this.loading = false;
          this.cdr.detectChanges();
        } else {
          // Nếu chưa setup nhắc nhở nào, chỉ hiển thị thông báo và 4 nút thêm từng loại
          this.loading = false;
          this.cdr.detectChanges();
        }
      },
      error: () => {
        this.loading = false;
        this.cdr.detectChanges();
      }
    });
  }

  // Không chuyển đổi format ngày, giữ nguyên giá trị trả về từ API

  get hasWaterReminder(): boolean {
    return this.schedules.controls.some(s => s.get('careTypeId')?.value === 1 && s.get('enabled')?.value === true);
  }
  get hasFertilizerReminder(): boolean {
    return this.schedules.controls.some(s => s.get('careTypeId')?.value === 2 && s.get('enabled')?.value === true);
  }
  get hasPruneReminder(): boolean {
    return this.schedules.controls.some(s => s.get('careTypeId')?.value === 3 && s.get('enabled')?.value === true);
  }
  get hasSprayReminder(): boolean {
    return this.schedules.controls.some(s => s.get('careTypeId')?.value === 4 && s.get('enabled')?.value === true);
  }

  get schedules() {
    return this.form.get('schedules') as FormArray;
  }

  addSchedule(careTypeId: number) {
    // Chỉ thêm loại được chọn, không bật tất cả
    let startDate = new Date();
  startDate.setDate(startDate.getDate() + 1); // Nếu không truyền startDate, mặc định là ngày mai
    let reminderTime = '08:00';
    this.schedules.push(this.fb.group({
      careTypeId: [careTypeId, Validators.required],
      enabled: [true],
      frequencyDays: [1, [Validators.required, Validators.min(1)]],
      reminderTime: [reminderTime, Validators.required],
      customMessage: ['Đã tới giờ chăm sóc cây', Validators.maxLength(100)],
      startDate: [startDate, Validators.required]
    }));
    this.form.get('newCareTypeId')?.setValue(null);
  }

  // Hàm này không còn dùng nữa, logic đã chuyển sang addSchedule từng loại riêng lẻ

  getCareTypeName(id: number): string {
    const found = this.careTypes.find(t => t.id === id);
    return found ? found.name : 'Lịch nhắc';
  }
  get enabledSchedules() {
    return this.schedules.controls.filter((s: any) => s.get('enabled')?.value);
  }

  removeSchedule(i: number): void {
    if (this.schedules && this.schedules.length > i) {
      this.schedules.removeAt(i);
    }
  }

  submit(): void {
    if (!this.form || this.form.invalid || !this.userPlantId) return;
    this.loading = true;
    // Prepare schedules for API
    const raw = this.form.value;
    const schedules = raw.schedules.map((s: any) => {
      let startDate = s.startDate;
      if (!startDate) {
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        startDate = tomorrow.toISOString().slice(0, 10);
      } else if (startDate instanceof Date) {
        startDate = startDate.toISOString().slice(0, 10);
      } else if (typeof startDate === 'string' && startDate.length > 10) {
        startDate = new Date(startDate).toISOString().slice(0, 10);
      }
      // Remove scheduleId if present
      const { scheduleId, ...rest } = s;
      return {
        ...rest,
        reminderTime: s.reminderTime,
        startDate
      };
    });
    // Auth token if needed
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
      error: (err: any) => {
        if (err.status === 403) {
          this.toast.error('Bạn không có quyền thực hiện thao tác này!');
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
