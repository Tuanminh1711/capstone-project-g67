import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { ConfigService } from '../../../shared/config.service';

@Component({
  selector: 'app-total-browse-users-statistics',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './total-browse-users.component.html',
  styleUrls: ['./total-browse-users.component.scss']
})
export class TotalBrowseUsersStatisticsComponent implements OnInit {
  totalBrowseUsers: number | null = null;
  loading = false;
  errorMsg = '';

  private http = inject(HttpClient);
  private configService = inject(ConfigService);

  ngOnInit(): void {
    this.fetchTotalBrowseUsers();
  }

  fetchTotalBrowseUsers() {
    this.loading = true;
    this.errorMsg = '';
    const apiUrl = (this.configService as any).apiUrl || '';
    const url = `${apiUrl}/admin/statistics/browse-users`;
    const body = {
      startDate: '2024-01-01T00:00:00',
      endDate: '2025-12-31T23:59:59'
    };
    this.http.post<any>(url, body).subscribe({
      next: (res) => {
        if (typeof res === 'string') {
          this.errorMsg = 'Phản hồi từ máy chủ không đúng định dạng!';
          this.totalBrowseUsers = null;
          this.loading = false;
          return;
        }
        if (res && Array.isArray(res.data)) {
          if (res.data.length === 0) {
            this.errorMsg = 'Không có dữ liệu thống kê người dùng truy cập.';
            this.totalBrowseUsers = 0;
          } else {
            this.totalBrowseUsers = res.data.reduce((sum: number, item: { totalActiveUsers: number }) => sum + (item.totalActiveUsers || 0), 0);
            this.errorMsg = '';
          }
        } else {
          this.errorMsg = 'Phản hồi từ máy chủ thiếu trường data hoặc không phải mảng!';
          this.totalBrowseUsers = 0;
        }
        this.loading = false;
      },
      error: (err) => {
        this.errorMsg = 'Lỗi khi tải dữ liệu thống kê người dùng truy cập!';
        this.totalBrowseUsers = null;
        this.loading = false;
      }
    });
  }
}