import { environment } from '../../../environments/environment';
import { Component, OnInit, ChangeDetectorRef, Inject, PLATFORM_ID, NgZone, ApplicationRef, AfterViewInit } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { TopNavigatorComponent } from '../../shared/top-navigator/index';
import { UserProfileService, UserProfile } from './user-profile.service';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../auth/auth.service';
import { JwtUserUtilService } from '../../auth/jwt-user-util.service';
import { ToastService } from '../../shared/toast/toast.service';
import { RouterModule, Router } from '@angular/router';

@Component({
  selector: 'app-view-user-profile',
  standalone: true,
  imports: [TopNavigatorComponent, CommonModule, RouterModule],
  templateUrl: './view-user-profile.html',
  styleUrl: './view-user-profile.scss'
})
export class ViewUserProfileComponent implements OnInit, AfterViewInit {
  // Property trực tiếp để binding
  userProfile: UserProfile | null = null;
  
  // Trạng thái loading và error
  loading = true;
  error: string | null = null;

  constructor(
    private userProfileService: UserProfileService,
    private authService: AuthService,
    private jwtUserUtil: JwtUserUtilService,
    private toastService: ToastService,
    private router: Router,
    private cdr: ChangeDetectorRef,
    private ngZone: NgZone,
    private appRef: ApplicationRef,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {}

  ngOnInit() {
    // Load profile immediately on component init
    this.loadUserProfile();
  }

  ngAfterViewInit() {
    // Force load again after view init for SSR hydration
    if (isPlatformBrowser(this.platformId)) {
      setTimeout(() => {
        if (!this.userProfile) {
          this.loadUserProfile();
        }
      }, 100);
    }
  }

  private loadUserProfile() {
    this.loading = true;
    this.error = null;
    this.cdr.detectChanges();
    
    // Kiểm tra xem có token không
    const token = this.jwtUserUtil.getTokenInfo();
    if (!token) {
      this.error = 'Không thể xác thực người dùng. Vui lòng đăng nhập lại.';
      this.loading = false;
      this.cdr.detectChanges();
      return;
    }
    
    // Gọi API mới không cần truyền userId (sẽ lấy từ JWT token)
    this.fetchUserProfile();
  }

  private fetchUserProfile() {
    this.userProfileService.getUserProfile().subscribe({
      next: (profile) => {
        this.userProfile = profile;
        this.error = null;
        this.loading = false;
        // Force change detection
        this.cdr.markForCheck();
        this.cdr.detectChanges();
      },
      error: (error) => {
        this.loading = false;
        
        // Xử lý lỗi dựa trên status code
        if (error.status === 0) {
          this.error = 'Không thể kết nối đến server. Vui lòng kiểm tra kết nối mạng.';
        } else if (error.status === 401) {
          this.error = 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.';
        } else if (error.status === 403) {
          this.error = 'Bạn không có quyền truy cập thông tin này.';
        } else if (error.status === 404) {
          this.error = 'Không tìm thấy thông tin người dùng.';
        } else if (error.status === 500) {
          this.error = 'Lỗi server. API chưa sẵn sáng hoặc có lỗi xử lý. Vui lòng thử lại sau.';
        } else {
          // Sử dụng error message từ service nếu có
          this.error = error.userMessage || 'Không thể tải thông tin người dùng. Vui lòng thử lại sau.';
        }
        
        // Ensure we only pass string to toast service
        if (this.error) {
          this.toastService.error(this.error);
        }
        this.userProfile = null;
        // Force change detection immediately
        this.cdr.markForCheck();
        this.cdr.detectChanges();
      }
    });
  }

  onAvatarChange(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      const file = input.files[0];
      const reader = new FileReader();
      reader.onload = (e: any) => {
        if (this.userProfile) {
          this.userProfile = { ...this.userProfile, avatar: e.target.result };
          this.cdr.detectChanges();
        }
      };
      reader.readAsDataURL(file);
    }
  }

  // Thêm method retry để user có thể thử lại
  retryLoadProfile() {
    this.loadUserProfile();
  }

  getGenderText(gender?: string): string {
    switch (gender) {
      case 'MALE':
        return 'Nam';
      case 'FEMALE':
        return 'Nữ';
      case 'OTHER':
        return 'Khác';
      default:
        return 'Chưa cập nhật';
    }
  }

  formatJoinDate(): string {
    // Since we don't have join date from API, return a default
    return 'Thành viên từ 2024';
  }

  getAvatarUrl(avatar: string): string {
    if (!avatar) return '';
    if (avatar.startsWith('http')) return avatar;
    // Nếu chỉ là tên file, trả về đúng API lấy avatar
    // Use environment.baseUrl for avatar URL
    return `${environment.baseUrl}/api/user/avatars/${avatar}`;
  }

  onAvatarError(event: Event) {
    (event.target as HTMLImageElement).src = 'assets/image/default-plant.png';
  }
}
