import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TopNavigatorComponent } from '../../../shared/top-navigator/top-navigator.component';
import { HttpClient, HttpHeaders, HttpClientModule } from '@angular/common/http';
import { ToastService } from '../../../shared/toast/toast.service';
import { ConfigService } from '../../../shared/services/config.service';
import { AuthService } from '../../../auth/auth.service';
import { CookieService } from '../../../auth/cookie.service';

interface PlantIdentificationResult {
  scientificName: string;
  commonName: string;
  vietnameseName: string;
  confidence: number;
  description: string;
  careInstructions: string | null;
  imageUrl: string | null;
  isExactMatch: boolean;
  plantId: number | null;
}

interface PlantIdentificationResponse {
  status: number;
  message: string;
  data: {
    requestId: string;
    results: PlantIdentificationResult[];
    status: string;
    message: string;
  };
}

@Component({
  selector: 'app-ai-plant',
  standalone: true,
  imports: [CommonModule, FormsModule, TopNavigatorComponent, HttpClientModule],
  templateUrl: './ai-plant.component.html',
  styleUrls: ['./ai-plant.component.scss']
})
export class AiPlantComponent implements OnInit {
  selectedFile: File | null = null;
  searchQuery: string = '';
  isLoading: boolean = false;
  isValidating: boolean = false;
  results: PlantIdentificationResult[] = [];
  maxResults: number = 5;
  language: string = 'vi';
  previewUrl: string | null = null;
  activeTab: 'upload' | 'search' = 'upload';
  hasSearched: boolean = false; // Track if user has performed search/identification

  constructor(
    private http: HttpClient,
    private toastService: ToastService,
    private configService: ConfigService,
    private cdr: ChangeDetectorRef,
    private authService: AuthService,
    private cookieService: CookieService
  ) {}

  /**
   * Get correct API endpoint based on environment
   */
  private getApiEndpoint(path: string): string {
    // In development: apiUrl = '/api', so /api + /ai/identify-plant = /api/ai/identify-plant
    // In production: apiUrl = 'https://plantcare.id.vn', so https://plantcare.id.vn + /api + /ai/identify-plant
    const baseUrl = this.configService.apiUrl;
    
    // If apiUrl already contains '/api' (development), don't add it again
    if (baseUrl.endsWith('/api')) {
      return `${baseUrl}${path}`;
    } else {
      // Production: add /api prefix
      return `${baseUrl}/api${path}`;
    }
  }

  ngOnInit() {
    // Check if user is VIP
    if (!this.authService.isLoggedIn()) {
      this.toastService.show('Vui lòng đăng nhập để sử dụng tính năng này', 'error');
      return;
    }

    // Debug: Check user role and token
    const role = this.authService.getCurrentUserRole();
    const userId = this.authService.getCurrentUserId();
    const token = this.cookieService.getCookie('auth_token');
    
    // Decode JWT to check algorithm and claims
    if (token) {
      try {
        const base64Url = token.split('.')[0];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const header = JSON.parse(window.atob(base64));
        
        const base64Payload = token.split('.')[1];
        const base64PayloadDecoded = base64Payload.replace(/-/g, '+').replace(/_/g, '/');
        const payload = JSON.parse(window.atob(base64PayloadDecoded));
        
        // JWT Debug info removed for security
      } catch (e) {
        // JWT decode error handled
      }
    }
    
    // Debug info removed for security

    if (role !== 'VIP' && role !== 'EXPERT') {
      this.toastService.show(`Tính năng này chỉ dành cho VIP. Quyền hiện tại: ${role}`, 'error');
    }
  }

  private getAuthHeaders(): HttpHeaders {
    const token = this.cookieService.getCookie('auth_token');
    return new HttpHeaders({
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    });
  }

  private getAuthHeadersForFormData(): HttpHeaders {
    const token = this.cookieService.getCookie('auth_token');
    // Creating FormData headers with token
    
    if (!token) {
      return new HttpHeaders();
    }
    
    return new HttpHeaders({
      'Authorization': `Bearer ${token}`
      // Don't set Content-Type for FormData, let browser set it with boundary
    });
  }

  onFileSelected(event: any) {
    const file = event.target.files[0];
    if (file) {
      const maxFileSize = 20 * 1024 * 1024; // 20MB
      if (file.size > maxFileSize) {
        this.toastService.show('Kích thước ảnh vượt quá 20MB. Vui lòng chọn ảnh nhỏ hơn 20MB.', 'error');
        return;
      }
      this.selectedFile = file;
      this.isValidating = true; // Start validation immediately
      // Create preview
      const reader = new FileReader();
      reader.onload = () => {
        this.previewUrl = reader.result as string;
        this.cdr.detectChanges(); // Force change detection
        // Validate if image contains a plant after preview is loaded
        this.validatePlantImage();
        // Fallback: Clear validation after preview is ready
        setTimeout(() => {
          if (this.isValidating) {
            this.isValidating = false;
            this.cdr.detectChanges();
            // Fallback: Cleared validation loading state
          }
        }, 2000); // 2 second fallback
      };
      reader.readAsDataURL(file);
    }
  }

  removeFile() {
    this.selectedFile = null;
    this.previewUrl = null;
    this.results = [];
    this.hasSearched = false; // Reset search state
    this.cdr.detectChanges(); // Force change detection
  }

  validatePlantImage() {
    if (!this.selectedFile) return;

    const formData = new FormData();
    formData.append('image', this.selectedFile);

    // Set a timeout to clear validation state if API takes too long
    const timeout = setTimeout(() => {
      this.isValidating = false;
      this.cdr.detectChanges();
      // Validation timeout - clearing loading state
    }, 3000); // 3 second timeout - much shorter

    this.http.post<any>(this.getApiEndpoint('/ai/validate-plant-image'), formData, { 
      headers: this.getAuthHeadersForFormData() 
    })
      .subscribe({
        next: (response) => {
          clearTimeout(timeout);
          this.isValidating = false;
          // Validation response received
          if (!response.data && response.data !== true) {
            this.toastService.show('Hình ảnh này có thể không chứa cây trồng. Bạn vẫn có thể tiếp tục nhận diện.', 'warning');
          }
          this.cdr.detectChanges(); // Ensure UI updates
        },
        error: (error) => {
          clearTimeout(timeout);
          this.isValidating = false;
          // Don't show error for validation failure, just continue
          this.cdr.detectChanges(); // Ensure UI updates even on error
        }
      });
  }

  identifyPlant() {
    if (!this.selectedFile) {
      this.toastService.show('Vui lòng chọn hình ảnh', 'error');
      return;
    }

    this.isLoading = true;
    this.hasSearched = true; // Mark that user has attempted identification
    const formData = new FormData();
    formData.append('image', this.selectedFile);
    formData.append('language', this.language);
    formData.append('maxResults', this.maxResults.toString());
    
    // Add userId from auth service - convert to string for FormData
    const userId = this.authService.getCurrentUserId();
    if (userId) {
      formData.append('userId', userId.toString());
      // Adding userId to FormData
    } else {
      this.toastService.show('Phiên đăng nhập hết hạn. Vui lòng đăng nhập lại.', 'error');
      this.isLoading = false;
      return;
    }

    // Making request with auth headers

    this.http.post<any>(this.getApiEndpoint('/ai/identify-plant'), formData, { 
      headers: this.getAuthHeadersForFormData() 
    })
      .subscribe({
        next: (response) => {
          this.isLoading = false;
          // Full response received
          setTimeout(() => {
            // Kiểm tra response status và data
            if (response.status === 200 && response.data && response.data.results) {
              this.results = response.data.results;
              if (this.results.length === 0) {
                this.toastService.show('Không thể nhận diện cây từ hình ảnh này', 'warning');
              } else {
                this.toastService.show('Nhận diện cây thành công!', 'success');
              }
            } else {
              this.toastService.show(response.message || 'Có lỗi xảy ra khi nhận diện cây', 'error');
            }
            this.cdr.detectChanges();
          }, 0);
        },
        error: (error) => {
          this.isLoading = false;
          
          setTimeout(() => {
            if (error.status === 403) {
              // Check if it's JWT/auth issue
              if (error.error && error.error.message) {
                this.toastService.show(`Lỗi xác thực: ${error.error.message}`, 'error');
              } else {
                this.toastService.show('Tính năng AI nhận diện cây chỉ dành cho tài khoản VIP', 'error');
              }
            } else if (error.status === 404) {
              this.toastService.show('API endpoint không tìm thấy', 'error');
            } else if (error.status === 401) {
              this.toastService.show('Token hết hạn hoặc không hợp lệ', 'error');
            } else if (error.status === 500) {
              this.toastService.show('Lỗi server, có thể do JWT algorithm không match', 'error');
            } else {
              this.toastService.show('Có lỗi xảy ra khi nhận diện cây', 'error');
            }
            this.cdr.detectChanges();
          }, 0);
        }
      });
  }

  searchPlantsInDatabase() {
    if (!this.searchQuery.trim()) {
      this.toastService.show('Vui lòng nhập tên cây cần tìm', 'error');
      return;
    }

    this.isLoading = true;
    this.hasSearched = true; // Mark that user has attempted search

    this.http.get<any>(this.getApiEndpoint(`/ai/search-plants?plantName=${encodeURIComponent(this.searchQuery)}`), { 
      headers: this.getAuthHeaders() 
    })
      .subscribe({
        next: (response) => {
          this.isLoading = false;
          // Search response received
          
          // Use setTimeout to avoid ExpressionChangedAfterItHasBeenCheckedError
          setTimeout(() => {
            if (response.status === 200 && response.data) {
              this.results = response.data.results || [];
              if (this.results.length === 0) {
                this.toastService.show('Không tìm thấy cây nào phù hợp', 'warning');
              } else {
                this.toastService.show('Tìm kiếm thành công!', 'success');
              }
            } else {
              this.toastService.show(response.message || 'Có lỗi xảy ra khi tìm kiếm', 'error');
            }
            this.cdr.detectChanges();
          }, 0);
        },
        error: (error) => {
          this.isLoading = false;
          setTimeout(() => {
            this.toastService.show('Có lỗi xảy ra khi tìm kiếm cây', 'error');
            this.cdr.detectChanges();
          }, 0);
        }
      });
  }

  setActiveTab(tab: 'upload' | 'search') {
    this.activeTab = tab;
    this.results = [];
    this.hasSearched = false; // Reset search state when switching tabs
    if (tab === 'search') {
      this.removeFile();
    } else {
      this.searchQuery = '';
    }
    this.cdr.detectChanges(); // Force change detection
  }

  getConfidenceColor(confidence: number): string {
    if (confidence >= 0.8) return '#4CAF50'; // Green
    if (confidence >= 0.6) return '#FF9800'; // Orange  
    return '#F44336'; // Red
  }

  getConfidenceText(confidence: number): string {
    if (confidence >= 0.8) return 'Cao';
    if (confidence >= 0.6) return 'Trung bình';
    return 'Thấp';
  }

  shouldShowEmptyState(): boolean {
    // Only show empty state if user has searched/identified but got no results
    return this.hasSearched && this.results.length === 0 && !this.isLoading && !this.isValidating;
  }

  /**
   * Test JWT validation with backend
   */
  testJwtValidation() {
    const token = this.cookieService.getCookie('auth_token');
    // Testing JWT with backend
    
    this.http.get(this.getApiEndpoint('/ai/test-api-key'), {
      headers: this.getAuthHeaders()
    }).subscribe({
      next: (response) => {
        // JWT test passed
        this.toastService.show('JWT validation thành công', 'success');
      },
      error: (error) => {
        this.toastService.show(`JWT validation thất bại: ${error.status}`, 'error');
      }
    });
  }
}
