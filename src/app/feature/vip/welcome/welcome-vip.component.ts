import { Component } from '@angular/core';
import { TopNavigatorComponent } from '../../../shared/top-navigator/top-navigator.component';
import { FooterComponent } from '../../../shared/footer/footer.component';
import { Router } from '@angular/router';

@Component({
  selector: 'app-welcome-vip',
  standalone: true,
  templateUrl: './welcome-vip.component.html',
  styleUrls: ['./welcome-vip.component.scss'],
  imports: [TopNavigatorComponent]
})
export class WelcomeVipComponent {
  constructor(private router: Router) {}

  goToChat() {
    this.router.navigate(['/vip/chat']);
  }

  goToAiPlant() {
    this.router.navigate(['/vip/ai-plant']);
  }
  
  goToDiseaseDetection() {
    this.router.navigate(['/vip/disease-detection']);
  }

  goToChatPrivate() {
    this.router.navigate(['/vip/chat/chat-private']);
  }

  shareOnFacebook() {
    const url = encodeURIComponent(window.location.href);
    const text = encodeURIComponent('Tôi vừa nâng cấp VIP trên PlantCare! Khám phá các tính năng AI tuyệt vời ngay thôi! 🌱✨');
    const facebookUrl = `https://www.facebook.com/sharer/sharer.php?u=${url}&quote=${text}`;
    window.open(facebookUrl, '_blank', 'width=600,height=400');
  }

  shareOnZalo() {
    const url = encodeURIComponent(window.location.href);
    const text = encodeURIComponent('Tôi vừa nâng cấp VIP trên PlantCare! Khám phá các tính năng AI tuyệt vời ngay thôi! 🌱✨');
    const zaloUrl = `https://zalo.me/share?u=${url}&t=${text}`;
    window.open(zaloUrl, '_blank', 'width=600,height=400');
  }
}
