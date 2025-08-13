import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ExpertSidebarComponent } from '../expert-sidebar/expert-sidebar.component';
import { ExpertFooterComponent } from '../expert-footer/expert-footer.component';

@Component({
  selector: 'app-expert-layout',
  standalone: true,
  imports: [
    CommonModule,
    ExpertSidebarComponent,
    ExpertFooterComponent
  ],
  template: `
    <div class="expert-layout">
      <app-expert-sidebar></app-expert-sidebar>
      
      <div class="expert-main-content">
        <main class="expert-content">
          <ng-content></ng-content>
        </main>
        
        <app-expert-footer></app-expert-footer>
      </div>
    </div>
  `,
  styleUrls: ['./expert-layout.component.scss']
})
export class ExpertLayoutComponent {}
