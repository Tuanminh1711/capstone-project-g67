import { Component } from '@angular/core';
import { AdminLayoutComponent } from '../../shared/admin-layout/admin-layout.component';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-admin-home',
  standalone: true,
  imports: [AdminLayoutComponent, CommonModule],
  templateUrl: './admin-home.component.html',
  styleUrls: ['./admin-home.component.scss']
})
export class AdminHomeComponent {}
