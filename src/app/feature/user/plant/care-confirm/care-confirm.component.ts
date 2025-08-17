import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-care-confirm',
  templateUrl: './care-confirm.component.html',
  styleUrls: ['./care-confirm.component.scss']
})
export class CareConfirmComponent implements OnInit {
  loading = true;
  success = false;
  error = '';

  constructor(private route: ActivatedRoute, private http: HttpClient, private router: Router) {}

  ngOnInit() {
    const userPlantId = this.route.snapshot.queryParamMap.get('userPlantId');
    const careTypeId = this.route.snapshot.queryParamMap.get('careTypeId');
    if (userPlantId && careTypeId) {
      this.http.post(`/api/plant-care/${userPlantId}/care-reminders/${careTypeId}/confirm`, {}).subscribe({
        next: () => {
          this.success = true;
          this.loading = false;
        },
        error: err => {
          this.error = err?.error?.message || 'Có lỗi xảy ra.';
          this.loading = false;
        }
      });
    } else {
      this.error = 'Thiếu thông tin xác nhận.';
      this.loading = false;
    }
  }

  goToGarden() {
    this.router.navigate(['/user/my-garden']);
  }
}
