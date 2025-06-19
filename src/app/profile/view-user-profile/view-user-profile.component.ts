import { Component, OnInit } from '@angular/core';
import { TopNavigatorComponent } from '../../shared/top-navigator/index';
import { UserProfileService, UserProfile } from '../user-profile.service';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../auth/auth.service';
import { JwtUserUtilService } from '../../auth/jwt-user-util.service';
import { CookieService } from 'ngx-cookie-service';
import { Observable, of } from 'rxjs';
import { catchError, finalize } from 'rxjs/operators';

@Component({
  selector: 'app-view-user-profile',
  standalone: true,
  imports: [TopNavigatorComponent, CommonModule],
  templateUrl: './view-user-profile.html',
  styleUrl: './view-user-profile.scss'
})
export class ViewUserProfileComponent implements OnInit {
  userProfile$!: Observable<UserProfile | null>;
  loading = true;

  constructor(
    private userProfileService: UserProfileService,
    private authService: AuthService,
    private cookieService: CookieService,
    private jwtUserUtil: JwtUserUtilService
  ) {}

  ngOnInit() {
    this.loading = true;
    const userId = this.jwtUserUtil.getUserIdFromToken();
    console.log('UserId from token (component):', userId);
    if (userId) {
      this.userProfile$ = this.userProfileService.getUserProfile(Number(userId)).pipe(
        finalize(() => this.loading = false)
      );
      this.userProfile$.subscribe(profile => {
        console.log('UserProfile observable emitted:', profile);
      });
    } else {
      this.userProfile$ = of(null);
      this.loading = false;
    }
  }

  onAvatarChange(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      const file = input.files[0];
      const reader = new FileReader();
      reader.onload = (e: any) => {
        // Avatar preview logic (optional)
      };
      reader.readAsDataURL(file);
      // TODO: Gọi API upload avatar nếu muốn lưu lên server
    }
  }
}
