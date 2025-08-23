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
  successMessage = '';

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
      this.http.post(`/api/plant-care/${userPlantId}/care-reminders/${careTypeId}/confirm`, {}, { responseType: 'text' }).subscribe({
        next: (res: string) => {
          this.success = true;
          this.successMessage = res || 'Bạn đã xác nhận chăm sóc thành công cho cây của mình!';
          this.loading = false;
          this.toast.success(this.successMessage);
          this.cdr.detectChanges();
        },
        error: err => {
          this.error = (typeof err?.error === 'string' && err.error) || err?.message || 'Có lỗi xảy ra.';
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
