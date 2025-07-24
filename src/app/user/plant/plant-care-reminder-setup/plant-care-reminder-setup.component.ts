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
    if (this.schedules.length === 0) {
      this.addSchedule();
    }
  }

  get hasWaterReminder(): boolean {
    return this.schedules.controls.some(s => s.get('careTypeId')?.value === 1);
  }
  get hasFertilizerReminder(): boolean {
    return this.schedules.controls.some(s => s.get('careTypeId')?.value === 2);
  }
  get hasPestReminder(): boolean {
    return this.schedules.controls.some(s => s.get('careTypeId')?.value === 3);
  }

  get schedules() {
    return this.form.get('schedules') as FormArray;
  }

  addSchedule(careTypeId?: number) {
    const typeId = careTypeId || 1;
    this.schedules.push(this.fb.group({
      careTypeId: [typeId, Validators.required],
      enabled: [true],
      frequencyDays: [1, [Validators.required, Validators.min(1)]],
      reminderTime: ['08:00', Validators.required],
      customMessage: ['', Validators.maxLength(100)],
      startDate: [new Date().toISOString().slice(0,10), Validators.required]
    }));
    this.form.get('newCareTypeId')?.setValue(null);
  }

  getCareTypeName(id: number): string {
    const found = this.careTypes.find(t => t.id === id);
    return found ? found.name : 'Lịch nhắc';
  }

  removeSchedule(i: number) {
    this.schedules.removeAt(i);
  }

  submit() {
    if (this.form.invalid || !this.userPlantId) return;
    this.loading = true;
    const token = localStorage.getItem('token');
    const headers = token ? new HttpHeaders({ Authorization: `Bearer ${token}` }) : undefined;
    this.http.post(
      `${environment.apiUrl}/plant-care/${this.userPlantId}/care-reminders`,
      this.form.value,
      headers ? { headers } : undefined
    ).subscribe({
      next: (res: any) => {
        this.toast.success(typeof res === 'string' ? res : 'Đã lưu lịch nhắc nhở thành công!');
        setTimeout(() => this.router.navigate(['/user/my-garden']), 1200);
      },
      error: err => {
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
