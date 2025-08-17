
import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { ArticlesService } from '../articles.service';

@Component({
  selector: 'app-article-detail',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './article-detail.component.html',
  styleUrls: ['./article-detail.component.scss']
})
export class ArticleDetailComponent implements OnInit {
  article: any = null;
  isLoading = false;
  error: string | null = null;

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

  constructor(
    private route: ActivatedRoute,
    private articlesService: ArticlesService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    // Chỉ gọi API nếu id là số hợp lệ (không phải 'new', không undefined, không NaN)
    if (id && !isNaN(+id) && id !== 'new') {
      this.isLoading = true;
      this.articlesService.getArticleDetail(+id).subscribe({
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
}
