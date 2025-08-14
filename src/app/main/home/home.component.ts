
import { Component, ChangeDetectorRef, ChangeDetectionStrategy, OnInit, OnDestroy } from '@angular/core';
import { ToastService } from '../../shared/toast/toast.service';
import { HttpClient } from '@angular/common/http';
import { ActivatedRoute, Router } from '@angular/router';
import { DialogManager } from '../../shared/dialog-manager.service';
import { LoginDialogComponent } from '../../auth/login/login-dialog';
import { RegisterDialogComponent } from '../../auth/register/register-dialog';
import { JwtUserUtilService } from '../../auth/jwt-user-util.service';
import { CommonModule, NgOptimizedImage } from '@angular/common';
import { TopNavigatorComponent } from '../../shared/top-navigator/index';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [TopNavigatorComponent, NgOptimizedImage, CommonModule],
  templateUrl: './home.html',
  styleUrls: ['./home.scss', './home.article.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class HomeComponent implements OnInit, OnDestroy {
  // Format excerpt: tách dòng nhẹ cho Home
  getExcerptFormatted(excerpt: string): string {
    if (!excerpt) return '';
    return excerpt
      .replace(/(##+|\n|\r)/g, '<br>')
      .replace(/#/g, '')
      .replace(/\s+–\s+/g, '<br>')
      .replace(/\./g, '.<br>')
      .replace(/<br><br>/g, '<br>');
  }
  // Loại bỏ dấu # khỏi excerpt
  getExcerptNoHash(excerpt: string): string {
    return excerpt ? excerpt.replace(/#/g, '') : '';
  }
  ngOnInit() {
    console.log('HomeComponent ngOnInit called');
    this.checkVnpaySuccess();
    this.loadArticles();
  }

  // Articles slider properties
  currentArticle = 0;
  articles: any[] = [];
  private articlesInterval: any;
  
  // Pagination properties
  currentPage = 0;
  articlesPerPage = 3;

  checkVnpaySuccess() {
    this.route.queryParams.subscribe(params => {
      if (params['vnp_ResponseCode'] === '00' && params['vnp_TxnRef']) {
        // Gọi BE xác nhận thanh toán
        this.http.get('/api/payment/vnpay-return', { params }).subscribe({
          next: () => {
            this.toast.success('Thanh toán VIP thành công! Đơn hàng đã được xác nhận.');
            this.toast.info('Vui lòng đăng xuất và đăng nhập lại để sử dụng đầy đủ tính năng VIP.');
          },
          error: () => {
            this.toast.warning('Thanh toán thành công, nhưng không xác nhận được đơn hàng. Vui lòng liên hệ hỗ trợ.');
          }
        });
      } else if (params['vnp_ResponseCode'] === '00') {
        this.toast.success('Thanh toán VIP thành công! Chào mừng bạn trở thành thành viên VIP.');
        this.toast.info('Vui lòng đăng xuất và đăng nhập lại để sử dụng đầy đủ tính năng VIP.');
      }
    });
  }

  // Load articles from API
  loadArticles() {
    console.log('Loading articles...');
    this.http.get(`${environment.baseUrl}/api/user_articles/get_list_articles?page=0&size=6`).subscribe({
      next: (res: any) => {
        console.log('API response:', res);
        if (res.data && res.data.content) {
          this.articles = res.data.content.map((article: any) => ({
            id: article.id,
            title: article.title,
            excerpt: article.excerpt || article.content?.substring(0, 150) + '...' || 'Khám phá kiến thức chăm sóc cây cảnh từ chuyên gia...',
            imageUrl: article.imageUrls && article.imageUrls.length > 0 ? article.imageUrls[0] : 'assets/image/banner_blog.jpg',
            categoryName: article.categoryName || 'KIẾN THỨC VÀ CÁCH CHĂM SÓC THÔNG TIN VỀ CÂY',
            createdDate: article.createdDate || article.createdAt || new Date()
          }));
          console.log('Articles loaded from API:', this.articles);
          this.currentArticle = 0;
          if (this.articles.length > 0) {
            this.startArticlesAutoSlide();
          }
          this.cdr.detectChanges();
        }
      },
      error: (err) => {
        console.error('Error loading articles:', err);
        this.articles = [];
        this.cdr.detectChanges();
      }
    });
  }

  // Articles slider methods
  nextArticle() {
    if (this.articles.length > 0) {
      this.currentArticle = (this.currentArticle + 1) % this.articles.length;
      this.cdr.detectChanges();
    }
  }

  previousArticle() {
    if (this.articles.length > 0) {
      this.currentArticle = this.currentArticle === 0 ? this.articles.length - 1 : this.currentArticle - 1;
      this.cdr.detectChanges();
    }
  }

  goToArticle(index: number) {
    this.currentArticle = index;
    this.cdr.detectChanges();
  }

  goToArticleDetail(articleId: number) {
    console.log('goToArticleDetail called with articleId:', articleId);
    console.log('Navigating to:', `/user/articles/${articleId}`);
    this.router.navigate(['/user/articles', articleId]);
  }

  goToAllArticles() {
    this.router.navigate(['/user/articles/list']);
  }

  // Pagination methods
  getCurrentPageArticles(): any[] {
    const startIndex = this.currentPage * this.articlesPerPage;
    const endIndex = startIndex + this.articlesPerPage;
    return this.articles.slice(startIndex, endIndex);
  }

  getTotalPages(): number {
    return Math.ceil(this.articles.length / this.articlesPerPage);
  }

  getPageNumbers(): number[] {
    const totalPages = this.getTotalPages();
    return Array.from({ length: totalPages }, (_, i) => i);
  }

  nextPage(): void {
    if (this.currentPage < this.getTotalPages() - 1) {
      this.currentPage++;
      this.cdr.detectChanges();
    }
  }

  previousPage(): void {
    if (this.currentPage > 0) {
      this.currentPage--;
      this.cdr.detectChanges();
    }
  }

  goToPage(pageIndex: number): void {
    if (pageIndex >= 0 && pageIndex < this.getTotalPages()) {
      this.currentPage = pageIndex;
      this.cdr.detectChanges();
    }
  }

  startArticlesAutoSlide() {
    if (this.articles.length > 1) {
      this.articlesInterval = setInterval(() => {
        this.nextArticle();
      }, 5000);
    }
  }

  // Đã dùng ToastService, không cần showToast
  currentBanner = 0;
  bannerSlides = [
    {
      title: 'Chào mừng đến với PlantCare!',
      desc: 'Khám phá kho kiến thức cây cảnh, mẹo chăm sóc và cộng đồng yêu cây lớn nhất Việt Nam.',
      image: 'assets/image/slide1.jpg',
      cta: 'Khám phá ngay',
      ctaAction: () => this.router.navigate(['/plant-info'])
    },
    {
      title: 'Tư vấn cùng chuyên gia',
      desc: 'Đặt câu hỏi, nhận lời khuyên và giải đáp mọi thắc mắc về cây từ đội ngũ chuyên gia uy tín.',
      image: 'assets/image/slide2.jpg',
      cta: 'Gặp chuyên gia',
      ctaAction: () => this.router.navigate(['/care-expert'])
    },
    {
      title: 'Quản lý vườn cây của bạn',
      desc: 'Theo dõi, ghi chú, nhận nhắc nhở chăm sóc và chia sẻ vườn cây với bạn bè.',
      image: 'assets/image/slide3.jpg',
      cta: 'Vào vườn của tôi',
      ctaAction: () => this.router.navigate(['/user/my-garden'])
    }
  ];
  private bannerInterval: any;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private dialogManager: DialogManager,
    public jwtUserUtil: JwtUserUtilService,
    private cdr: ChangeDetectorRef,
    private http: HttpClient,
    private toast: ToastService
  ) {
    console.log('HomeComponent constructor called');
    this.startBannerAutoSlide();
  }

  startBannerAutoSlide() {
    this.bannerInterval = setInterval(() => {
      this.currentBanner = (this.currentBanner + 1) % 3;
      this.cdr.detectChanges();
    }, 6000);
  }

  ngOnDestroy() {
    if (this.bannerInterval) clearInterval(this.bannerInterval);
    if (this.articlesInterval) clearInterval(this.articlesInterval);
  }

  onConnectExpertClick() {
    if (this.jwtUserUtil.isLoggedIn()) {
      this.router.navigate(['/community']);
    } else {
      this.dialogManager.open(LoginDialogComponent);
    }
  }

  goToCareExpert() {
    const role = this.jwtUserUtil.getRoleFromToken();
    if (role && role.toLowerCase() === 'vip') {
      this.router.navigate(['/vip/welcome']);
    } else {
      this.router.navigate(['/care-expert']);
    }
  }

  goToVipUpgrade() {
    this.router.navigate(['/user/exper/vip-payment']);
  }
}
