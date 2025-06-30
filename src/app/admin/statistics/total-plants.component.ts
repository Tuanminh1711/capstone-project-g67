import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { ConfigService } from '../../shared/config.service';
import { AdminLayoutComponent } from '../../shared/admin-layout/admin-layout.component';

@Component({
  selector: 'app-total-plants-statistics',
  standalone: true,
  imports: [CommonModule, AdminLayoutComponent],
  templateUrl: './total-plants.component.html',
  styleUrls: ['./total-plants.component.scss']
})
export class TotalPlantsStatisticsComponent implements OnInit {
  totalPlants: number | null = null;
  loading = false;
  errorMsg = '';

  constructor(private http: HttpClient, private configService: ConfigService) {}

  ngOnInit(): void {
    this.fetchTotalPlants();
  }

  fetchTotalPlants() {
    this.loading = true;
    this.errorMsg = '';
    const url = `${this.configService.apiUrl}/plants/count`; // Giả định endpoint
    this.http.get<{ total: number }>(url).subscribe({
      next: (res) => {
        this.totalPlants = res.total;
        this.loading = false;
      },
      error: (err) => {
        this.errorMsg = 'Không thể tải tổng số cây.';
        this.loading = false;
      }
    });
  }
} 