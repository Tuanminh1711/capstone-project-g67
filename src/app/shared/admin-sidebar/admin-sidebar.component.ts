import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

interface SidebarSection {
  title: string;
  open: boolean;
  items: { label: string; link: string }[];
}

@Component({
  selector: 'app-admin-sidebar',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './admin-sidebar.component.html',
  styleUrls: ['./admin-sidebar.component.scss']
})
export class AdminSidebarComponent {
  sidebarSections: SidebarSection[] = [
    {
      title: 'Account Management',
      open: false,
      items: [
        { label: 'Create account', link: '/admin/accounts/create' },
        { label: 'View account list', link: '/admin/accounts' },
        { label: 'Search account', link: '/admin/accounts/search' },
        { label: 'View account detail', link: '/admin/accounts/detail' },
        { label: 'View account log activity', link: '/admin/accounts/log' },
        { label: 'Update account information', link: '/admin/accounts/update' },
        { label: 'Reset password', link: '/admin/accounts/reset-password' },
        { label: 'Lock/unlock account', link: '/admin/accounts/lock-unlock' }
      ]
    },
    {
      title: 'Plant Management',
      open: false,
      items: [
        { label: 'Create new plant', link: '/admin/plants/create' },
        { label: 'View plant list', link: '/admin/plants' },
        { label: 'Search plant', link: '/admin/plants/search' },
        { label: 'View plant detail', link: '/admin/plants/detail' },
        { label: 'Update plant information', link: '/admin/plants/update' },
        { label: 'Lock/Unlock plant', link: '/admin/plants/lock-unlock' }
      ]
    },
    {
      title: 'Response Management',
      open: false,
      items: [
        { label: 'View report list', link: '/admin/reports' },
        { label: 'View report detail', link: '/admin/reports/detail' },
        { label: 'Approve/Reject report', link: '/admin/reports/approve-reject' },
        { label: 'View ticket list', link: '/admin/tickets' },
        { label: 'View ticket detail', link: '/admin/tickets/detail' },
        { label: 'Send response', link: '/admin/tickets/send-response' }
      ]
    },
    {
      title: 'Statistic',
      open: false,
      items: [
        { label: 'View total added plant', link: '/admin/statistics/total-plants' },
        { label: 'View total register user', link: '/admin/statistics/total-users' },
        { label: 'View total browse user', link: '/admin/statistics/total-browse' },
        { label: 'View Total Plants (filter)', link: '/admin/statistics/total-plants-filter' }
      ]
    }
  ];

  toggleSection(section: SidebarSection) {
    section.open = !section.open;
  }
}
