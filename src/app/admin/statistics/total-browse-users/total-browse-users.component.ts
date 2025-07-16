import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { ConfigService } from '../../../shared/config.service';
import { AdminLayoutComponent } from '../../../shared/admin-layout/admin-layout.component';

@Component({
  selector: 'app-total-browse-users-statistics',
  standalone: true,
  imports: [CommonModule, AdminLayoutComponent],
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
    const url = `${apiUrl}/users/browse/count`;
    this.http.get<{ total: number }>(url).subscribe({
      next: (res) => {
        this.totalBrowseUsers = res.total;
        this.loading = false;
      },
      error: (err) => {
        this.errorMsg = 'Không thể tải tổng số người dùng truy cập.';
        this.loading = false;
      }
    });
  }
}