import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { ConfigService } from '../../../shared/config.service';
import { AdminLayoutComponent } from '../../../shared/admin-layout/admin-layout.component';

@Component({
  selector: 'app-total-users-statistics',
  standalone: true,
  imports: [CommonModule, AdminLayoutComponent],
  templateUrl: './total-users.component.html',
  styleUrls: ['./total-users.component.scss']
})
export class TotalUsersStatisticsComponent implements OnInit {
  totalUsers: number | null = null;
  loading = false;
  errorMsg = '';

  private http = inject(HttpClient);
  private configService = inject(ConfigService);

  ngOnInit(): void {
    this.fetchTotalUsers();
  }

  fetchTotalUsers() {
    this.loading = true;
    this.errorMsg = '';
    const apiUrl = (this.configService as any).apiUrl || '';
    const url = `${apiUrl}/users/count`;
    this.http.get<{ total: number }>(url).subscribe({
      next: (res) => {
        this.totalUsers = res.total;
        this.loading = false;
      },
      error: (err) => {
        this.errorMsg = 'Không thể tải tổng số người dùng.';
        this.loading = false;
      }
    });
  }
}