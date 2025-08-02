import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-expert-footer',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="expert-footer">
      <div class="footer-content">
        <div class="footer-left">
          <p class="copyright">© 2025 Plant Care Expert System. All rights reserved.</p>
        </div>
        
        <div class="footer-right">
          <div class="footer-links">
            <a href="#" class="footer-link">Hỗ trợ</a>
            <span class="separator">|</span>
            <a href="#" class="footer-link">Chính sách</a>
            <span class="separator">|</span>
            <a href="#" class="footer-link">Điều khoản</a>
          </div>
          
          <div class="system-status">
            <span class="status-dot"></span>
            <span class="status-text">Hệ thống hoạt động bình thường</span>
          </div>
        </div>
      </div>
    </div>
  `,
  styleUrls: ['./expert-footer.component.scss']
})
export class ExpertFooterComponent {}
