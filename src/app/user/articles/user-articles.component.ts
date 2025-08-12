import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { TopNavigatorComponent } from '../../shared/top-navigator/top-navigator.component';
import { FooterComponent } from '../../shared/footer/footer.component';
import { UserViewArticleService } from './user-view-article.service';

@Component({
  selector: 'app-user-articles',
  standalone: true,
  imports: [CommonModule, RouterModule, TopNavigatorComponent],
  template: `
    <app-top-navigator></app-top-navigator>
    
    <div class="user-articles-container">
      <div class="container">
        <div class="header">
          <h1 class="main-title">THÔNG TIN & BLOG</h1>
          <p class="subtitle">Khám phá những bài viết hữu ích về chăm sóc cây trồng từ các chuyên gia</p>
          <div class="header-decoration">
            <span class="decoration-line"></span>
            <span class="decoration-icon">🌱</span>
            <span class="decoration-line"></span>
          </div>
        </div>
        
        <div *ngIf="isLoading" class="loading">
          <div class="loading-spinner"></div>
          <p>Đang tải bài viết...</p>
        </div>

        <div *ngIf="error" class="error">
          <span class="error-icon">⚠️</span>
          {{ error }}
        </div>

        <div *ngIf="!isLoading && !error" class="articles-grid">
          <div *ngFor="let article of articles; let i = index" class="article-card" [class.article-card-1]="i === 0" [class.article-card-2]="i === 1" [class.article-card-3]="i === 2" [routerLink]="['/user/articles', article.id]">
            <div class="article-image">
              <img [src]="article.imageUrl" [alt]="article.title" />
              <div class="article-overlay">
                <div class="article-overlay-content">
                  <span class="read-more-icon">→</span>
                </div>
              </div>
            </div>
            <div class="article-content">
              <div class="article-category">{{ article.categoryName }}</div>
              <h3 class="article-title">{{ article.title }}</h3>
              <div class="article-meta">
                <span class="article-date">{{ article.createdAt | date:'dd/MM/yyyy' }}</span>
                <span class="article-read-time">5 phút đọc</span>
              </div>
            </div>
          </div>
        </div>

        <div *ngIf="!isLoading && !error && articles.length === 0" class="no-articles">
          <span class="no-articles-icon">📚</span>
          <p>Chưa có bài viết nào.</p>
        </div>

        <div *ngIf="!isLoading && !error && articles.length > 0" class="view-all-section">
          <div class="view-all-content">
            <div class="view-all-text">
              <h3>Khám phá thêm kiến thức</h3>
              <p>Hơn 100+ bài viết chuyên sâu về chăm sóc cây cảnh</p>
            </div>
            <a routerLink="/user/articles/list" class="view-all-btn">
              <span>Xem tất cả bài viết</span>
              <i class="fas fa-arrow-right"></i>
            </a>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .user-articles-container {
      min-height: 80vh;
      background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 50%, #e2e8f0 100%);
      padding: 3rem 0;
      position: relative;
      
      &::before {
        content: '';
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        height: 3px;
        background: linear-gradient(90deg, transparent 0%, #10b981 20%, #059669 50%, #10b981 80%, transparent 100%);
        box-shadow: 0 2px 8px rgba(16, 185, 129, 0.3);
      }
    }
    
    .container {
      max-width: 1200px;
      margin: 0 auto;
      padding: 0 1rem;
    }
    
    .header {
      text-align: center;
      margin-bottom: 4rem;
      
      .main-title {
        font-size: 3.5rem;
        font-weight: 900;
        margin-bottom: 20px;
        text-transform: uppercase;
        letter-spacing: 2px;
        background: linear-gradient(135deg, #059669 0%, #10b981 50%, #34d399 100%);
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
        background-clip: text;
        position: relative;
        text-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        
        &::after {
          content: '';
          position: absolute;
          bottom: -12px;
          left: 50%;
          transform: translateX(-50%);
          width: 120px;
          height: 6px;
          background: linear-gradient(90deg, #059669, #10b981, #34d399);
          border-radius: 3px;
          box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);
        }
      }
      
      .subtitle {
        color: #475569;
        font-size: 1.4rem;
        font-weight: 500;
        max-width: 700px;
        margin: 0 auto 2rem;
        line-height: 1.7;
        text-align: center;
        position: relative;
        
        &::before {
          content: '✨';
          position: absolute;
          left: -40px;
          top: 50%;
          transform: translateY(-50%);
          font-size: 1.2rem;
          opacity: 0.7;
        }
        
        &::after {
          content: '✨';
          position: absolute;
          right: -40px;
          top: 50%;
          transform: translateY(-50%);
          font-size: 1.2rem;
          opacity: 0.7;
        }
      }
      
      .header-decoration {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 1rem;
        margin-top: 2rem;
        
        .decoration-line {
          width: 60px;
          height: 2px;
          background: linear-gradient(90deg, transparent, #10b981, transparent);
        }
        
        .decoration-icon {
          font-size: 1.5rem;
          opacity: 0.8;
        }
      }
    }

    .loading {
      text-align: center;
      padding: 3rem;
      
      .loading-spinner {
        width: 50px;
        height: 50px;
        border: 4px solid #e8f0e8;
        border-top: 4px solid #2d5a4a;
        border-radius: 50%;
        animation: spin 1s linear infinite;
        margin: 0 auto 1rem;
      }
      
      p {
        color: #5d7c5d;
        font-size: 1.1rem;
      }
    }

    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }

    .error {
      color: #8b4513;
      text-align: center;
      font-size: 1.2rem;
      font-weight: 500;
      background: #f5f0e8;
      padding: 2rem;
      border-radius: 12px;
      border: 1px solid #d4c4a8;
      margin: 2rem 0;
      
      .error-icon {
        display: block;
        font-size: 2rem;
        margin-bottom: 1rem;
      }
    }

    .articles-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
      gap: 2rem;
      margin-bottom: 3rem;
    }

    .article-card {
      background: white;
      border-radius: 16px;
      overflow: hidden;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
      transition: all 0.3s ease;
      cursor: pointer;
      border: 1px solid #e8f0e8;
      
      &:hover {
        transform: translateY(-8px);
        box-shadow: 0 8px 30px rgba(45, 90, 74, 0.15);
        border-color: #2d5a4a;
      }
    }

    .article-image {
      height: 200px;
      overflow: hidden;
      position: relative;
      
      img {
        width: 100%;
        height: 100%;
        object-fit: cover;
        transition: transform 0.3s ease;
      }
      
      .article-overlay {
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: linear-gradient(135deg, rgba(16, 185, 129, 0.1), rgba(5, 150, 105, 0.2));
        opacity: 0;
        transition: all 0.3s ease;
        display: flex;
        align-items: center;
        justify-content: center;
        
        .article-overlay-content {
          .read-more-icon {
            font-size: 2rem;
            color: white;
            background: rgba(16, 185, 129, 0.9);
            width: 60px;
            height: 60px;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            transform: translateY(20px);
            transition: all 0.3s ease;
          }
        }
      }
    }

    .article-card:hover .article-image {
      .article-overlay {
        opacity: 1;
        
        .article-overlay-content .read-more-icon {
          transform: translateY(0);
        }
      }
      
      img {
        transform: scale(1.05);
      }
    }

    .article-content {
      padding: 1.5rem;
    }

    .article-category {
      display: inline-block;
      background: linear-gradient(135deg, #e8f0e8, #f0f4f0);
      color: #2d5a4a;
      padding: 0.4rem 1rem;
      border-radius: 20px;
      font-size: 0.85rem;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      margin-bottom: 1rem;
      box-shadow: 0 2px 8px rgba(45, 90, 74, 0.1);
    }

    .article-title {
      font-size: 1.3rem;
      font-weight: 600;
      color: #1a3a2e;
      margin-bottom: 1rem;
      line-height: 1.4;
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
      overflow: hidden;
    }

    .article-meta {
      display: flex;
      align-items: center;
      gap: 1rem;
      
      .article-date {
        color: #5d7c5d;
        font-size: 0.9rem;
        font-weight: 500;
      }
      
      .article-read-time {
        color: #94a3b8;
        font-size: 0.85rem;
        font-weight: 500;
        background: #f1f5f9;
        padding: 0.2rem 0.6rem;
        border-radius: 12px;
      }
    }

    .no-articles {
      text-align: center;
      padding: 3rem;
      color: #5d7c5d;
      
      .no-articles-icon {
        font-size: 3rem;
        display: block;
        margin-bottom: 1rem;
      }
      
      p {
        font-size: 1.1rem;
        margin: 0;
      }
    }

    .view-all-section {
      text-align: center;
      margin-top: 4rem;
      padding: 3rem 0;
      background: linear-gradient(135deg, rgba(16, 185, 129, 0.05), rgba(5, 150, 105, 0.1));
      border-radius: 20px;
      border: 1px solid rgba(16, 185, 129, 0.1);
    }

    .view-all-content {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 2rem;
      
      .view-all-text {
        h3 {
          font-size: 2rem;
          font-weight: 700;
          color: #0f4c3a;
          margin-bottom: 1rem;
        }
        
        p {
          font-size: 1.1rem;
          color: #5d7c5d;
          max-width: 500px;
          margin: 0 auto;
          line-height: 1.6;
        }
      }
    }

    .view-all-btn {
      display: inline-flex;
      align-items: center;
      gap: 0.8rem;
      padding: 1.2rem 2.5rem;
      background: linear-gradient(135deg, #059669, #10b981);
      color: white;
      text-decoration: none;
      border-radius: 16px;
      font-weight: 600;
      font-size: 1.1rem;
      box-shadow: 0 8px 25px rgba(16, 185, 129, 0.3);
      transition: all 0.3s ease;
      border: none;
      position: relative;
      overflow: hidden;
      
      &::before {
        content: '';
        position: absolute;
        top: 0;
        left: -100%;
        width: 100%;
        height: 100%;
        background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent);
        transition: left 0.5s ease;
      }
      
      &:hover {
        transform: translateY(-3px);
        box-shadow: 0 12px 35px rgba(16, 185, 129, 0.4);
        
        &::before {
          left: 100%;
        }
      }
      
      i {
        transition: transform 0.3s ease;
      }
      
      &:hover i {
        transform: translateX(5px);
      }
    }
    
    @media (max-width: 768px) {
      .header .main-title {
        font-size: 2.5rem;
        letter-spacing: 1.5px;
        
        &::after {
          width: 80px;
          height: 4px;
        }
      }
      
      .header .subtitle {
        font-size: 1.2rem;
        
        &::before, &::after {
          display: none;
        }
      }
      
      .articles-grid {
        grid-template-columns: 1fr;
        gap: 1.5rem;
      }
      
      .article-card {
        .article-image {
          height: 180px;
        }
        
        .article-content {
          padding: 1.2rem;
        }
        
        .article-title {
          font-size: 1.2rem;
        }
      }

      .view-all-content .view-all-text h3 {
        font-size: 1.6rem;
      }

      .view-all-btn {
        padding: 1rem 2rem;
        font-size: 1rem;
      }
    }

    @media (max-width: 480px) {
      .header .main-title {
        font-size: 2rem;
        letter-spacing: 1px;
        
        &::after {
          width: 60px;
          height: 3px;
        }
      }
      
      .article-card .article-image {
        height: 160px;
      }
      
      .view-all-content .view-all-text h3 {
        font-size: 1.4rem;
      }
    }
  `]
})
export class UserArticlesComponent implements OnInit {
  articles: any[] = [];
  isLoading = false;
  error: string | null = null;

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

    this.userViewArticleService.getAllArticles(0, 6).subscribe({
      next: (res: any) => {
        if (res.data && res.data.content) {
          this.articles = res.data.content.map((article: any) => {
            // Xử lý ảnh: ưu tiên imageUrls[0], sau đó imageUrl, cuối cùng là fallback
            let finalImageUrl = '';
            if (article.imageUrls && article.imageUrls.length > 0) {
              finalImageUrl = article.imageUrls[0]; // Lấy ảnh đầu tiên từ API
            } else if (article.imageUrl) {
              finalImageUrl = article.imageUrl;
            } else {
              finalImageUrl = 'assets/image/banner_blog.jpg'; // Fallback image
            }
            
            return {
              id: article.id,
              title: article.title,
              categoryName: article.categoryName || 'KIẾN THỨC VÀ CÁCH CHĂM SÓC CÂY',
              createdAt: article.createdAt || article.createdDate || new Date(),
              imageUrl: finalImageUrl
            };
          });
        } else {
          this.articles = [];
        }
        this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.error = 'Không thể tải danh sách bài viết.';
        this.isLoading = false;
        this.cdr.detectChanges();
      }
    });
  }
}
