import { Component, OnInit, ChangeDetectorRef, Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { TopNavigatorComponent } from '../../shared/top-navigator/index';
import { UserProfileService, UserProfile } from './user-profile.service';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../auth/auth.service';
import { JwtUserUtilService } from '../../auth/jwt-user-util.service';
import { RouterModule, Router } from '@angular/router';

@Component({
  selector: 'app-view-user-profile',
  standalone: true,
  imports: [TopNavigatorComponent, CommonModule, RouterModule],
  templateUrl: './view-user-profile.html',
  styleUrl: './view-user-profile.scss'
})
export class ViewUserProfileComponent implements OnInit {
  // Property trực tiếp để binding
  userProfile: UserProfile | null = null;
  
  // Trạng thái loading và error
  loading = true;
  error: string | null = null;

  constructor(
    private userProfileService: UserProfileService,
    private authService: AuthService,
    private jwtUserUtil: JwtUserUtilService,
    private router: Router,
    private cdr: ChangeDetectorRef,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {}

  ngOnInit() {
    console.log('🚀 ViewUserProfile ngOnInit called');
    
    // Debug token information
    const token = this.jwtUserUtil.getTokenInfo();
    console.log('🔑 Token info:', token);
    
    const userId = this.jwtUserUtil.getUserIdFromToken();
    console.log('👤 User ID from JWT:', userId);
    
    const isLoggedIn = this.authService.isLoggedIn();
    console.log('🔐 Is logged in:', isLoggedIn);
    
    this.loadUserProfile();
  }

  private loadUserProfile() {
    console.log('🔄 Loading user profile...');
    this.loading = true;
    this.error = null;
    this.cdr.detectChanges();
    
    // Debug cookie information (chỉ ở browser)
    if (isPlatformBrowser(this.platformId)) {
      const authCookie = document.cookie.split(';').find(c => c.trim().startsWith('auth_token='));
      console.log('🍪 Auth cookie exists:', !!authCookie);
    }
    
    // Lấy user ID từ token
    const userId = this.jwtUserUtil.getUserIdFromToken();
    console.log('👤 User ID from token:', userId);
    
    if (!userId) {
      console.log('❌ No user ID found in token');
      this.error = 'Không thể xác thực người dùng. Vui lòng đăng nhập lại.';
      this.loading = false;
      this.cdr.detectChanges();
      return;
    }
    
    // Gọi API để lấy thông tin profile
    this.fetchUserProfile(Number(userId));
  }

  private fetchUserProfile(userId: number) {
    console.log('📡 Fetching profile for user ID:', userId);
    
    this.userProfileService.getUserProfile(userId).subscribe({
      next: (profile) => {
        console.log('✅ Profile loaded successfully:', profile);
        this.userProfile = profile;
        this.error = null;
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: (error) => {
        console.error('❌ Profile loading error:', error);
        this.loading = false;
        
        if (error.status === 0) {
          this.error = 'Không thể kết nối đến server. Vui lòng kiểm tra kết nối mạng.';
        } else if (error.status === 401) {
          this.error = 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.';
          // Không logout tự động, để user tự quyết định
        } else if (error.status === 403) {
          this.error = 'Bạn không có quyền truy cập thông tin này.';
        } else if (error.status === 404) {
          this.error = 'Không tìm thấy thông tin người dùng.';
        } else if (error.status >= 500) {
          this.error = 'Lỗi server. Vui lòng thử lại sau.';
        } else {
          this.error = error.error?.message || error.userMessage || 'Không thể tải thông tin người dùng. Vui lòng thử lại sau.';
        }
        
        this.userProfile = null;
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
    console.log('🔄 Retrying to load profile...');
    this.checkAuthState(); // Debug auth state trước khi retry
    this.loadUserProfile();
  }

  // Debug method để kiểm tra authentication state
  checkAuthState() {
    console.log('=== AUTH STATE DEBUG ===');
    
    // Chỉ log cookies ở browser
    if (isPlatformBrowser(this.platformId)) {
      console.log('🍪 All cookies:', document.cookie);
    } else {
      console.log('🍪 Running on server, no cookies available');
    }
    
    console.log('🔐 AuthService isLoggedIn():', this.authService.isLoggedIn());
    console.log('🔑 JWT isLoggedIn():', this.jwtUserUtil.isLoggedIn());
    
    const tokenInfo = this.jwtUserUtil.getTokenInfo();
    console.log('📄 Token info:', tokenInfo);
    
    const userId = this.jwtUserUtil.getUserIdFromToken();
    console.log('👤 User ID:', userId);
    
    const role = this.jwtUserUtil.getRoleFromToken();
    console.log('👮 Role:', role);
    console.log('=== END AUTH DEBUG ===');
  }
}
