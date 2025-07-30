
import { Component, ChangeDetectorRef } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { DialogManager } from '../../shared/dialog-manager.service';
import { LoginDialogComponent } from '../../auth/login/login-dialog';
import { RegisterDialogComponent } from '../../auth/register/register-dialog';
import { JwtUserUtilService } from '../../auth/jwt-user-util.service';
import { NgFor, NgIf, NgOptimizedImage } from '@angular/common';
import { TopNavigatorComponent } from '../../shared/top-navigator/index';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [TopNavigatorComponent, NgOptimizedImage],
  templateUrl: './home.html',
  styleUrl: './home.scss'
})
export class HomeComponent {
  currentBanner = 0;
  bannerSlides = [
    {
      title: 'Chào mừng đến với PlantCare!',
      desc: 'Khám phá kho kiến thức cây cảnh, mẹo chăm sóc và cộng đồng yêu cây lớn nhất Việt Nam.',
      cta: 'Khám phá ngay',
      ctaAction: () => this.router.navigate(['/plant-info'])
    },
    {
      title: 'Tư vấn cùng chuyên gia',
      desc: 'Đặt câu hỏi, nhận lời khuyên và giải đáp mọi thắc mắc về cây từ đội ngũ chuyên gia uy tín.',
      cta: 'Gặp chuyên gia',
      ctaAction: () => this.router.navigate(['/care-expert'])
    },
    {
      title: 'Quản lý vườn cây của bạn',
      desc: 'Theo dõi, ghi chú, nhận nhắc nhở chăm sóc và chia sẻ vườn cây với bạn bè.',
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
    private cdr: ChangeDetectorRef
  ) {
    this.startBannerAutoSlide();
  }

  startBannerAutoSlide() {
    this.bannerInterval = setInterval(() => {
      this.currentBanner = (this.currentBanner + 1) % 3;
      this.cdr.markForCheck();
    }, 8000);
  }

  ngOnDestroy() {
    if (this.bannerInterval) clearInterval(this.bannerInterval);
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
      this.router.navigate(['/vip/welcome-vip']);
    } else {
      this.router.navigate(['/care-expert']);
    }
  }
}
