import { Component, OnInit } from '@angular/core';
import { TopNavigatorComponent } from '../../shared/top-navigator/index';
import { AuthService } from '../../auth/auth.service';
import { HttpErrorResponse } from '@angular/common/http';
import { NgIf } from '@angular/common';

@Component({
  selector: 'app-view-user-profile',
  standalone: true,
  imports: [TopNavigatorComponent, NgIf],
  templateUrl: './view-user-profile.html',
  styleUrl: './view-user-profile.scss'
})
export class ViewUserProfileComponent implements OnInit {
  user = {
    name: '',
    email: '',
    phone: '',
    avatar: '/assets/avatar-default.png',
    address: ''
  };
  loading = true;

  constructor(private authService: AuthService) {}

  ngOnInit() {
    this.authService.getProfile().subscribe({
      next: (data: any) => {
        this.user = {
          name: data?.fullName || '',
          email: data?.email || '',
          phone: data?.phone || '',
          avatar: data?.avatar || '/assets/avatar-default.png',
          address: data?.address || ''
        };
        this.loading = false;
      },
      error: (err: HttpErrorResponse) => {
        this.loading = false;
      }
    });
  }

  onAvatarChange(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      const file = input.files[0];
      const reader = new FileReader();
      reader.onload = (e: any) => {
        this.user.avatar = e.target.result;
      };
      reader.readAsDataURL(file);
      // TODO: Gọi API upload avatar nếu muốn lưu lên server
    }
  }
}
