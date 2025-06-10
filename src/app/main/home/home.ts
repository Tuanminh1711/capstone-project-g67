import { Component } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { TopNavigator } from '../../shared/top-navigator/top-navigator';
import { DialogManager } from '../../shared/dialog-manager.service';
import { LoginDialogComponent } from '../../auth/login/login-dialog';
import { RegisterDialogComponent } from '../../auth/register/register-dialog';
import { NgFor } from '@angular/common';
import { Footer } from '../../shared/footer/footer';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [TopNavigator, NgFor, Footer],
  templateUrl: './home.html',
  styleUrl: './home.css'
})
export class Home {
  features = [
    {
      title: 'Tìm cây phù hợp',
      description: 'Khám phá các loại cây cảnh phù hợp với không gian và sở thích của bạn, kèm gợi ý chăm sóc chi tiết.'
    },
    {
      title: 'Nhắc lịch tưới & chăm cây',
      description: 'Tự động nhắc lịch tưới nước, bón phân, cắt tỉa... giúp bạn không bỏ lỡ bất kỳ công đoạn nào.'
    },
    {
      title: 'Kết nối chuyên gia',
      description: 'Đặt lịch tư vấn, chat trực tiếp với chuyên gia để giải đáp mọi thắc mắc về cây cảnh.'
    }
  ];
  currentSlide = 0;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private dialogManager: DialogManager
  ) {
    this.route.data.subscribe(data => {
      if (data['showLogin']) {
        this.dialogManager.open(LoginDialogComponent);
      } else if (data['showRegister']) {
        this.dialogManager.open(RegisterDialogComponent);
      }
    });
  }

  prevFeature() {
    if (this.currentSlide > 0) {
      this.currentSlide--;
    }
  }

  nextFeature() {
    if (this.currentSlide < this.features.length - 1) {
      this.currentSlide++;
    }
  }
}
