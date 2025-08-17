import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { TopNavigatorComponent } from '../../../../shared/top-navigator';
import { FooterComponent } from '../../../../shared/footer';
import { UserViewArticleService } from '../user-view-article.service';

@Component({
  selector: 'app-user-article-detail',
  standalone: true,
  imports: [CommonModule, TopNavigatorComponent],
  templateUrl: './user-article-detail.component.html',
  styleUrls: ['./user-article-detail.component.scss']
})
export class UserArticleDetailComponent implements OnInit {
  article: any = null;
  isLoading = false;
  error: string | null = null;
  categories: any[] = [];
  relatedArticles: any[] = [];
  isDropdownOpen = false;
  selectedCategory: any = null;

  // Hàm chèn ảnh vào sau h2 đầu tiên trong nội dung
  getContentWithImages(content: string, imageUrls: string[]): string {
    if (!content) return '';
    let html = content;
    if (imageUrls && imageUrls.length) {
      const imagesHtml = `<div class='images'>${imageUrls.map((url, i) => `<img id='article-image-${i}' src='${url}' alt='Ảnh bài viết' />`).join('')}</div>`;
      // Chèn sau h2 đầu tiên
      html = html.replace(/(<h2[^>]*>.*?<\/h2>)/i, `$1${imagesHtml}`);
    }
    return html;
  }

  // Hàm chuyển markdown đơn giản sang HTML cho nội dung bài viết
  formatMarkdown(raw: string): string {
    if (!raw) return '';
    // ## -> h2, ### -> h3, #### -> li
    let html = raw
      .replace(/^#### (.*)$/gm, '<li>$1</li>')
      .replace(/^### (.*)$/gm, '<h3>$1</h3>')
      .replace(/^## (.*)$/gm, '<h2>$1</h2>');
    // Nếu có <li>, bọc vào <ul>
    if (/<li>.*<\/li>/s.test(html)) {
      html = html.replace(/(<li>.*?<\/li>)/gs, '<ul>$1</ul>');
    }
    html = html.replace(/\n{2,}/g, '<br>'); // giữ khoảng cách đoạn
    return html;
  }

  toggleDropdown(): void {
    this.isDropdownOpen = !this.isDropdownOpen;
  }

  selectCategory(category: any): void {
    this.selectedCategory = category;
    this.isDropdownOpen = false;
    // Có thể thêm logic lọc bài viết theo danh mục ở đây
    console.log('Selected category:', category);
  }

  constructor(
    private route: ActivatedRoute,
    private userViewArticleService: UserViewArticleService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.loadCategories();
    this.loadRelatedArticles();
    
    const id = this.route.snapshot.paramMap.get('id');
    // Chỉ gọi API nếu id là số hợp lệ (không phải 'new', không undefined, không NaN)
    if (id && !isNaN(+id) && id !== 'new') {
      this.isLoading = true;
      this.userViewArticleService.getArticleDetail(+id).subscribe({
        next: (res: any) => {
          this.article = res.data;
          // Format markdown nếu có
          if (this.article && this.article.content) {
            this.article.content = this.formatMarkdown(this.article.content);
          }
          this.isLoading = false;
          this.cdr.detectChanges();
        },
        error: () => {
          this.error = 'Không tìm thấy bài viết.';
          this.isLoading = false;
          this.cdr.detectChanges();
        }
      });
    } else {
      // Nếu id không hợp lệ (undefined hoặc là 'new'), không gọi API, không hiển thị detail
      this.article = null;
      this.error = null;
      this.isLoading = false;
      this.cdr.detectChanges();
    }
  }

  private loadCategories(): void {
    // TODO: Thay thế bằng API call thật
    // this.userViewArticleService.getCategories().subscribe({
    //   next: (res: any) => {
    //     this.categories = res.data || [];
    //   },
    //   error: (err) => {
    //     console.error('Error loading categories:', err);
    //     this.categories = [];
    //   }
    // });

    // Tạm thời sử dụng dữ liệu giả lập
    this.categories = [
      { id: 1, name: 'Phong thủy', count: 5 },
      { id: 2, name: 'Kiến thức chăm sóc', count: 12 },
      { id: 3, name: 'Cây cảnh đẹp', count: 8 },
      { id: 4, name: 'Mẹo trồng cây', count: 6 },
      { id: 5, name: 'Cây trong nhà', count: 9 },
      { id: 6, name: 'Cây ngoài trời', count: 7 }
    ];
  }

  private loadRelatedArticles(): void {
    // TODO: Thay thế bằng API call thật
    // this.userViewArticleService.getRelatedArticles(this.article?.id).subscribe({
    //   next: (res: any) => {
    //     this.relatedArticles = res.data || [];
    //   },
    //   error: (err) => {
    //     console.error('Error loading related articles:', err);
    //     this.relatedArticles = [];
    //   }
    // });

    // Tạm thời sử dụng dữ liệu giả lập
    this.relatedArticles = [
      {
        title: 'Top 10 cây phong thủy hợp mệnh Kim',
        excerpt: 'Giúp kích hoạt vượng khí và mang lại may mắn cho gia chủ...',
        imageUrl: 'assets/image/related1.jpg'
      },
      {
        title: 'Hướng dẫn lựa chọn cây phong thủy',
        excerpt: 'Trong nhà để tăng vượng khí và cải thiện không gian sống...',
        imageUrl: 'assets/image/related2.jpg'
      },
      {
        title: 'Cách chăm sóc cây cảnh trong mùa đông',
        excerpt: 'Những lưu ý quan trọng để cây sống khỏe qua mùa lạnh...',
        imageUrl: 'assets/image/related3.jpg'
      }
    ];
  }
}
