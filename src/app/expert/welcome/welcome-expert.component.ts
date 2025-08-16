import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { AuthService } from '../../auth/auth.service';
import { UrlService } from '../../shared/services/url.service';

@Component({
  selector: 'app-welcome-expert',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './welcome-expert.component.html',
  styleUrls: ['./welcome-expert.component.scss']
})
export class WelcomeExpertComponent implements OnInit {
  userName: string = 'Expert';
  currentTime: string = '';

  constructor(
    private router: Router,
    private authService: AuthService,
    private http: HttpClient,
    private urlService: UrlService
  ) {}

  ngOnInit(): void {
    this.loadUserName();
    this.updateCurrentTime();
    // Update time every minute
    setInterval(() => this.updateCurrentTime(), 60000);
  }

  private loadUserName(): void {
    const userId = this.authService.getCurrentUserId();
    const username = this.authService.getCurrentUsername();
    
    if (username) {
      this.userName = username;
    } else if (userId) {
      this.http.get<any>(`${this.urlService.getApiBaseUrl()}/profile/${userId}`).subscribe({
        next: (profile) => {
          this.userName = profile.name || profile.username || 'Expert';
        },
        error: () => {
          this.userName = 'Expert';
        }
      });
    } else {
      this.userName = 'Expert';
    }
  }

  private updateCurrentTime(): void {
    const now = new Date();
    const hour = now.getHours();
    
    if (hour < 12) {
      this.currentTime = 'Chào buổi sáng';
    } else if (hour < 18) {
      this.currentTime = 'Chào buổi chiều';
    } else {
      this.currentTime = 'Chào buổi tối';
    }
  }

  navigateToChat(): void {
    this.router.navigate(['/expert/chat']);
  }

  navigateToArticles(): void {
    this.router.navigate(['/expert/articles']);
  }

  navigateToPlantManager(): void {
    this.router.navigate(['/expert/plant-manager']);
  }
}
