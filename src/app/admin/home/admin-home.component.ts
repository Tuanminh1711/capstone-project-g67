import { Component } from '@angular/core';
import { AdminSidebarComponent } from '../../shared/admin-sidebar/admin-sidebar.component';
import { AdminTopNavigatorComponent } from '../../shared/admin-top-navigator/admin-top-navigator.component';
import { AdminFooterComponent } from '../../shared/admin-footer/admin-footer.component';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-admin-home',
  standalone: true,
  imports: [AdminSidebarComponent, AdminTopNavigatorComponent, AdminFooterComponent, CommonModule],
  templateUrl: './admin-home.component.html',
  styleUrls: ['./admin-home.component.scss']
})
export class AdminHomeComponent {
  sidebarOpen = true;

  toggleSidebar() {
    this.sidebarOpen = !this.sidebarOpen;
  }
}
