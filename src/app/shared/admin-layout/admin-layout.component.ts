import { Component } from '@angular/core';
import { AdminTopNavigatorComponent } from '../admin-top-navigator/admin-top-navigator.component';
import { AdminSidebarComponent } from '../admin-sidebar/admin-sidebar.component';
import { AdminFooterComponent } from '../admin-footer/admin-footer.component';
import { CommonModule } from '@angular/common';
import { RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-admin-layout',
  standalone: true,
  imports: [CommonModule, AdminTopNavigatorComponent, AdminSidebarComponent, AdminFooterComponent, RouterOutlet],
  template: `
    <div class="admin-layout" [class.sidebar-collapsed]="sidebarCollapsed">
      <app-admin-top-navigator [sidebarOpen]="!sidebarCollapsed" (sidebarToggle)="sidebarCollapsed = !sidebarCollapsed"></app-admin-top-navigator>
      <div class="admin-main-wrapper">
        <app-admin-sidebar [collapsed]="sidebarCollapsed"></app-admin-sidebar>
        <main class="admin-main-content">
          <router-outlet></router-outlet>
        </main>
      </div>
      <app-admin-footer></app-admin-footer>
    </div>
  `,
  styleUrls: ['./admin-layout.component.scss']
})
export class AdminLayoutComponent {
  sidebarCollapsed = false;
}
