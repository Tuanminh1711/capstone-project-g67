import { Component } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { DialogManager } from '../../shared/dialog-manager.service';
import { LoginDialogComponent } from '../../auth/login/login-dialog';
import { RegisterDialogComponent } from '../../auth/register/register-dialog';
import { NgFor, NgIf } from '@angular/common';
import { TopNavigatorComponent } from '../../shared/top-navigator/index';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [NgFor, NgIf, TopNavigatorComponent],
  templateUrl: './home.html',
  styleUrl: './home.scss'
})
export class HomeComponent {
  // Chia thành 2 slide, mỗi slide là 1 mảng gồm 2 feature
  // Slide 1
  leftSlides = [
    {
      title: 'Tìm cây phù hợp',
      description: 'Khám phá các loại cây cảnh phù hợp với không gian và sở thích của bạn, kèm gợi ý chăm sóc chi tiết.',
      icon: 'fa-solid fa-seedling'
    },
    {
      title: 'Nhắc lịch tưới & chăm cây',
      description: 'Tự động nhắc lịch tưới nước, bón phân, cắt tỉa... giúp bạn không bỏ lỡ bất kỳ công đoạn nào.',
      icon: 'fa-regular fa-clock'
    }
  ];
  rightSlides = [
    {
      title: 'Dịch vụ chuyên gia',
      description: 'Chúng tôi cung cấp hỗ trợ chăm cây chuyên sâu: Chat hoặc đặt lịch hẹn với chuyên gia, dịch vụ chăm cây tại nhà.',
      icon: 'fa-solid fa-user-tie'
    },
    {
      title: 'Cộng đồng & chia sẻ',
      description: 'Tham gia cộng đồng yêu cây, chia sẻ kinh nghiệm, hỏi đáp và nhận nhiều ưu đãi dành riêng cho thành viên.',
      icon: 'fa-solid fa-users'
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
