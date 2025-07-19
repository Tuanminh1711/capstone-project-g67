import { Component, OnInit, inject, OnDestroy, AfterViewInit, ChangeDetectorRef } from '@angular/core';
import { ActivatedRoute, Router, RouterModule, NavigationEnd } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { TopNavigatorComponent } from '../../../shared/top-navigator';
import { Subscription, filter, switchMap } from 'rxjs';

@Component({
  selector: 'app-view-user-plant-detail',
  standalone: true,
  imports: [CommonModule, TopNavigatorComponent, RouterModule],
  templateUrl: './view-user-plant-detail.component.html',
  styleUrls: ['./view-user-plant-detail.component.scss']
})
export class ViewUserPlantDetailComponent implements OnInit, OnDestroy, AfterViewInit {
  private http = inject(HttpClient);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private cdr = inject(ChangeDetectorRef);

  userPlantId!: number;
  plant: any = null;
  loading = true;
  errorMsg = '';
  private navSub?: Subscription;
  private paramSub?: Subscription;

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
    
    return this.http.get<any>(`/api/user-plants/user-plant-detail/${this.userPlantId}`).pipe(
      switchMap(res => {
        if (res && res.data) {
          this.plant = this.mapApiResponseToUserPlant(res.data);
          this.errorMsg = '';
        } else {
          this.errorMsg = 'Không tìm thấy thông tin cây trong vườn.';
        }
        this.loading = false;
        return [res];
      })
    );
  }

  loadUserPlantDetail() {
    this.loading = true;
    this.errorMsg = '';
    this.plant = null;
    
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

  onImageError(event: any) {
    // Thay thế ảnh lỗi bằng placeholder
    event.target.src = 'assets/image/placeholder-plant.png';
    event.target.style.opacity = '0.6';
  }
}
