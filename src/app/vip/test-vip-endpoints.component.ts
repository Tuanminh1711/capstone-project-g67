import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { AuthService } from '../auth/auth.service';
import { CookieService } from '../auth/cookie.service';
import { ToastService } from '../shared/toast/toast.service';
import { ConfigService } from '../shared/config.service';

@Component({
  selector: 'app-test-vip-endpoints',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="test-container">
      <h2>🧪 VIP Endpoints Test</h2>
      
      <div class="user-info">
        <h3>👤 User Info</h3>
        <p><strong>Role:</strong> {{ userRole || 'Not available' }}</p>
        <p><strong>User ID:</strong> {{ userId || 'Not available' }}</p>
        <p><strong>Is Logged In:</strong> {{ isLoggedIn ? '✅' : '❌' }}</p>
        <p><strong>Has Token:</strong> {{ hasToken ? '✅' : '❌' }}</p>
      </div>

      <div class="api-tests">
        <h3>🔗 API Endpoint Tests</h3>
        
        <button (click)="testDiseaseDetectionEndpoints()" [disabled]="isLoading">
          {{ isLoading ? 'Testing...' : 'Test Disease Detection Endpoints' }}
        </button>
        
        <button (click)="testCommonDiseases()" [disabled]="isLoading">
          Test Common Diseases
        </button>

        <button (click)="testSearchDiseases()" [disabled]="isLoading">
          Test Search Diseases
        </button>

        <button (click)="testGetHistory()" [disabled]="isLoading">
          Test Detection History
        </button>
      </div>

      <div class="results" *ngIf="testResults.length > 0">
        <h3>📋 Test Results</h3>
        <div *ngFor="let result of testResults" class="test-result" [ngClass]="result.success ? 'success' : 'error'">
          <strong>{{ result.endpoint }}</strong>: {{ result.message }}
          <div *ngIf="result.details" class="details">{{ result.details | json }}</div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .test-container {
      padding: 20px;
      max-width: 800px;
      margin: 0 auto;
    }

    .user-info, .api-tests, .results {
      margin: 20px 0;
      padding: 15px;
      border: 1px solid #ddd;
      border-radius: 8px;
    }

    .user-info {
      background: #f0f8ff;
    }

    button {
      margin: 5px;
      padding: 10px 15px;
      background: #007bff;
      color: white;
      border: none;
      border-radius: 4px;
      cursor: pointer;
    }

    button:disabled {
      background: #ccc;
      cursor: not-allowed;
    }

    .test-result {
      margin: 10px 0;
      padding: 10px;
      border-radius: 4px;
    }

    .test-result.success {
      background: #d4edda;
      border: 1px solid #c3e6cb;
    }

    .test-result.error {
      background: #f8d7da;
      border: 1px solid #f5c6cb;
    }

    .details {
      font-family: monospace;
      font-size: 12px;
      margin-top: 5px;
      background: #f8f9fa;
      padding: 5px;
      border-radius: 3px;
    }
  `]
})
export class TestVipEndpointsComponent implements OnInit {
  userRole: string | null = null;
  userId: string | null = null;
  isLoggedIn: boolean = false;
  hasToken: boolean = false;
  isLoading: boolean = false;
  testResults: any[] = [];

  constructor(
    private http: HttpClient,
    private authService: AuthService,
    private cookieService: CookieService,
    private toastService: ToastService,
    private configService: ConfigService
  ) {}

  ngOnInit() {
    this.loadUserInfo();
  }

  loadUserInfo() {
    this.userRole = this.authService.getCurrentUserRole();
    this.userId = this.authService.getCurrentUserId();
    this.isLoggedIn = this.authService.isLoggedIn();
    this.hasToken = !!this.cookieService.getCookie('auth_token');
  }

  private getAuthHeaders(): HttpHeaders {
    const token = this.cookieService.getCookie('auth_token');
    return new HttpHeaders({
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    });
  }

  testDiseaseDetectionEndpoints() {
    this.isLoading = true;
    this.testResults = [];

    // Test base endpoint
    const baseUrl = `${this.configService.apiUrl}/api/vip/disease-detection`;
    
    // Test multiple endpoints
    const tests = [
      { endpoint: 'Search Diseases', url: `${baseUrl}/search?keyword=test` },
      { endpoint: 'Common Diseases', url: `${baseUrl}/common-diseases?plantType=tomato` },
      { endpoint: 'By Category', url: `${baseUrl}/by-category?category=fungal` },
      { endpoint: 'By Severity', url: `${baseUrl}/by-severity?severity=high` },
      { endpoint: 'Detection History', url: `${baseUrl}/history?page=0&size=5` }
    ];

    let completedTests = 0;

    tests.forEach(test => {
      this.http.get(test.url, { headers: this.getAuthHeaders() }).subscribe({
        next: (response) => {
          this.testResults.push({
            endpoint: test.endpoint,
            success: true,
            message: 'SUCCESS ✅',
            details: response
          });
          completedTests++;
          if (completedTests === tests.length) {
            this.isLoading = false;
          }
        },
        error: (error) => {
          this.testResults.push({
            endpoint: test.endpoint,
            success: false,
            message: `ERROR ❌ (${error.status || 'Network'})`,
            details: error.message || error
          });
          completedTests++;
          if (completedTests === tests.length) {
            this.isLoading = false;
          }
        }
      });
    });
  }

  testCommonDiseases() {
    this.isLoading = true;
    const url = `${this.configService.apiUrl}/api/vip/disease-detection/common-diseases?plantType=tomato`;
    
    this.http.get(url, { headers: this.getAuthHeaders() }).subscribe({
      next: (response) => {
        this.isLoading = false;
        this.toastService.show('Common diseases endpoint working!', 'success');
        console.log('Common diseases response:', response);
      },
      error: (error) => {
        this.isLoading = false;
        this.toastService.show(`Common diseases error: ${error.status}`, 'error');
        console.error('Common diseases error:', error);
      }
    });
  }

  testSearchDiseases() {
    this.isLoading = true;
    const url = `${this.configService.apiUrl}/api/vip/disease-detection/search?keyword=leaf`;
    
    this.http.get(url, { headers: this.getAuthHeaders() }).subscribe({
      next: (response) => {
        this.isLoading = false;
        this.toastService.show('Search diseases endpoint working!', 'success');
        console.log('Search diseases response:', response);
      },
      error: (error) => {
        this.isLoading = false;
        this.toastService.show(`Search diseases error: ${error.status}`, 'error');
        console.error('Search diseases error:', error);
      }
    });
  }

  testGetHistory() {
    this.isLoading = true;
    const url = `${this.configService.apiUrl}/api/vip/disease-detection/history?page=0&size=5`;
    
    this.http.get(url, { headers: this.getAuthHeaders() }).subscribe({
      next: (response) => {
        this.isLoading = false;
        this.toastService.show('Detection history endpoint working!', 'success');
        console.log('Detection history response:', response);
      },
      error: (error) => {
        this.isLoading = false;
        this.toastService.show(`Detection history error: ${error.status}`, 'error');
        console.error('Detection history error:', error);
      }
    });
  }
}
