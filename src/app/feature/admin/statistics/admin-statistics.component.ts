import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NgChartsModule } from 'ng2-charts';
import { ChartConfiguration } from 'chart.js';

interface StatisticRequest {
  startDate: string;
  endDate: string;
}
interface PlantAddedStatistic {
  date: string;
  totalAdded: number;
}
interface UserRegisterStatistic {
  date: string;
  totalRegistered: number;
}
interface UserBrowseStatistic {
  date: string;
  totalActiveUsers: number;
}

@Component({
  selector: 'app-admin-statistics',
  standalone: true,
  imports: [CommonModule, FormsModule, NgChartsModule],
  templateUrl: './admin-statistics.component.html',
  styleUrls: ['./admin-statistics.component.scss']
})
export class AdminStatisticsComponent implements OnInit {
  loading = false;
  errorMsg = '';
  startDate: string = '2024-01-01';
  endDate: string = '2025-12-31';

  // Dữ liệu cho biểu đồ
  browseUserStats: UserBrowseStatistic[] = [];
  registerUserStats: UserRegisterStatistic[] = [];
  addedPlantStats: PlantAddedStatistic[] = [];

  // Chart configs
  browseUsersChartData: ChartConfiguration<'bar'>['data'] = { labels: [], datasets: [] };
  registerUsersChartData: ChartConfiguration<'bar'>['data'] = { labels: [], datasets: [] };
  addedPlantsChartData: ChartConfiguration<'bar'>['data'] = { labels: [], datasets: [] };
  chartOptions: ChartConfiguration<'bar'>['options'] = {
    responsive: true,
    plugins: {
      legend: { display: false },
      title: { display: false },
      tooltip: { enabled: true }
    },
    scales: {
      x: { grid: { color: '#e0e7ef' }, ticks: { color: '#374151', font: { weight: 'bold' } } },
      y: { grid: { color: '#e0e7ef' }, ticks: { color: '#059669', font: { weight: 'bold' } } }
    }
  };

  constructor(private http: HttpClient, private cdr: ChangeDetectorRef) {}

  ngOnInit() {
    this.fetchAllStatistics();
  }

  fetchAllStatistics() {
    this.loading = true;
    this.errorMsg = '';
    const body: StatisticRequest = {
      startDate: this.startDate + 'T00:00:00',
      endDate: this.endDate + 'T23:59:59'
    };
    Promise.all([
      this.http.post<any>('/api/admin/statistics/browse-users', body).toPromise(),
      this.http.post<any>('/api/admin/statistics/registered-users', body).toPromise(),
      this.http.post<any>('/api/admin/statistics/added-plants', body).toPromise()
    ]).then(([browse, registered, added]) => {
      this.browseUserStats = Array.isArray(browse?.data) ? browse.data : [];
      this.registerUserStats = Array.isArray(registered?.data) ? registered.data : [];
      this.addedPlantStats = Array.isArray(added?.data) ? added.data : [];
      this.updateCharts();
      this.loading = false;
      this.cdr.detectChanges();
    }).catch(err => {
      this.errorMsg = 'Không thể tải thống kê.';
      this.loading = false;
    });
  }

  updateCharts() {
    // Format label date: dd/MM/yyyy
    const formatDate = (dateStr: string) => {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return dateStr;
      const day = d.getDate().toString().padStart(2, '0');
      const month = (d.getMonth() + 1).toString().padStart(2, '0');
      const year = d.getFullYear();
      return `${day}/${month}/${year}`;
    };

    // Giới hạn tối đa 14 ngày gần nhất để tránh quá dài
    const maxLabels = 14;
    const trim = <T>(arr: T[]) => arr.length > maxLabels ? arr.slice(-maxLabels) : arr;

    // Biểu đồ người dùng truy cập
    const browseLabels = trim(this.browseUserStats.map(x => formatDate(x.date)));
    const browseData = trim(this.browseUserStats.map(x => x.totalActiveUsers));
    this.browseUsersChartData = {
      labels: browseLabels,
      datasets: [{
        data: browseData,
        label: 'Người dùng truy cập',
        backgroundColor: '#38bdf8',
        borderRadius: 8,
        hoverBackgroundColor: '#0ea5e9',
        maxBarThickness: 32
      }]
    };
    // Biểu đồ người dùng đăng ký
    const registerLabels = trim(this.registerUserStats.map(x => formatDate(x.date)));
    const registerData = trim(this.registerUserStats.map(x => x.totalRegistered));
    this.registerUsersChartData = {
      labels: registerLabels,
      datasets: [{
        data: registerData,
        label: 'Người dùng đăng ký',
        backgroundColor: '#34d399',
        borderRadius: 8,
        hoverBackgroundColor: '#059669',
        maxBarThickness: 32
      }]
    };
    // Biểu đồ số cây được thêm
    const plantLabels = trim(this.addedPlantStats.map(x => formatDate(x.date)));
    const plantData = trim(this.addedPlantStats.map(x => x.totalAdded));
    this.addedPlantsChartData = {
      labels: plantLabels,
      datasets: [{
        data: plantData,
        label: 'Cây được thêm',
        backgroundColor: '#fbbf24',
        borderRadius: 8,
        hoverBackgroundColor: '#f59e42',
        maxBarThickness: 32
      }]
    };
  }
}
