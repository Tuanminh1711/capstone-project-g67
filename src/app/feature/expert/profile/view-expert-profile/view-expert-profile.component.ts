import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { ExpertProfileService, ExpertProfile } from '../expert-profile.service';
import { CommonModule } from '@angular/common';
import { JwtUserUtilService } from '../../../../auth/jwt-user-util.service';
import { AuthDialogService } from '../../../../auth/auth-dialog.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-view-expert-profile',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './view-expert-profile.html',
  styleUrls: ['./view-expert-profile.scss']
})
export class ViewExpertProfileComponent implements OnInit {
  expert: ExpertProfile | null = null;
  loading = true;
  error = '';

  constructor(
    private expertProfileService: ExpertProfileService,
    private jwtUserUtil: JwtUserUtilService,
    private authDialogService: AuthDialogService,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit() {
    this.loadExpertProfile();
  }

  loadExpertProfile() {
    this.loading = true;
    this.error = '';
    
    const token = this.jwtUserUtil.getTokenInfo();
    if (!token) {
      this.error = 'Vui lòng đăng nhập để xem hồ sơ.';
      this.loading = false;
      this.cdr.markForCheck();
      return;
    }

    this.expertProfileService.getExpertProfile().subscribe({
      next: (profile) => {
        this.expert = profile;
        this.loading = false;
        this.cdr.markForCheck();
      },
      error: (err) => {
        if (err.status === 401) {
          this.error = 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.';
          this.showLoginDialog();
        } else {
          this.error = 'Không thể tải thông tin chuyên gia. Vui lòng thử lại.';
        }
        this.loading = false;
        this.cdr.markForCheck();
      }
    });
  }

  showLoginDialog() {
    this.authDialogService.openLoginDialog();
  }

  editProfile() {
    this.router.navigate(['/expert/profile/edit']);
  }

  getGenderText(gender: string | null): string {
    if (!gender) return 'Chưa cập nhật';
    switch (gender) {
      case 'MALE': return 'Nam';
      case 'FEMALE': return 'Nữ';
      case 'OTHER': return 'Khác';
      default: return 'Chưa cập nhật';
    }
  }
}