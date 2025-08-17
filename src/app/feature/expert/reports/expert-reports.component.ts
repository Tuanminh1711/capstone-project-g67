import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';

@Component({
  selector: 'app-expert-reports',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule
  ],
  template: `
    <div class="page-header">
      <h1>Báo cáo thống kê</h1>
      <p class="subtitle">Tổng hợp thống kê hoạt động</p>
    </div>

    <div class="content-container">
      <!-- Report content here -->
      <div class="reports-grid">
        <mat-card>
          <mat-card-header>
            <mat-card-title>Thống kê tư vấn</mat-card-title>
          </mat-card-header>
          <mat-card-content>
            <!-- Chat stats -->
          </mat-card-content>
        </mat-card>

        <mat-card>
          <mat-card-header>
            <mat-card-title>Thống kê bệnh cây</mat-card-title>
          </mat-card-header>
          <mat-card-content>
            <!-- Disease stats -->
          </mat-card-content>
        </mat-card>
      </div>
    </div>
  `,
  styles: [`
    .page-header {
      margin-bottom: 32px;
      padding: 24px 0;
      border-bottom: 1px solid #e0e0e0;
    }

    .page-header h1 {
      margin: 0 0 8px 0;
      font-size: 28px;
      font-weight: 600;
      color: #333;
    }

    .page-header .subtitle {
      margin: 0;
      color: #666;
      font-size: 16px;
    }

    .content-container {
      padding: 24px 0;
    }

    .reports-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
      gap: 24px;
    }
  `]
})
export class ExpertReportsComponent {}
