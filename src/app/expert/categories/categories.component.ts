

import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ExpertService } from './categories.service';
import { ExpertLayoutComponent } from '../shared/expert-layout/expert-layout.component';

@Component({
  selector: 'app-categories',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, ExpertLayoutComponent],
  templateUrl: './categories.component.html',
  styleUrls: ['./categories.component.scss']
})
export class CategoriesComponent implements OnInit {
  categories: any[] = [];
  pageNo = 0;
  pageSize = 10;
  totalPages = 1;
  isLoading = false;
  error: string | null = null;

  categoryForm: FormGroup;
  editMode = false;
  editingCategoryId: number | null = null;

  constructor(private fb: FormBuilder, private expertService: ExpertService) {
    this.categoryForm = this.fb.group({
      name: ['', Validators.required],
      description: ['']
    });
  }

  ngOnInit(): void {
    this.loadCategories();
  }

  loadCategories(): void {
    this.isLoading = true;
    this.expertService.listCategories(this.pageNo, this.pageSize).subscribe({
      next: (res) => {
        this.categories = res.data || [];
        this.totalPages = Math.ceil((res.data?.length || 0) / this.pageSize);
        this.isLoading = false;
      },
      error: (err) => {
        this.error = 'Không thể tải danh sách chuyên mục.';
        this.isLoading = false;
      }
    });
  }

  submitCategory(): void {
    if (this.categoryForm.invalid) return;
    const data = this.categoryForm.value;
    this.isLoading = true;
    if (this.editMode && this.editingCategoryId) {
      this.expertService.updateCategory(this.editingCategoryId, data).subscribe({
        next: () => {
          this.resetForm();
          this.loadCategories();
        },
        error: () => {
          this.error = 'Cập nhật chuyên mục thất bại.';
          this.isLoading = false;
        }
      });
    } else {
      this.expertService.createCategory(data).subscribe({
        next: () => {
          this.resetForm();
          this.loadCategories();
        },
        error: () => {
          this.error = 'Tạo chuyên mục thất bại.';
          this.isLoading = false;
        }
      });
    }
  }

  editCategory(category: any): void {
    this.editMode = true;
    this.editingCategoryId = category.id;
    this.categoryForm.patchValue({
      name: category.name,
      description: category.description
    });
  }

  deleteCategory(categoryId: number): void {
    if (!confirm('Bạn có chắc muốn xóa chuyên mục này?')) return;
    this.isLoading = true;
    this.expertService.deleteCategory(categoryId).subscribe({
      next: () => {
        this.loadCategories();
      },
      error: () => {
        this.error = 'Xóa chuyên mục thất bại.';
        this.isLoading = false;
      }
    });
  }

  resetForm(): void {
    this.categoryForm.reset();
    this.editMode = false;
    this.editingCategoryId = null;
    this.error = null;
  }

  changePage(page: number): void {
    if (page < 0 || page >= this.totalPages) return;
    this.pageNo = page;
    this.loadCategories();
  }
}
