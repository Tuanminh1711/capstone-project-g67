interface CareReminder {
  scheduleId: number;
  careTypeId: number;
  careTypeName: string;
  enabled: boolean;
  frequencyDays: number | null;
  reminderTime: string | null;
  customMessage: string | null;
  startDate: string | null;
  lastCareDate: string | null;
  nextCareDate: string | null;
  priority?: 'low' | 'medium' | 'high';
  userName?: string;
}

interface ReminderColumn {
  title: string;
  reminders: CareReminder[];
}

import { Component, OnInit, inject, OnDestroy, AfterViewInit, ChangeDetectorRef } from '@angular/core';
import { ActivatedRoute, Router, RouterModule, NavigationEnd } from '@angular/router';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { CookieService } from '../../../../auth/cookie.service';
import { CommonModule } from '@angular/common';
import { TopNavigatorComponent } from '../../../../shared/top-navigator';
import { ImageUrlService } from '../../../../shared/services/image-url.service';
import { Subscription, filter, switchMap } from 'rxjs';

@Component({
  selector: 'app-view-user-plant-detail',
  standalone: true,
  imports: [CommonModule, TopNavigatorComponent, RouterModule],
  templateUrl: './view-user-plant-detail.component.html',
  styleUrls: ['./view-user-plant-detail.component.scss']
})
export class ViewUserPlantDetailComponent implements OnInit, OnDestroy, AfterViewInit {
  careReminders: CareReminder[] = [];
  loadingCareReminders = false;
  careRemindersError = '';
  private http = inject(HttpClient);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private cdr = inject(ChangeDetectorRef);
  private cookieService = inject(CookieService);
  private imageUrlService = inject(ImageUrlService);

  userPlantId!: number;
  plant: any = null;
  loading = true;
  errorMsg = '';
  private navSub?: Subscription;
  private paramSub?: Subscription;

  reminderColumns: ReminderColumn[] = [
    { title: 'Next Up', reminders: [] },
    { title: 'In Progress', reminders: [] },
    { title: 'Needs Review', reminders: [] }
  ];

  ngOnInit() {
    // Subscribe to route params changes ngay từ đầu
    this.paramSub = this.route.params.pipe(
      switchMap(params => {
        const id = params['id'];
        if (id) {
          this.userPlantId = +id;
          return this.loadUserPlantDetailObservable();
        }
        throw new Error('Invalid ID');
      })
    ).subscribe({
      next: () => {
        this.cdr.detectChanges();
      },
      error: () => {
        this.cdr.detectChanges();
      }
    });
  }

  ngAfterViewInit() {
    // Đảm bảo view được cập nhật sau khi render
    this.cdr.detectChanges();
  }

  ngOnDestroy() {
    this.navSub?.unsubscribe();
    this.paramSub?.unsubscribe();
  }

  private loadUserPlantDetailObservable() {
    this.loading = true;
    this.errorMsg = '';
    this.plant = null;
    this.careReminders = [];
    this.careRemindersError = '';
    
    return this.http.get<any>(`/api/user-plants/user-plant-detail/${this.userPlantId}`).pipe(
      switchMap(res => {
        if (res && res.data) {
          this.plant = this.mapApiResponseToUserPlant(res.data);
          this.errorMsg = '';
        } else {
          this.errorMsg = 'Không tìm thấy thông tin cây trong vườn.';
        }
        this.loading = false;
        this.fetchCareReminders();
        return [res];
      })
    );
  }

  loadUserPlantDetail() {
    this.loading = true;
    this.errorMsg = '';
    this.plant = null;
    this.careReminders = [];
    this.careRemindersError = '';
    
    const idParam = this.route.snapshot.paramMap.get('id');
    if (!idParam) {
      this.errorMsg = 'ID cây không hợp lệ.';
      this.loading = false;
      return;
    }
    
    this.userPlantId = +idParam;

    this.http.get<any>(`/api/user-plants/user-plant-detail/${this.userPlantId}`).subscribe({
      next: (res) => {
        if (res && res.data) {
          this.plant = this.mapApiResponseToUserPlant(res.data);
          this.errorMsg = '';
        } else {
          this.errorMsg = 'Không tìm thấy thông tin cây trong vườn.';
        }
        this.loading = false;
        this.cdr.detectChanges();
        this.fetchCareReminders();
      },
      error: (err) => {
        if (err.status === 404) {
          this.errorMsg = 'Không tìm thấy thông tin cây trong vườn.';
        } else {
          this.errorMsg = 'Không thể tải chi tiết cây. Vui lòng thử lại.';
        }
        this.loading = false;
        this.cdr.detectChanges();
      }
    });
  }

  fetchCareReminders() {
    if (!this.userPlantId) return;
    this.loadingCareReminders = true;
    this.careRemindersError = '';
    const apiUrl = `/api/plant-care/${this.userPlantId}/care-reminders`;
    const token = this.cookieService.getAuthToken();
    const headers = token ? new HttpHeaders({ 'Authorization': `Bearer ${token}` }) : undefined;
    this.http.get<any>(apiUrl, { headers }).subscribe({
      next: (res: any) => {
        let arr: any[] = [];
        if (Array.isArray(res)) {
          arr = res;
        } else if (res && Array.isArray(res.data)) {
          arr = res.data;
        }
        this.careReminders = arr;
        this.careRemindersError = arr.length === 0 ? 'Không có lịch nhắc nhở.' : '';
        this.loadingCareReminders = false;
        this.cdr.detectChanges();
        this.updateReminderColumns();
      },
      error: (err: any) => {
        this.careReminders = [];
        this.careRemindersError = 'Không thể tải lịch nhắc nhở.';
        this.loadingCareReminders = false;
        this.cdr.detectChanges();
      }
    });
  }

  updateReminderColumns() {
    // Phân loại theo enabled, frequencyDays, hoặc custom logic
    this.reminderColumns[0].reminders = this.careReminders.filter(r => r.enabled && (!r.frequencyDays || r.frequencyDays <= 3));
    this.reminderColumns[1].reminders = this.careReminders.filter(r => r.enabled && r.frequencyDays && r.frequencyDays > 3);
    this.reminderColumns[2].reminders = this.careReminders.filter(r => !r.enabled);
    // Gán priority cho mỗi reminder (demo)
    for (const col of this.reminderColumns) {
      for (const r of col.reminders) {
        if (!r.priority) {
          if (!r.enabled) r.priority = 'low';
          else if (r.frequencyDays && r.frequencyDays <= 3) r.priority = 'high';
          else r.priority = 'medium';
        }
        if (!r.userName) r.userName = 'Bạn';
      }
    }
  }

  mapApiResponseToUserPlant(apiData: any) {
    return {
      userPlantId: apiData.userPlantId,
      nickname: apiData.nickname || apiData.commonName || '',
      imageUrls: apiData.imageUrls || apiData.images?.map((img: any) => img.imageUrl) || [],
      plantingDate: apiData.plantingDate || '',
      locationInHouse: apiData.locationInHouse || '',
      reminderEnabled: apiData.reminderEnabled ?? false,
      images: apiData.images || [],
    };
  }

  goBack() {
    this.router.navigate(['/user/my-garden']);
  }

  formatDate(dateString: string): string {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString('vi-VN');
  }

  getImageUrl(imageUrl: string): string {
    console.log('🖼️ [ViewUserPlantDetail] Processing image URL:', imageUrl);
    const processedUrl = this.imageUrlService.getImageUrl(imageUrl);
    console.log('🖼️ [ViewUserPlantDetail] Processed URL:', processedUrl);
    return processedUrl;
  }

  onImageError(event: any) {
    // Sử dụng ImageUrlService để xử lý lỗi hình ảnh
    this.imageUrlService.onImageError(event);
  }
}
