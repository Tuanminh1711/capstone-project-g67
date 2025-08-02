import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TopNavigatorComponent } from '../../shared/top-navigator/top-navigator.component';
import { HttpClient, HttpHeaders, HttpClientModule } from '@angular/common/http';
import { ToastService } from '../../shared/toast/toast.service';
import { ConfigService } from '../../shared/config.service';
import { AuthService } from '../../auth/auth.service';
import { CookieService } from '../../auth/cookie.service';

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

  ngOnInit() {
    // Check if user is VIP
    if (!this.authService.isLoggedIn()) {
      this.toastService.show('Vui lòng đăng nhập để sử dụng tính năng này', 'error');
      return;
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
    console.log('Token from cookie:', token); // Debug log
    return new HttpHeaders({
      'Authorization': `Bearer ${token}`
      // Don't set Content-Type for FormData, let browser set it with boundary
    });
  }

  onFileSelected(event: any) {
    const file = event.target.files[0];
    if (file) {
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
            console.log('Fallback: Cleared validation loading state');
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
      console.log('Validation timeout - clearing loading state');
    }, 3000); // 3 second timeout - much shorter

    this.http.post<any>(`${this.configService.apiUrl}/ai/validate-plant-image`, formData, { 
      headers: this.getAuthHeadersForFormData() 
    })
      .subscribe({
        next: (response) => {
          clearTimeout(timeout);
          this.isValidating = false;
          console.log('Validation response:', response); // Debug log
          if (!response.data && response.data !== true) {
            this.toastService.show('Hình ảnh này có thể không chứa cây trồng. Bạn vẫn có thể tiếp tục nhận diện.', 'warning');
          }
          this.cdr.detectChanges(); // Ensure UI updates
        },
        error: (error) => {
          clearTimeout(timeout);
          this.isValidating = false;
          console.error('Error validating image:', error);
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

    this.http.post<any>(`${this.configService.apiUrl}/ai/identify-plant`, formData, { 
      headers: this.getAuthHeadersForFormData() 
    })
      .subscribe({
        next: (response) => {
          this.isLoading = false;
          console.log('Full response:', response); // Debug log để xem cấu trúc response
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
              console.log('Response not matching expected format:', response);
              this.toastService.show(response.message || 'Có lỗi xảy ra khi nhận diện cây', 'error');
            }
            this.cdr.detectChanges();
          }, 0);
        },
        error: (error) => {
          this.isLoading = false;
          setTimeout(() => {
            if (error.status === 403) {
              this.toastService.show('Tính năng AI nhận diện cây chỉ dành cho tài khoản VIP', 'error');
            } else {
              this.toastService.show('Có lỗi xảy ra khi nhận diện cây', 'error');
            }
            console.error('Error identifying plant:', error);
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

    this.http.get<any>(`${this.configService.apiUrl}/ai/search-plants?plantName=${encodeURIComponent(this.searchQuery)}`, { 
      headers: this.getAuthHeaders() 
    })
      .subscribe({
        next: (response) => {
          this.isLoading = false;
          console.log('Search response:', response); // Debug log
          
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
            console.error('Error searching plants:', error);
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
}
