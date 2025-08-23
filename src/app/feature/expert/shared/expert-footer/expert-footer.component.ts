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
        </div>
      </div>
    </div>
  `,
  styleUrls: ['./expert-footer.component.scss']
})
export class ExpertFooterComponent {}
