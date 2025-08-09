import { Component } from '@angular/core';
import { TopNavigatorComponent } from '../../shared/top-navigator/top-navigator.component';
import { FooterComponent } from '../../shared/footer/footer.component';
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
}
