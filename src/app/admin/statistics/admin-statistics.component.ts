import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-admin-statistics',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './admin-statistics.component.html',
  styleUrls: ['./admin-statistics.component.scss']
})
export class AdminStatisticsComponent implements OnInit {
  loading = false;
  errorMsg = '';
  totalBrowseUsers: number|null = null;
  totalRegisteredUsers: number|null = null;
  totalAddedPlants: number|null = null;

  constructor(private http: HttpClient, private cdr: ChangeDetectorRef) {}

  ngOnInit() {
    this.fetchAllStatistics();
  }

  fetchAllStatistics() {
    this.loading = true;
    // Không reset số liệu về null khi loading, chỉ reset errorMsg
    this.errorMsg = '';
    const body = {
      startDate: '2024-01-01T00:00:00',
      endDate: '2025-12-31T23:59:59'
    };
    Promise.all([
      this.http.post<any>('/api/admin/statistics/browse-users', body).toPromise(),
      this.http.post<any>('/api/admin/statistics/registered-users', body).toPromise(),
      this.http.post<any>('/api/admin/statistics/added-plants', body).toPromise()
    ]).then(([browse, registered, added]) => {
      // Tổng số người dùng đã truy cập: cộng dồn totalActiveUsers trong mảng data
      this.totalBrowseUsers = Array.isArray(browse?.data)
        ? browse.data.reduce((sum: number, item: any) => sum + (item.totalActiveUsers || 0), 0)
        : null;
      // Tổng số người dùng đã đăng ký: cộng dồn totalRegistered hoặc total trong mảng data
      if (Array.isArray(registered?.data)) {
        const total = registered.data.reduce((sum: number, item: any) => {
          if (typeof item.totalRegistered === 'number' && !isNaN(item.totalRegistered)) {
            return sum + item.totalRegistered;
          }
          return sum;
        }, 0);
        this.totalRegisteredUsers = total;
      } else {
        this.totalRegisteredUsers = 0;
      }
      // Tổng số cây đã được thêm: cộng dồn totalAdded trong mảng data
      this.totalAddedPlants = Array.isArray(added?.data)
        ? added.data.reduce((sum: number, item: any) => sum + (item.totalAdded || 0), 0)
        : null;
      this.loading = false;
      this.cdr.detectChanges();
    }).catch(err => {
      this.errorMsg = 'Không thể tải thống kê.';
      this.loading = false;
    });
  }
}
