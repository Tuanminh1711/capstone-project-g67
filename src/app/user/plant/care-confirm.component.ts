import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-care-confirm',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="care-confirm-container">
      <h2>Xác nhận chăm sóc cây</h2>
      <div *ngIf="loading">Đang xác nhận...</div>
      <div *ngIf="success" class="success">✅ Đã xác nhận chăm sóc thành công!</div>
      <div *ngIf="error" class="error">❌ Xác nhận thất bại: {{error}}</div>
      <button *ngIf="success" (click)="goToGarden()">Về vườn của tôi</button>
    </div>
  `,
  styles: [`
    .care-confirm-container { max-width: 400px; margin: 40px auto; padding: 32px; background: #fff; border-radius: 12px; box-shadow: 0 2px 12px rgba(0,0,0,0.08); text-align: center; }
    .success { color: #28a745; margin: 16px 0; }
    .error { color: #dc3545; margin: 16px 0; }
    button { margin-top: 20px; padding: 8px 20px; border: none; background: #0084ff; color: #fff; border-radius: 6px; cursor: pointer; }
    button:hover { background: #0056b3; }
  `]
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
