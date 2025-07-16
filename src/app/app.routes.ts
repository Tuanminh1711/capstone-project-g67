// MAIN FEATURE
import { HomeComponent } from './main/home/home.component';
import { PlantInfoComponent } from './main/plant-info/plant-info';
import { PlantDetailComponent } from './main/plant-detail/plant-detail.component';
import { AboutUsComponent } from './main/about-us/about-us';

// USER FEATURE
import { MyGardenComponent } from './user/my-garden/my-garden.component';
import { AddPlantComponent } from './user/add-plant/add-plant.component';
import { CreateNewPlantComponent } from './user/create-plants/create-new-plant.component';
import { ViewUserPlantDetailComponent } from './user/view-user-plant-detail/view-user-plant-detail.component';
import { PlantCareReminderSetupComponent } from './user/plant-care-reminder-setup/plant-care-reminder-setup.component';
import { ReportPlantPageComponent } from './user/report-plant/report-plant-page.component';

// PROFILE & AUTH
import { AuthPopupHolderComponent } from './shared/empty.component';
import { ViewUserProfileComponent } from './profile/view-user-profile/view-user-profile.component';
import { EditUserProfileComponent } from './profile/edit-user-profile/edit-user-profile.component';
import { ChangePasswordComponent } from './profile/change-password/change-password.component';
import { LoginAdminPageComponent } from './auth/login-admin/login-admin-page.component';

// ADMIN FEATURE
import { AdminHomeComponent } from './admin/home/admin-home.component';
import { AdminCreateAccountComponent } from './admin/account-manager/create-account/admin-create-account.component';
import { AdminAccountListComponent } from './admin/account-manager/account-list/admin-account-list.component';
import { AdminPlantListComponent } from './admin/plant-manager/plant-list/admin-plant-list.component';
import { AdminCreatePlantComponent } from './admin/plant-manager/create-plant/admin-create-plant.component';
import { AdminViewPlantComponent } from './admin/plant-manager/view-plant/admin-view-plant.component';
import { UpdatePlantComponent } from './admin/plant-manager/update-plant/update-plant.component';
import { UpdatePlantComponent as UserUpdatePlantComponent } from './user/update-plant/update-plant.component';
import { ReportListComponent } from './admin/response-manager/report/report-list/report-list.component';
import { TotalUsersStatisticsComponent } from './admin/statistics/total-users/total-users.component';
import { TotalPlantsStatisticsComponent } from './admin/statistics/total-plants/total-plants.component';
import { TotalBrowseUsersStatisticsComponent } from './admin/statistics/total-browse-users/total-browse-users.component';
import { AdminLayoutComponent } from './shared/admin-layout/admin-layout.component';
import { AdminAccountDetailComponent } from './admin/account-manager/account-detail/admin-account-detail.component';
import { AdminUpdateUserComponent } from './admin/account-manager/update-user/admin-update-user.component';
import { AdminUserActivityLogsComponent } from './admin/account-manager/user-activity-logs/admin-user-activity-logs.component';

// SHARED/UTILS
import { Routes } from '@angular/router';

// ROUTES
export const routes: Routes = [
  // MAIN
  { path: '', redirectTo: 'home', pathMatch: 'full' },
  { path: 'home', component: HomeComponent },
  { path: 'about-us', component: AboutUsComponent },
  { path: 'plant-info', component: PlantInfoComponent },
  { path: 'plant-detail/:id', component: PlantDetailComponent },
  { path: 'plant-info/detail/:id', component: PlantDetailComponent },

  // USER
  { path: 'user/my-garden', component: MyGardenComponent },
  { path: 'user/create-new-plant', component: CreateNewPlantComponent },
  { path: 'user/user-plant-detail/:id', component: ViewUserPlantDetailComponent },
  { path: 'user/plant-care-reminder/:userPlantId', component: PlantCareReminderSetupComponent },
  { path: 'user/add-plant/:plantId', component: AddPlantComponent },
  { path: 'user/collection', redirectTo: 'user/my-garden', pathMatch: 'full' },
  { path: 'user/collection/add-plant/:plantId', redirectTo: 'user/add-plant/:plantId', pathMatch: 'full' },
  { path: 'user/my-tickets', loadComponent: () => import('./user/ticket/view-ticket/view-ticket.component').then(m => m.ViewTicketComponent) },
  { path: 'user/report-plant/:id', component: ReportPlantPageComponent },

  // PROFILE & AUTH
  { path: 'login', component: AuthPopupHolderComponent, data: { showLogin: true } },
  { path: 'register', component: AuthPopupHolderComponent, data: { showRegister: true } },
  { path: 'view-user-profile', component: ViewUserProfileComponent },
  { path: 'edit-profile', component: EditUserProfileComponent },
  { path: 'profile/edit', component: EditUserProfileComponent },
  { path: 'profile/change-password', component: ChangePasswordComponent },
  { path: 'login-admin', component: LoginAdminPageComponent },

  // ADMIN
  {
    path: 'admin',
    component: AdminLayoutComponent,
    children: [
      { path: '', component: AdminHomeComponent },
      { path: 'reports', component: ReportListComponent },
      { path: 'statistics/total-users', component: TotalUsersStatisticsComponent },
      { path: 'statistics/total-plants', component: TotalPlantsStatisticsComponent },
      { path: 'statistics/total-browse-users', component: TotalBrowseUsersStatisticsComponent },
      { path: 'accounts/create', component: AdminCreateAccountComponent },
      { path: 'accounts', component: AdminAccountListComponent },
      { path: 'accounts/detail/:id', component: AdminAccountDetailComponent },
      { path: 'accounts/update/:id', component: AdminUpdateUserComponent },
      { path: 'accounts/activity-logs/:id', component: AdminUserActivityLogsComponent },
      { path: 'plants/create', component: AdminCreatePlantComponent },
      { path: 'plants/view/:id', component: AdminViewPlantComponent },
      { path: 'plants/edit/:id', component: UpdatePlantComponent },
      { path: 'plants/update/:id', component: UpdatePlantComponent },
      { path: 'plants', component: AdminPlantListComponent },
      { path: 'support/tickets', loadComponent: () => import('./admin/ticket/ticket-list/admin-support-tickets-list.component').then(m => m.AdminSupportTicketsListComponent) },
      { path: 'support/tickets/:id', loadComponent: () => import('./admin/ticket/ticket-detail/admin-support-ticket-detail.component').then(m => m.AdminSupportTicketDetailComponent) },
    ]
  },

  // SHARED/UTILS
  { path: 'my-green-space', redirectTo: 'user/my-garden', pathMatch: 'full' }, // Redirect old path
  { path: 'my-green-space/my-garden', redirectTo: 'user/my-garden', pathMatch: 'full' }, // Redirect old path
  { path: 'update-plant/:id', component: UserUpdatePlantComponent },
  { path: '**', redirectTo: 'home' } // Wildcard route for any unknown routes
];
