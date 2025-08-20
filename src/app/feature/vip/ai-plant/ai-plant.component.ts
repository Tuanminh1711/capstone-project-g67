import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TopNavigatorComponent } from '../../../shared/top-navigator/top-navigator.component';
import {
  HttpClient,
  HttpHeaders,
  HttpClientModule,
} from '@angular/common/http';
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
  styleUrls: ['./ai-plant.component.scss'],
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
  showDebugInfo = false; // Debug info toggle

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
      this.toastService.show(
        'Vui lòng đăng nhập để sử dụng tính năng này',
        'error'
      );
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
        const base64PayloadDecoded = base64Payload
          .replace(/-/g, '+')
          .replace(/_/g, '/');
        const payload = JSON.parse(window.atob(base64PayloadDecoded));

        // JWT Debug info removed for security
      } catch (e) {
        // JWT decode error handled
      }
    }

    // Debug info removed for security

    if (role !== 'VIP' && role !== 'EXPERT') {
      this.toastService.show(
        `Tính năng này chỉ dành cho VIP. Quyền hiện tại: ${role}`,
        'error'
      );
    }
  }

  private getAuthHeaders(): HttpHeaders {
    const token = this.cookieService.getCookie('auth_token');
    return new HttpHeaders({
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    });
  }

  private getAuthHeadersForFormData(): HttpHeaders {
    const token = this.cookieService.getCookie('auth_token');
    // Creating FormData headers with token

    if (!token) {
      return new HttpHeaders();
    }

    return new HttpHeaders({
      Authorization: `Bearer ${token}`,
      // Don't set Content-Type for FormData, let browser set it with boundary
    });
  }

  onFileSelected(event: any) {
    const file = event.target.files[0];
    if (file) {
  // ...existing code...
      const maxFileSize = 20 * 1024 * 1024; // 20MB
      if (file.size > maxFileSize) {
        this.toastService.show(
          'Kích thước ảnh vượt quá 20MB. Vui lòng chọn ảnh nhỏ hơn 20MB.',
          'error'
        );
        return;
      }

  // ...existing code...

      // Kiểm tra và xử lý ảnh từ điện thoại
      this.processImageForUpload(file);
    }
  }

  private async processImageForUpload(file: File): Promise<void> {
    try {
      // THÊM: Kiểm tra resolution trước khi xử lý
      const imageInfo = await this.getImageDimensions(file);
      const maxPixels = 1920 * 1080; // ~2MP limit

      if (imageInfo.width * imageInfo.height > maxPixels) {
  // ...existing code...
        // THÊM: Resize ảnh nếu resolution quá lớn
        const resizedFile = await this.resizeImageToMaxResolution(
          file,
          maxPixels
        );
        this.selectedFile = resizedFile;
        this.createImagePreview(resizedFile);
      } else {
  // ...existing code...
        // Giữ nguyên logic cũ
        if (
          file.type === 'image/heic' ||
          file.type === 'image/heif' ||
          file.type === 'image/webp'
        ) {
          // Convert sang JPEG
          const convertedFile = await this.convertImageToJpeg(file);
          this.selectedFile = convertedFile;
          this.createImagePreview(convertedFile);
        } else if (file.type === 'image/jpeg' || file.type === 'image/png') {
          // Ảnh đã đúng định dạng
          this.selectedFile = file;
          this.createImagePreview(file);
        } else {
          // Thử convert sang JPEG
          const convertedFile = await this.convertImageToJpeg(file);
          this.selectedFile = convertedFile;
          this.createImagePreview(convertedFile);
        }
      }

      // Start validation after processing
      this.isValidating = true;
      this.validatePlantImage();
    } catch (error) {
  // ...existing code...
      this.toastService.show(
        'Không thể xử lý ảnh. Vui lòng chọn ảnh khác.',
        'error'
      );
    }
  }

  // THÊM: Lấy dimensions của ảnh
  private getImageDimensions(
    file: File
  ): Promise<{ width: number; height: number }> {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        resolve({ width: img.width, height: img.height });
      };
      img.src = URL.createObjectURL(file);
    });
  }

  // THÊM: Resize ảnh về resolution tối đa
  private async resizeImageToMaxResolution(
    file: File,
    maxPixels: number
  ): Promise<File> {
    return new Promise((resolve) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();

      img.onload = () => {
        let { width, height } = img;

  // ...existing code...

        // Tính toán tỷ lệ để giữ nguyên aspect ratio
        if (width * height > maxPixels) {
          const ratio = Math.sqrt(maxPixels / (width * height));
          width = Math.floor(width * ratio);
          height = Math.floor(height * ratio);
          // ...existing code...
        }

        canvas.width = width;
        canvas.height = height;
        ctx?.drawImage(img, 0, 0, width, height);

        canvas.toBlob(
          (blob) => {
            if (blob) {
              const resizedFile = new File([blob], file.name, {
                type: 'image/jpeg',
                lastModified: Date.now(),
              });
              // ...existing code...
              resolve(resizedFile);
            }
          },
          'image/jpeg',
          0.8
        );
      };

      img.src = URL.createObjectURL(file);
    });
  }

  private async convertImageToJpeg(file: File): Promise<File> {
    return new Promise((resolve, reject) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();

      img.onload = () => {
        // Set canvas size
        canvas.width = img.width;
        canvas.height = img.height;

        // Draw image to canvas
        ctx?.drawImage(img, 0, 0);

        // Convert to blob
        canvas.toBlob(
          (blob) => {
            if (blob) {
              // Create new file with JPEG type
              const convertedFile = new File(
                [blob],
                file.name.replace(/\.[^/.]+$/, '.jpg'),
                {
                  type: 'image/jpeg',
                  lastModified: Date.now(),
                }
              );
              resolve(convertedFile);
            } else {
              reject(new Error('Failed to convert image'));
            }
          },
          'image/jpeg',
          0.9
        ); // 90% quality
      };

      img.onerror = () => reject(new Error('Failed to load image'));
      img.src = URL.createObjectURL(file);
    });
  }

  private createImagePreview(file: File): void {
    const reader = new FileReader();
    reader.onload = () => {
      this.previewUrl = reader.result as string;
      this.cdr.detectChanges(); // Force change detection
    };
    reader.readAsDataURL(file);
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

    this.http
      .post<any>(this.getApiEndpoint('/ai/validate-plant-image'), formData, {
        headers: this.getAuthHeadersForFormData(),
      })
      .subscribe({
        next: (response) => {
          clearTimeout(timeout);
          this.isValidating = false;
          // Validation response received
          if (!response.data && response.data !== true) {
            this.toastService.show(
              'Hình ảnh này có thể không chứa cây trồng. Bạn vẫn có thể tiếp tục nhận diện.',
              'warning'
            );
          }
          this.cdr.detectChanges(); // Ensure UI updates
        },
        error: (error) => {
          clearTimeout(timeout);
          this.isValidating = false;
          // Don't show error for validation failure, just continue
          this.cdr.detectChanges(); // Ensure UI updates even on error
        },
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
  // ...existing code...
    } else {
      this.toastService.show(
        'Phiên đăng nhập hết hạn. Vui lòng đăng nhập lại.',
        'error'
      );
      this.isLoading = false;
      return;
    }

    // Log API endpoint
    const apiEndpoint = this.getApiEndpoint('/ai/identify-plant');
  // ...existing code...

    // Making request with auth headers
    this.http
      .post<any>(apiEndpoint, formData, {
        headers: this.getAuthHeadersForFormData(),
      })
      .subscribe({
        next: (response) => {
          this.isLoading = false;
          // ...existing code...

          // Full response received
          setTimeout(() => {
            // Kiểm tra response status và data
            if (
              response.status === 200 &&
              response.data &&
              response.data.results
            ) {
              this.results = response.data.results;
              if (this.results.length === 0) {
                this.toastService.show(
                  'Không thể nhận diện cây từ hình ảnh này',
                  'warning'
                );
              } else {
                this.toastService.show('Nhận diện cây thành công!', 'success');
              }
            } else {
              this.toastService.show(
                response.message || 'Có lỗi xảy ra khi nhận diện cây',
                'error'
              );
            }
            this.cdr.detectChanges();
          }, 0);
        },
        error: (error) => {
          this.isLoading = false;


          setTimeout(() => {
            let errorMessage = 'Có lỗi xảy ra khi nhận diện cây. ';

            if (error.status === 403) {
              // Check if it's JWT/auth issue
              if (error.error && error.error.message) {
                errorMessage += `Lỗi xác thực: ${error.error.message}`;
              } else {
                errorMessage +=
                  'Tính năng AI nhận diện cây chỉ dành cho tài khoản VIP';
              }
            } else if (error.status === 404) {
              errorMessage += 'API endpoint không tìm thấy';
            } else if (error.status === 401) {
              errorMessage += 'Token hết hạn hoặc không hợp lệ';
            } else if (error.status === 413) {
              errorMessage += 'Ảnh quá lớn. Vui lòng chọn ảnh nhỏ hơn.';
            } else if (error.status === 415) {
              errorMessage +=
                'Định dạng ảnh không được hỗ trợ. Vui lòng chọn ảnh JPG hoặc PNG.';
            } else if (error.status === 400) {
              // Kiểm tra response từ backend
              if (error.error && error.error.message) {
                errorMessage += error.error.message;
              } else {
                errorMessage += 'Dữ liệu ảnh không hợp lệ.';
              }
            } else if (error.status === 500) {
              // Kiểm tra response từ backend
              if (error.error && error.error.message) {
                errorMessage += error.error.message;
              } else {
                errorMessage += 'Lỗi server. Vui lòng thử lại sau.';
              }
            } else if (error.status === 0) {
              errorMessage +=
                'Không thể kết nối đến server. Vui lòng kiểm tra kết nối mạng.';
            } else if (error.name === 'TimeoutError') {
              errorMessage += 'Yêu cầu bị timeout. Vui lòng thử lại.';
            } else {
              // Kiểm tra response từ backend
              if (error.error && error.error.message) {
                errorMessage += error.error.message;
              } else {
                errorMessage += `Lỗi: ${error.message || 'Không xác định'}`;
              }
            }

            this.toastService.show(errorMessage, 'error');

            this.cdr.detectChanges();
          }, 0);
        },
      });
  }

  searchPlantsInDatabase() {
    if (!this.searchQuery.trim()) {
      this.toastService.show('Vui lòng nhập tên cây cần tìm', 'error');
      return;
    }

    this.isLoading = true;
    this.hasSearched = true; // Mark that user has attempted search

    this.http
      .get<any>(
        this.getApiEndpoint(
          `/ai/search-plants?plantName=${encodeURIComponent(this.searchQuery)}`
        ),
        {
          headers: this.getAuthHeaders(),
        }
      )
      .subscribe({
        next: (response) => {
          this.isLoading = false;
          // Search response received

          // Use setTimeout to avoid ExpressionChangedAfterItHasBeenCheckedError
          setTimeout(() => {
            if (response.status === 200 && response.data) {
              this.results = response.data.results || [];
              if (this.results.length === 0) {
                this.toastService.show(
                  'Không tìm thấy cây nào phù hợp',
                  'warning'
                );
              } else {
                this.toastService.show('Tìm kiếm thành công!', 'success');
              }
            } else {
              this.toastService.show(
                response.message || 'Có lỗi xảy ra khi tìm kiếm',
                'error'
              );
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
        },
      });
  }

  setActiveTab(tab: 'upload' | 'search') {
    this.activeTab = tab;
    this.cdr.detectChanges();
  }

  toggleDebugInfo(): void {
    this.showDebugInfo = !this.showDebugInfo;
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
    return (
      this.hasSearched &&
      this.results.length === 0 &&
      !this.isLoading &&
      !this.isValidating
    );
  }

  /**
   * Test JWT validation with backend
   */
  testJwtValidation() {
    const token = this.cookieService.getCookie('auth_token');
    // Testing JWT with backend

    this.http
      .get(this.getApiEndpoint('/ai/test-api-key'), {
        headers: this.getAuthHeaders(),
      })
      .subscribe({
        next: (response) => {
          // JWT test passed
          this.toastService.show('JWT validation thành công', 'success');
        },
        error: (error) => {
          this.toastService.show(
            `JWT validation thất bại: ${error.status}`,
            'error'
          );
        },
      });
  }

  /**
   * Test API connection for debugging
   */
  testApiConnection() {
  // ...existing code...

    // Test basic connectivity
    const testEndpoint = this.getApiEndpoint('/ai/test-connection');
    console.log('Testing endpoint:', testEndpoint);

    this.http
      .get(testEndpoint, {
        headers: this.getAuthHeaders(),
      })
      .subscribe({
        next: (response) => {
          console.log('API connection test successful:', response);
          this.toastService.show('API connection test thành công', 'success');
        },
        error: (error) => {
          console.error('API connection test failed:', error);
          this.toastService.show(
            `API connection test thất bại: ${error.status} - ${error.message}`,
            'error'
          );
        },
      });
  }
}
