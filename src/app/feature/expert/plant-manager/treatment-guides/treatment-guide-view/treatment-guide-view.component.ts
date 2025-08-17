import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-treatment-guide-view',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule
  ],
  template: `
    <div class="page-container">
      <div class="page-header">
        <h1>📋 Chi tiết hướng dẫn điều trị</h1>
        <p class="subtitle">Chức năng này không còn sử dụng</p>
      </div>

      <div class="content-card">
        <div class="card-header">
          <h2>📢 Thông báo</h2>
        </div>
        
        <div class="card-content">
          <div class="info-box">
            <div class="info-icon">
              <svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z"/>
              </svg>
            </div>
            <div class="info-content">
              <p>🌿 Hướng dẫn điều trị hiện được xem từ trang chi tiết bệnh cây.</p>
              <p>📋 Vui lòng truy cập mục "Danh sách bệnh cây" để xem hướng dẫn điều trị.</p>
            </div>
          </div>

          <div class="action-buttons">
            <button class="btn btn-primary" routerLink="/expert/plant-manager/diseases">
              <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
                <path d="M3 13h2v-2H3v2zm0 4h2v-2H3v2zm0-8h2V7H3v2zm4 4h14v-2H7v2zm0 4h14v-2H7v2zM7 7v2h14V7H7z"/>
              </svg>
              Danh sách bệnh cây
            </button>
            <button class="btn btn-secondary" routerLink="../list">
              <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
                <path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z"/>
              </svg>
              Quay lại
            </button>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .page-container {
      max-width: 1200px;
      margin: 0 auto;
      padding: 24px;
      background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
      min-height: 100vh;
    }

    .page-header {
      text-align: center;
      margin-bottom: 40px;
      padding: 32px 0;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      border-radius: 16px;
      color: white;
      box-shadow: 0 8px 32px rgba(102, 126, 234, 0.3);
    }

    .page-header h1 {
      margin: 0 0 12px 0;
      font-size: 2.5rem;
      font-weight: 700;
      text-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
    }

    .page-header .subtitle {
      margin: 0;
      font-size: 1.2rem;
      opacity: 0.9;
      font-weight: 300;
    }

    .content-card {
      background: white;
      border-radius: 20px;
      box-shadow: 0 10px 40px rgba(0, 0, 0, 0.1);
      overflow: hidden;
    }

    .card-header {
      background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
      padding: 32px;
      color: white;
      text-align: center;
    }

    .card-header h2 {
      margin: 0;
      font-size: 2rem;
      font-weight: 600;
      text-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    }

    .card-content {
      padding: 40px;
    }

    .info-box {
      display: flex;
      align-items: flex-start;
      gap: 24px;
      background: linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%);
      padding: 32px;
      border-radius: 16px;
      margin-bottom: 32px;
      box-shadow: 0 6px 24px rgba(252, 182, 159, 0.3);
    }

    .info-icon {
      flex-shrink: 0;
      width: 48px;
      height: 48px;
      background: rgba(255, 255, 255, 0.7);
      border-radius: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
      color: #333;
    }

    .info-content {
      flex: 1;
    }

    .info-content p {
      margin: 12px 0;
      color: #333;
      font-size: 1.1rem;
      line-height: 1.6;
    }

    .action-buttons {
      display: flex;
      gap: 20px;
      justify-content: center;
      flex-wrap: wrap;
    }

    .btn {
      display: inline-flex;
      align-items: center;
      gap: 12px;
      padding: 16px 32px;
      border: none;
      border-radius: 50px;
      font-size: 1.1rem;
      font-weight: 600;
      text-decoration: none;
      cursor: pointer;
      transition: all 0.3s ease;
      box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);
    }

    .btn:hover {
      transform: translateY(-3px);
      box-shadow: 0 8px 25px rgba(0, 0, 0, 0.3);
    }

    .btn-primary {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
    }

    .btn-secondary {
      background: linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%);
      color: #333;
    }
  `]
})
export class TreatmentGuideViewComponent {
}
