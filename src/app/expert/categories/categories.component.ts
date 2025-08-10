import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-expert-categories',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="categories-page">
      <h2>Quản lý danh mục bài viết</h2>
      <!-- TODO: Hiển thị danh sách, thêm, sửa, xóa danh mục -->
      <div class="coming-soon">Tính năng đang phát triển...</div>
    </div>
  `,
  styleUrls: ['./categories.component.scss']
})
export class CategoriesComponent {}
