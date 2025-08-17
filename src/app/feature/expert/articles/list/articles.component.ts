

import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ArticlesService, Article } from '../articles.service';
import { ChangeDetectorRef } from '@angular/core';
import { Router, RouterModule } from '@angular/router';

@Component({
  selector: 'app-expert-articles',
  templateUrl: './articles.component.html',
  styleUrls: ['./articles.component.scss'],
  standalone: true,
  imports: [CommonModule, RouterModule]
})
export class ArticlesComponent implements OnInit {
  articles: Article[] = [];
  categories: any[] = [];
  pageNo: number = 0;
  pageSize: number = 10;
  totalPages: number = 1;
  isLoading: boolean = false;
  error: string | null = null;

  constructor(
    private articlesService: ArticlesService, 
    private cdr: ChangeDetectorRef, 
    private router: Router
  ) {}

  viewDetail(article: any): void {
    this.router.navigate(['/expert/articles/detail', article.id]);
  }

  editArticle(article: any): void {
    this.router.navigate(['/expert/articles/edit', article.id]);
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
        if (res.data) {
          this.articles = res.data?.content || [];
          this.totalPages = res.data?.totalPages || 1;
        } else {
          this.error = res.message || 'Không thể tải danh sách bài viết.';
        }
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

  changePage(page: number): void {
    if (page < 0 || page >= this.totalPages) return;
    this.pageNo = page;
    this.loadArticles();
  }
}
