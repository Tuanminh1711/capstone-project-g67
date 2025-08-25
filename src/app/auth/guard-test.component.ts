import { Component, OnInit } from '@angular/core';
import { CommonModule, JsonPipe } from '@angular/common';
import { AuthService } from './auth.service';
import { JwtUserUtilService } from './jwt-user-util.service';

@Component({
  selector: 'app-guard-test',
  standalone: true,
  imports: [CommonModule, JsonPipe],
  template: `
    <div class="guard-test">
      <h3>Guard Test Component</h3>
      <div class="status">
        <p><strong>Is Logged In:</strong> {{ isLoggedIn }}</p>
        <p><strong>Current Role:</strong> {{ currentRole }}</p>
        <p><strong>Has Auth Token:</strong> {{ hasAuthToken }}</p>
        <p><strong>Token Info:</strong> {{ tokenInfo | json }}</p>
      </div>
      
      <div class="actions">
        <button (click)="checkAuthStatus()">Check Auth Status</button>
        <button (click)="clearTokens()">Clear Tokens</button>
        <button (click)="goToProtectedRoute()">Go to Protected Route</button>
      </div>
    </div>
  `,
  styles: [`
    .guard-test {
      padding: 20px;
      border: 1px solid #ccc;
      margin: 20px;
      border-radius: 8px;
    }
    .status {
      background: #f5f5f5;
      padding: 15px;
      border-radius: 5px;
      margin: 15px 0;
    }
    .actions {
      display: flex;
      gap: 10px;
    }
    button {
      padding: 8px 16px;
      background: #007bff;
      color: white;
      border: none;
      border-radius: 4px;
      cursor: pointer;
    }
    button:hover {
      background: #0056b3;
    }
  `]
})
export class GuardTestComponent implements OnInit {
  isLoggedIn = false;
  currentRole = 'None';
  hasAuthToken = false;
  tokenInfo: any = null;

  constructor(
    private authService: AuthService,
    private jwtUtil: JwtUserUtilService
  ) {}

  ngOnInit() {
    this.checkAuthStatus();
  }

  checkAuthStatus() {
    this.isLoggedIn = this.authService.isLoggedIn();
    this.currentRole = this.authService.getCurrentUserRole() || 'None';
    this.hasAuthToken = this.jwtUtil.getAuthToken() !== null;
    this.tokenInfo = this.jwtUtil.getTokenInfo();
    
    console.log('Auth Status:', {
      isLoggedIn: this.isLoggedIn,
      currentRole: this.currentRole,
      hasAuthToken: this.hasAuthToken,
      tokenInfo: this.tokenInfo
    });
  }

  clearTokens() {
    // Xóa tokens để test guard
    localStorage.clear();
    sessionStorage.clear();
    document.cookie.split(";").forEach(function(c) { 
      document.cookie = c.replace(/^ +/, "").replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/"); 
    });
    this.checkAuthStatus();
  }

  goToProtectedRoute() {
    // Test truy cập route được bảo vệ
    window.location.href = '/view-user-profile';
  }
}
