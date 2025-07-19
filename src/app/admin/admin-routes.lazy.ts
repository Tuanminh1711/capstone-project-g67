import { Routes } from '@angular/router';
export const ADMIN_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('../shared/admin-layout/admin-layout.component').then(m => m.AdminLayoutComponent),
    children: [
      { path: '', loadComponent: () => import('./home/admin-home.component').then(m => m.AdminHomeComponent) },
      { path: 'reports', loadComponent: () => import('./response-manager/report-list/report-list.component').then(m => m.ReportListComponent) },
      { path: 'reports/detail/:id', loadComponent: () => import('./response-manager/report-detail/report-detail.component').then(m => m.ReportDetailComponent) },
      { path: 'reports/review/:id', loadComponent: () => import('./response-manager/report-review/report-review.component').then(m => m.ReportReviewComponent) },
      { path: 'statistics/total-users', loadComponent: () => import('./statistics/total-users/total-users.component').then(m => m.TotalUsersStatisticsComponent) },
      { path: 'statistics/total-plants', loadComponent: () => import('./statistics/total-plants/total-plants.component').then(m => m.TotalPlantsStatisticsComponent) },
      { path: 'statistics/total-browse-users', loadComponent: () => import('./statistics/total-browse-users/total-browse-users.component').then(m => m.TotalBrowseUsersStatisticsComponent) },
      { path: 'accounts/create', loadComponent: () => import('./account-manager/create-account/admin-create-account.component').then(m => m.AdminCreateAccountComponent) },
      { path: 'accounts', loadComponent: () => import('./account-manager/account-list/admin-account-list.component').then(m => m.AdminAccountListComponent) },
      { path: 'accounts/detail/:id', loadComponent: () => import('./account-manager/account-detail/admin-account-detail.component').then(m => m.AdminAccountDetailComponent) },
      { path: 'accounts/update/:id', loadComponent: () => import('./account-manager/update-user/admin-update-user.component').then(m => m.AdminUpdateUserComponent) },
      { path: 'accounts/activity-logs/:id', loadComponent: () => import('./account-manager/user-activity-logs/admin-user-activity-logs.component').then(m => m.AdminUserActivityLogsComponent) },
      { path: 'plants/create', loadComponent: () => import('./plant-manager/create-plant/admin-create-plant.component').then(m => m.AdminCreatePlantComponent) },
      { path: 'plants/view/:id', loadComponent: () => import('./plant-manager/view-plant/admin-view-plant.component').then(m => m.AdminViewPlantComponent) },
      { path: 'plants/edit/:id', loadComponent: () => import('./plant-manager/update-plant/update-plant.component').then(m => m.UpdatePlantComponent) },
      { path: 'plants/update/:id', loadComponent: () => import('./plant-manager/update-plant/update-plant.component').then(m => m.UpdatePlantComponent) },
      { path: 'plants', loadComponent: () => import('./plant-manager/plant-list/admin-plant-list.component').then(m => m.AdminPlantListComponent) },
      { path: 'support/tickets', loadComponent: () => import('./ticket/ticket-list/admin-support-tickets-list.component').then(m => m.AdminSupportTicketsListComponent) },
      { path: 'support/tickets/:id', loadComponent: () => import('./ticket/ticket-detail/admin-support-ticket-detail.component').then(m => m.AdminSupportTicketDetailComponent) }
    ]
  }
];
