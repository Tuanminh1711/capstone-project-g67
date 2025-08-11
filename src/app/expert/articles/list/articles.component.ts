

import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ArticlesService, Article } from '../articles.service';
import { ChangeDetectorRef } from '@angular/core';
import { ExpertLayoutComponent } from '../../shared/expert-layout/expert-layout.component';
import { Router } from '@angular/router';

@Component({
  selector: 'app-expert-articles',
  templateUrl: './articles.component.html',
  styleUrls: ['./articles.component.scss'],
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, ExpertLayoutComponent]
})
export class ArticlesComponent implements OnInit {
  articles: Article[] = [];
  categories: any[] = [];
  pageNo: number = 0;
  pageSize: number = 10;
  totalPages: number = 1;
  isLoading: boolean = false;
  error: string | null = null;

  articleForm: FormGroup;
  editMode: boolean = false;
  editingArticleId: number | null = null;

  constructor(private fb: FormBuilder, private articlesService: ArticlesService, private cdr: ChangeDetectorRef, private router: Router) {
    this.articleForm = this.fb.group({
      title: ['', Validators.required],
      categoryId: ['', Validators.required],
      content: ['', Validators.required]
    });
  }

  viewDetail(article: any): void {
    this.router.navigate(['/expert/articles-detail', article.id]);
  }

  ngOnInit(): void {
    this.loadCategories();
    this.loadArticles();
  }

  loadCategories(): void {
    this.articlesService.listCategories(0, 50).subscribe({
      next: (res: any) => {
        this.categories = res.data || [];
      },
      error: () => {
        this.categories = [];
      }
    });
  }

  loadArticles(): void {
    this.isLoading = true;
    this.articlesService.getArticles(this.pageNo, this.pageSize).subscribe({
      next: (res: any) => {
        this.articles = res.data?.content || [];
        this.totalPages = res.data?.totalPages || 1;
        this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.error = 'Không thể tải danh sách bài viết.';
        this.isLoading = false;
        this.cdr.detectChanges();
      }
    });
  }

  submitArticle(): void {
    if (this.articleForm.invalid) return;
    const data = this.articleForm.value;
    this.isLoading = true;
    if (this.editMode && this.editingArticleId) {
      this.articlesService.updateArticle(this.editingArticleId, data).subscribe({
        next: () => {
          this.resetForm();
          this.loadArticles();
        },
        error: () => {
          this.error = 'Cập nhật bài viết thất bại.';
          this.isLoading = false;
        }
      });
    } else {
      this.articlesService.createArticle(data).subscribe({
        next: () => {
          this.resetForm();
          this.loadArticles();
        },
        error: () => {
          this.error = 'Tạo bài viết thất bại.';
          this.isLoading = false;
        }
      });
    }
  }

  editArticle(article: any): void {
    this.editMode = true;
    this.editingArticleId = article.id;
    this.articleForm.patchValue({
      title: article.title,
      categoryId: article.categoryId,
      content: article.content
    });
  }

  deleteArticle(articleId: number): void {
    if (!confirm('Bạn có chắc muốn xóa bài viết này?')) return;
    this.isLoading = true;
    this.articlesService.deleteArticle(articleId).subscribe({
      next: () => {
        this.loadArticles();
      },
      error: () => {
        this.error = 'Xóa bài viết thất bại.';
        this.isLoading = false;
      }
    });
  }

  resetForm(): void {
    this.articleForm.reset();
    this.editMode = false;
    this.editingArticleId = null;
    this.error = null;
  }

  changePage(page: number): void {
    if (page < 0 || page >= this.totalPages) return;
    this.pageNo = page;
    this.loadArticles();
  }
}
