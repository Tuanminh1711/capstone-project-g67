import { Component } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { CommonModule, NgIf } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-admin-edit-plant',
  template: `
    <div class="edit-plant-container">
      <h2>Sửa thông tin cây</h2>
      <form *ngIf="plant" (ngSubmit)="onSubmit()">
        <label>Tên thường gọi:<input [(ngModel)]="plant.commonName" name="commonName" required /></label><br />
        <label>Tên khoa học:<input [(ngModel)]="plant.scientificName" name="scientificName" /></label><br />
        <label>Danh mục:<input [(ngModel)]="plant.categoryName" name="categoryName" /></label><br />
        <label>Mô tả:<textarea [(ngModel)]="plant.description" name="description"></textarea></label><br />
        <label>Độ khó:<input [(ngModel)]="plant.careDifficulty" name="careDifficulty" /></label><br />
        <label>Ánh sáng:<input [(ngModel)]="plant.lightRequirement" name="lightRequirement" /></label><br />
        <label>Nước:<input [(ngModel)]="plant.waterRequirement" name="waterRequirement" /></label><br />
        <label>Vị trí:<input [(ngModel)]="plant.suitableLocation" name="suitableLocation" /></label><br />
        <label>Bệnh thường gặp:<input [(ngModel)]="plant.commonDiseases" name="commonDiseases" /></label><br />
        <label>Trạng thái:<input [(ngModel)]="plant.status" name="status" /></label><br />
        <button type="submit">Lưu</button>
        <button type="button" (click)="goBack()">Hủy</button>
      </form>
      <div *ngIf="errorMsg" class="error-bar">{{ errorMsg }}</div>
      <div *ngIf="successMsg" class="success-bar">{{ successMsg }}</div>
    </div>
  `,
  styles: [`.edit-plant-container{max-width:600px;margin:32px auto;background:#fff;border-radius:12px;box-shadow:0 2px 12px #b2dfdb44;padding:32px 24px 24px;}`],
  standalone: true,
  imports: [CommonModule, FormsModule, NgIf]
})
export class AdminEditPlantComponent {
  plant: any = null;
  errorMsg = '';
  successMsg = '';

  constructor(private route: ActivatedRoute, private http: HttpClient, private router: Router) {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.http.get(`/api/plants/${id}`).subscribe({
        next: (data: any) => this.plant = data,
        error: () => this.errorMsg = 'Không tìm thấy cây.'
      });
    }
  }

  onSubmit() {
    this.http.put(`/api/plants/${this.plant.id}`, this.plant).subscribe({
      next: () => {
        this.successMsg = 'Cập nhật thành công!';
        setTimeout(() => this.router.navigate(['/admin/plants']), 1000);
      },
      error: () => this.errorMsg = 'Cập nhật thất bại!'
    });
  }

  goBack() {
    this.router.navigate(['/admin/plants']);
  }
}
