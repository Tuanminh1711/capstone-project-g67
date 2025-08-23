import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-view-expert-profile',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './view-expert-profile.html',
  styleUrls: ['./view-expert-profile.scss']
})
export class ViewExpertProfileComponent implements OnInit {
  expert: any = null;
  loading = true;
  error = '';

  constructor(private route: ActivatedRoute, private http: HttpClient) {}

  ngOnInit() {
    // Luôn lấy profile của chính mình (giống phần edit)
    this.http.get('/api/user/profile', { withCredentials: true }).subscribe({
      next: (profile) => {
        this.expert = profile;
        this.loading = false;
      },
      error: (err) => {
        this.error = 'Không thể tải thông tin chuyên gia.';
        this.loading = false;
      }
    });
  }
}