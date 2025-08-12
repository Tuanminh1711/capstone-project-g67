import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { TopNavigatorComponent } from '../../../shared/top-navigator/top-navigator.component';
import { UserViewArticleService } from '../user-view-article.service';

@Component({
  selector: 'app-user-articles-list',
  standalone: true,
  imports: [CommonModule, RouterModule, TopNavigatorComponent],
  templateUrl: './user-articles-list.component.html',
  styleUrls: ['./user-articles-list.component.scss']
})
export class UserArticlesListComponent implements OnInit {
  articles: any[] = [];
  isLoading = false;
  error: string | null = null;
  currentPage = 0;
  pageSize = 10;
  totalElements = 0;
  totalPages = 0;

  constructor(
    private userViewArticleService: UserViewArticleService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.loadArticles();
  }

  loadArticles(): void {
    this.isLoading = true;
    this.error = null;

    console.log('Loading articles from API...');
    this.userViewArticleService.getAllArticles(this.currentPage, this.pageSize).subscribe({
      next: (res: any) => {
        console.log('API Response:', res);
        console.log('API Response Data:', res.data);
        console.log('API Response Content:', res.data?.content);
        
        if (res.data && res.data.content) {
          console.log('Found', res.data.content.length, 'articles');
          this.articles = res.data.content.map((article: any) => {
            console.log('=== Processing Article ===');
            console.log('Article ID:', article.id);
            console.log('Article Title:', article.title);
            console.log('Article imageUrls:', article.imageUrls);
            console.log('Article imageUrl:', article.imageUrl);
            
            // Xử lý ảnh: ưu tiên imageUrls[0], sau đó imageUrl, cuối cùng là fallback
            let finalImageUrl = '';
            if (article.imageUrls && article.imageUrls.length > 0) {
              finalImageUrl = article.imageUrls[0]; // Lấy ảnh đầu tiên từ API
              console.log('✅ Using imageUrls[0]:', finalImageUrl);
            } else if (article.imageUrl) {
              finalImageUrl = article.imageUrl;
              console.log('✅ Using imageUrl:', finalImageUrl);
            } else {
              finalImageUrl = 'assets/image/banner_blog.jpg'; // Fallback image
              console.log('⚠️ Using fallback image:', finalImageUrl);
            }
            
            console.log('Final imageUrl:', finalImageUrl);
            console.log('========================');
            
            return {
              id: article.id,
              title: article.title,
              categoryName: article.categoryName || 'KIẾN THỨC VÀ CÁCH CHĂM SÓC THÔNG TIN VỀ CÂY',
              createdAt: article.createdAt || article.createdDate || new Date(),
              imageUrl: finalImageUrl
            };
          });
          console.log('✅ Final processed articles:', this.articles);
        } else {
          this.articles = [];
          console.log('❌ No content in API response');
        }
        
        this.totalElements = res.data?.totalElements || 0;
        this.totalPages = res.data?.totalPages || 0;
        this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Error loading articles:', err);
        this.error = 'Không thể tải danh sách bài viết.';
        this.isLoading = false;
        this.cdr.detectChanges();
      }
    });
  }

  onPageChange(page: number): void {
    this.currentPage = page;
    this.loadArticles();
  }

  getPageNumbers(): number[] {
    const pages: number[] = [];
    const maxVisiblePages = 5;
    let startPage = Math.max(0, this.currentPage - Math.floor(maxVisiblePages / 2));
    let endPage = Math.min(this.totalPages - 1, startPage + maxVisiblePages - 1);

    if (endPage - startPage + 1 < maxVisiblePages) {
      startPage = Math.max(0, endPage - maxVisiblePages + 1);
    }

    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }

    return pages;
  }

  // Handle image loading errors
  onImageError(event: any): void {
    const img = event.target as HTMLImageElement;
    console.log('Image failed to load:', img.src);
    // Fallback to default image
    img.src = 'assets/image/banner_blog.jpg';
  }
}
