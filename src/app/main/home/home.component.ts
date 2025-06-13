import { Component } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { DialogManager } from '../../shared/dialog-manager.service';
import { LoginDialogComponent } from '../../auth/login/login-dialog';
import { RegisterDialogComponent } from '../../auth/register/register-dialog';
import { NgFor } from '@angular/common';
import { TopNavigatorComponent } from '../../shared/top-navigator/index';
import { FooterComponent } from '../../shared/footer/index';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [NgFor, TopNavigatorComponent, FooterComponent],
  templateUrl: './home.html',
  styleUrl: './home.scss'
})
export class HomeComponent {
  // Chia thành 2 slide, mỗi slide là 1 mảng gồm 2 feature
  // Slide 1
  leftSlides = [
    {
      title: 'Tìm cây phù hợp',
      description: 'Khám phá các loại cây cảnh phù hợp với không gian và sở thích của bạn, kèm gợi ý chăm sóc chi tiết.'
    },
    {
      title: 'Nhắc lịch tưới & chăm cây',
      description: 'Tự động nhắc lịch tưới nước, bón phân, cắt tỉa... giúp bạn không bỏ lỡ bất kỳ công đoạn nào.'
    }
  ];
  rightSlides = [
    {
      title: 'Dịch vụ chuyên gia',
      description: 'Chúng tôi cung cấp hỗ trợ chăm cây chuyên sâu: Chat hoặc đặt lịch hẹn với chuyên gia, dịch vụ chăm cây tại nhà.'
    },
    {
      title: 'Cộng đồng & chia sẻ',
      description: 'Tham gia cộng đồng yêu cây, chia sẻ kinh nghiệm, hỏi đáp và nhận nhiều ưu đãi dành riêng cho thành viên.'
    }
  ];
  leftSlideIndex = 0;
  rightSlideIndex = 0;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private dialogManager: DialogManager
  ) {}
}
