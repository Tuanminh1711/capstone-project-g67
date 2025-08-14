import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { AuthService } from '../../auth/auth.service';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-welcome-expert',
  standalone: true,
  imports: [CommonModule, MatCardModule, MatButtonModule, MatIconModule, RouterModule],
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
