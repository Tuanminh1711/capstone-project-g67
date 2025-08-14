import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ExpertSidebarComponent } from '../expert-sidebar/expert-sidebar.component';
import { ExpertFooterComponent } from '../expert-footer/expert-footer.component';

@Component({
  selector: 'app-expert-layout',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    ExpertSidebarComponent,
    ExpertFooterComponent
  ],
  template: `
    <div class="expert-layout">
      <app-expert-sidebar></app-expert-sidebar>
      
      <div class="expert-main-content">
        <main class="expert-content">
          <router-outlet></router-outlet>
        </main>
        
        <app-expert-footer></app-expert-footer>
      </div>
    </div>
  `,
  styleUrls: ['./expert-layout.component.scss']
})
export class ExpertLayoutComponent {}
