import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { AuthService } from '../../auth/auth.service';
import { ExpertLayoutComponent } from '../shared/expert-layout/expert-layout.component';

@Component({
  selector: 'app-welcome-expert',
  standalone: true,
  imports: [CommonModule, ExpertLayoutComponent],
  templateUrl: './welcome-expert.component.html',
  styleUrls: ['./welcome-expert.component.scss']
})
export class WelcomeExpertComponent {
  constructor(
    private router: Router,
    private authService: AuthService
  ) {}

  navigateToChat(): void {
    this.router.navigate(['/expert/chat']);
  }
}
