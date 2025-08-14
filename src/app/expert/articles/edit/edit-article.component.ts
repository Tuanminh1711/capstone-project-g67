import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { ArticlesService, ArticleDetail, UpdateArticleRequest } from '../articles.service';
import { ChangeDetectorRef } from '@angular/core';
import { ToastService } from '../../../shared/toast/toast.service';

@Component({
  selector: 'app-edit-article',
  templateUrl: './edit-article.component.html',
  styleUrls: ['./edit-article.component.scss'],
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule]
})
export class EditArticleComponent implements OnInit {
  images: { url: string; status: 'EXISTING' | 'NEW' | 'REMOVED' }[] = [];
  imageFile: File | null = null;
  uploadError: string | null = null;

  onImageSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.imageFile = input.files[0];
      this.uploadImage();
    }
  }

  uploadImage(): void {
    if (!this.imageFile) return;
    this.isLoading = true;
    this.articlesService.uploadArticleImage(this.imageFile).subscribe({
      next: (res) => {
        this.images.push({ url: res.data, status: 'NEW' });
        this.isLoading = false;
        this.uploadError = null;
        this.cdr.detectChanges();
      },
      error: () => {
        this.uploadError = 'Upload ảnh thất bại.';
        this.isLoading = false;
        this.cdr.detectChanges();
      }
    });
  }

  removeImage(imageUrl: string): void {
    const index = this.images.findIndex(img => img.url === imageUrl);
    if (index !== -1) {
      if (this.images[index].status === 'EXISTING') {
        this.images[index].status = 'REMOVED';
      } else {
        this.images.splice(index, 1);
      }
      this.cdr.detectChanges();
    }
  }
  articleForm: FormGroup;
  articleId: number;
  article: ArticleDetail | null = null;
  categories: any[] = [];
  isLoading: boolean = false;
  isSubmitting: boolean = false;
  error: string | null = null;
  success: string | null = null;

  constructor(
    private fb: FormBuilder,
    private articlesService: ArticlesService,
    private route: ActivatedRoute,
    private router: Router,
    private cdr: ChangeDetectorRef,
    private toastService: ToastService
  ) {
    this.articleId = 0;
    this.articleForm = this.fb.group({
      title: ['', Validators.required],
      categoryId: ['', Validators.required],
      status: ['', Validators.required],
      content: ['', Validators.required]
    });
  }

  ngOnInit(): void {
    this.articleId = Number(this.route.snapshot.paramMap.get('id'));
    if (this.articleId) {
      // Load categories first, then load article
      this.loadCategories();
    }
  }

  loadCategories(): void {
    this.articlesService.listCategories(0, 50).subscribe({
      next: (res: any) => {
        this.categories = res.data || [];
        
        // After categories are loaded, load the article
        if (this.categories.length > 0) {
          this.loadArticle();
        } else {
          this.error = 'Không có chuyên mục nào được tìm thấy.';
          this.isLoading = false;
        }
      },
      error: (err) => {
        this.categories = [];
        this.error = 'Không thể tải danh sách chuyên mục. Vui lòng thử lại.';
        this.isLoading = false;
      }
    });
  }

  loadArticle(): void {
    this.isLoading = true;
    this.articlesService.getArticleDetail(this.articleId).subscribe({
      next: (res: any) => {
        if (res.data) {
          this.article = res.data;
          this.updateFormWithArticle();
          // Initialize images array with existing images
          // Initialize images array with existing images
          if (this.article && this.article.imageUrl) {
            this.images = [{ url: this.article.imageUrl, status: 'EXISTING' }];
          } else {
            this.images = [];
          }
        } else {
          this.error = 'Không thể tải thông tin bài viết.';
        }
        this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.error = 'Không thể tải thông tin bài viết.';
        this.isLoading = false;
        this.cdr.detectChanges();
      }
    });
  }

  updateFormWithArticle(): void {
    if (!this.article) return;

    let categoryId = '';
    
    // Try to use categoryId first if available
    if (this.article.categoryId) {
      categoryId = this.article.categoryId.toString();
    }
    // Fallback to finding category by name
    else if (this.article.categoryName && this.categories.length > 0) {
      const category = this.categories.find(cat => cat.categoryName === this.article?.categoryName);
      if (category) {
        categoryId = category.id.toString();
      }
    }

    // Update form values
    this.articleForm.setValue({
      title: this.article.title,
      categoryId: categoryId,
      status: this.article.status || 'PUBLISHED',
      content: this.article.content
    });

    // Force change detection to update the dropdown
    this.cdr.detectChanges();
  }

  onSubmit(): void {
    if (this.articleForm.invalid) {
      return;
    }

    const formValue = this.articleForm.value;

    // Additional validation for categoryId
    if (!formValue.categoryId) {
      this.error = 'Vui lòng chọn chuyên mục cho bài viết.';
      this.toastService.error('Vui lòng chọn chuyên mục cho bài viết.');
      return;
    }

    this.isSubmitting = true;
    this.error = null;
    this.success = null;

    const updateData: UpdateArticleRequest = {
      title: formValue.title,
      content: formValue.content,
      categoryId: Number(formValue.categoryId),
      status: formValue.status,
      imageUpdates: this.images.map(img => ({
        imageUrl: img.url,  // Đổi từ url thành imageUrl
        action: img.status === 'NEW' ? 'ADD' : 
                img.status === 'REMOVED' ? 'REMOVE' : 'KEEP'
      }))
    };

    this.articlesService.updateArticle(this.articleId, updateData).subscribe({
      next: (res: any) => {
        if (res.data) {
          this.success = 'Cập nhật bài viết thành công!';
          this.article = res.data;
          
          // Show success toast
          this.toastService.success('Cập nhật bài viết thành công! 🎉');
          
          // Navigate back after showing toast
          setTimeout(() => {
            this.router.navigate(['/expert/articles']);
          }, 2000);
        } else {
          this.error = res.message || 'Cập nhật bài viết thất bại.';
          this.toastService.error(res.message || 'Cập nhật bài viết thất bại.');
        }
        this.isSubmitting = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.error = 'Cập nhật bài viết thất bại. Vui lòng thử lại.';
        this.toastService.error('Cập nhật bài viết thất bại. Vui lòng thử lại.');
        this.isSubmitting = false;
        this.cdr.detectChanges();
      }
    });
  }

  onCancel(): void {
    this.router.navigate(['/expert/articles']);
  }
}
