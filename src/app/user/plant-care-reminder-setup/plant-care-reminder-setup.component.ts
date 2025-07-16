import { Component, ChangeDetectorRef } from '@angular/core';
import { FormArray, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';

import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';
import { ToastService } from '../../shared/toast.service';
import { TopNavigatorComponent } from '../../shared/top-navigator/top-navigator.component';

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

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private http: HttpClient,
    private router: Router,
    private toast: ToastService,
    private cdr: ChangeDetectorRef
  ) {
    this.form = this.fb.group({
      schedules: this.fb.array([])
    });
  }

  ngOnInit() {
    this.userPlantId = this.route.snapshot.paramMap.get('userPlantId');
    if (this.schedules.length === 0) {
      this.addSchedule();
    }
  }

  get schedules() {
    return this.form.get('schedules') as FormArray;
  }

  addSchedule() {
    this.schedules.push(this.fb.group({
      careTypeId: [1, Validators.required],
      enabled: [true],
      frequencyDays: [1, [Validators.required, Validators.min(1)]],
      reminderTime: ['08:00', Validators.required],
      customMessage: ['', Validators.maxLength(100)],
      startDate: [new Date().toISOString().slice(0,10), Validators.required]
    }));
  }

  removeSchedule(i: number) {
    this.schedules.removeAt(i);
  }

  submit() {
    if (this.form.invalid || !this.userPlantId) return;
    this.loading = true;
    this.http.post(
      `http://localhost:8080/api/plant-care/${this.userPlantId}/care-reminders`,
      this.form.value,
      { responseType: 'text' as 'json' }
    ).subscribe({
      next: (res: any) => {
        // res là string nếu backend trả về text
        this.toast.success(typeof res === 'string' ? res : 'Đã lưu lịch nhắc nhở thành công!');
        setTimeout(() => this.router.navigate(['/user/my-garden']), 1200);
      },
      error: err => {
        if (err.status === 403) {
          this.toast.error('Bạn không có quyền thực hiện thao tác này!');
        } else {
          // Nếu backend trả về text lỗi
          const msg = typeof err?.error === 'string' ? err.error : (err?.error?.message || 'Có lỗi xảy ra khi lưu.');
          this.toast.error(msg);
        }
        this.loading = false;
        this.cdr.detectChanges();
      }
    });
  }
}
