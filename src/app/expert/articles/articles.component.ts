import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ArticlesService, Article } from './articles.service';

@Component({
  selector: 'app-expert-articles',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './articles.component.html',
  styleUrls: ['./articles.component.scss']
})
export class ArticlesComponent implements OnInit {
  articles: Article[] = [];
  loading = false;
  errorMsg = '';

  constructor(private articlesService: ArticlesService) {}

  ngOnInit() {
    this.fetchArticles();
  }

  fetchArticles() {
    this.loading = true;
    this.errorMsg = '';
    this.articlesService.getArticles(0, 20).subscribe({
      next: (res) => {
        if (res && res.data && res.data.content) {
          this.articles = res.data.content.map((a: any) => ({
            id: a.id,
            title: a.title,
            categoryName: a.categoryName || a.category?.name || '',
            status: a.status,
            createdAt: a.createdAt,
            imageUrl: a.imageUrl
          }));
        } else {
          this.articles = [];
        }
        this.loading = false;
      },
      error: (err) => {
        this.errorMsg = 'Không thể tải danh sách bài viết.';
        this.loading = false;
      }
    });
  }

  viewDetail(article: Article) {
    // TODO: Hiển thị chi tiết bài viết (có thể mở modal hoặc chuyển trang)
    alert('Xem chi tiết bài viết: ' + article.title);
  }
}
