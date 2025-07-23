import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { ConfigService } from '../../../shared/config.service';
import { AdminLayoutComponent } from '../../../shared/admin-layout/admin-layout.component';
import { TotalUsersChartComponent } from './total-users-chart.component';

@Component({
  selector: 'app-total-users-statistics',
  standalone: true,
  imports: [CommonModule, TotalUsersChartComponent],
  templateUrl: './total-users.component.html',
  styleUrls: ['./total-users.component.scss']
})
export class TotalUsersStatisticsComponent implements OnInit {
  totalUsers: number | null = null;
  dailyTotals: Array<{ date: string; totalRegistered: number }> = [];
  loading = false;
  errorMsg = '';
  today: Date = new Date();

  private http = inject(HttpClient);
  private configService = inject(ConfigService);

  ngOnInit(): void {
    this.fetchTotalUsers();
  }

  fetchTotalUsers() {
    this.loading = true;
    this.errorMsg = '';
    const apiUrl = (this.configService as any).baseUrl || '';
    const url = `${apiUrl}/api/admin/statistics/registered-users`;
    const body = {
      startDate: '2024-06-01T00:00:00',
      endDate: '2025-10-30T23:59:59'
    };
    this.http.post<Array<{ date: string; totalRegistered: number }>>(url, body).subscribe({
      next: (res) => {
        this.dailyTotals = res;
        this.totalUsers = res.reduce((sum, item) => sum + item.totalRegistered, 0);
        this.loading = false;
      },
      error: (err) => {
        this.errorMsg = 'Không thể tải tổng số người dùng.';
        this.loading = false;
      }
    });
  }
}