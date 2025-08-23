import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { ToastService } from '../../../../shared/toast/toast.service';
import { TopNavigatorComponent } from '../../../../shared/top-navigator/top-navigator.component';
import { FooterComponent } from '../../../../shared/footer/footer.component';

@Component({
  selector: 'app-care-confirm',
  templateUrl: './care-confirm.component.html',
  styleUrls: ['./care-confirm.component.scss'],
  standalone: true,
  imports: [TopNavigatorComponent, FooterComponent]
})
export class CareConfirmComponent implements OnInit {
  loading = true;
  success = false;
  error = '';

  constructor(
    private route: ActivatedRoute,
    private http: HttpClient,
    private router: Router,
    private toast: ToastService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit() {
    const userPlantId = this.route.snapshot.queryParamMap.get('userPlantId');
    const careTypeId = this.route.snapshot.queryParamMap.get('careTypeId');
    if (userPlantId && careTypeId) {
      this.http.post(`/api/plant-care/${userPlantId}/care-reminders/${careTypeId}/confirm`, {}).subscribe({
        next: () => {
          this.success = true;
          this.loading = false;
          this.toast.success('Xác nhận chăm sóc thành công!');
          this.cdr.detectChanges();
        },
        error: err => {
          this.error = err?.error?.message || 'Có lỗi xảy ra.';
          this.loading = false;
          this.toast.error('Xác nhận thất bại: ' + this.error);
          this.cdr.detectChanges();
        }
      });
    } else {
  this.error = 'Thiếu thông tin xác nhận.';
  this.loading = false;
  this.toast.error(this.error);
  this.cdr.detectChanges();
    }
  }

  goToGarden() {
    this.router.navigate(['/user/my-garden']);
  }
}
