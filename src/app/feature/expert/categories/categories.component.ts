

import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router, NavigationEnd, ActivatedRoute } from '@angular/router';
import { filter, takeUntil, switchMap } from 'rxjs/operators';
import { Subject, of } from 'rxjs';
import { ExpertService } from './categories.service';
import { ToastService } from '../../../shared/toast/toast.service';
// Define interfaces for type safety
interface Category {
  id: number;
  name: string;
  description: string;
}

interface ApiCategory {
  id: number;
  categoryName: string;
  categoryDescription: string;
}

interface ApiResponse {
  status: number;
  message: string;
  data: ApiCategory[];
}

@Component({
  selector: 'app-categories',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './categories.component.html',
  styleUrls: ['./categories.component.scss']
})
export class CategoriesComponent implements OnInit, OnDestroy {
  categories: Category[] = [];
  pageNo = 0;
  pageSize = 10;
  totalPages = 1;
  isLoading = false;
  error: string | null = null;

  categoryForm: FormGroup;
  editMode = false;
  editingCategoryId: number | null = null;
  
  private destroy$ = new Subject<void>();

  constructor(
    private fb: FormBuilder, 
    private expertService: ExpertService,
    private router: Router,
    private route: ActivatedRoute,
    private cdr: ChangeDetectorRef,
    private toastService: ToastService
  ) {
    this.categoryForm = this.fb.group({
      name: ['', Validators.required],
      description: ['']
    });
  }

  ngOnInit(): void {
    // Load categories immediately when component initializes
    this.loadCategories();
    
    // Listen for route changes to reload data when navigating to this component
    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd),
      takeUntil(this.destroy$)
    ).subscribe((event: NavigationEnd) => {
      // Only reload if we're navigating to the categories route
      if (event.url.includes('/expert/categories') || event.url.includes('/categories')) {
        // Check if we need to reload (only if data is empty or there's an error)
        if (this.categories.length === 0 || this.error) {
          this.loadCategories();
        }
      }
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // Force reload data when needed
  forceReload(): void {
    this.categories = []; // Clear current data
    this.isLoading = false; // Reset loading state
    this.error = null; // Clear any errors
    this.loadCategories(); // Load fresh data
  }



  loadCategories(): void {
    // Don't reload if already loading
    if (this.isLoading) return;
    
    this.isLoading = true;
    this.error = null;
    
    this.expertService.listCategories(this.pageNo, this.pageSize).subscribe({
      next: (res: any) => {
        if (res && res.data && Array.isArray(res.data)) {
          // Map API response fields to component fields
          this.categories = res.data.map((category: ApiCategory) => ({
            id: category.id,
            name: category.categoryName,
            description: category.categoryDescription
          }));
        } else {
          this.categories = [];
        }
        this.isLoading = false;
        
        // Force change detection to update UI
        this.cdr.detectChanges();
        
        // Also try setTimeout approach as backup
        setTimeout(() => {
          this.cdr.detectChanges();
        }, 0);
      },
      error: (err) => {
        this.error = 'Không thể tải danh sách chuyên mục.';
        this.isLoading = false;
        this.categories = [];
        
        // Force change detection on error too
        this.cdr.detectChanges();
      }
    });
  }

  submitCategory(): void {
    if (this.categoryForm.invalid) return;
    const data = this.categoryForm.value;
    this.isLoading = true;
    if (this.editMode && this.editingCategoryId) {
      // Đảm bảo chỉ gửi đúng field name và description cho API update
      const updatePayload = {
        name: data.name,
        description: data.description
      };
      this.expertService.updateCategory(this.editingCategoryId, updatePayload).subscribe({
        next: () => {
          this.resetForm();
          this.toastService.success('Cập nhật chuyên mục thành công!');
          setTimeout(() => window.location.reload(), 1000);
        },
        error: () => {
          this.error = 'Cập nhật chuyên mục thất bại.';
          this.isLoading = false;
        }
      });
    } else {
      this.expertService.createCategory(data).subscribe({
        next: (res) => {
          this.resetForm();
          let msg = 'Tạo chuyên mục thành công!';
          if (res && res.message && res.status === 201) {
            if (res.message.includes('Create category successfully')) {
              msg = 'Tạo chuyên mục thành công!';
            } else {
              msg = res.message;
            }
          }
          this.toastService.success(msg);
          setTimeout(() => window.location.reload(), 1000);
        },
        error: () => {
          this.error = 'Tạo chuyên mục thất bại.';
          this.isLoading = false;
        }
      });
    }
  }

  editCategory(category: Category): void {
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
        this.toastService.success('Xóa chuyên mục thành công!');
        setTimeout(() => window.location.reload(), 1000);
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



  // TrackBy function for ngFor performance
  trackByCategory(index: number, category: Category): number {
    return category?.id || index;
  }

  changePage(page: number): void {
    if (page < 0 || page >= this.totalPages) return;
    this.pageNo = page;
    this.loadCategories();
  }
}
