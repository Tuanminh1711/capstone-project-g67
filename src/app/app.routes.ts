import { Routes } from '@angular/router';

import { HomeComponent } from './main/home/home.component';
import { PlantInfoComponent } from './main/plant-info/plant-info';
import { PlantDetailComponent } from './main/plant-detail/plant-detail.component';
import { AboutUsComponent } from './main/about-us/about-us';
import { AuthPopupHolderComponent } from './shared/empty.component';
import { ViewUserProfileComponent } from './profile/view-user-profile/view-user-profile.component';
import { EditUserProfileComponent } from './profile/edit-user-profile/edit-user-profile.component';
import { ChangePasswordComponent } from './profile/change-password/change-password.component';
import { MyGardenComponent } from './user/my-garden/my-garden.component';
import { AddPlantComponent } from './user/add-plant/add-plant.component';
import { AdminHomeComponent } from './admin/home/admin-home.component';
import { AdminCreateAccountComponent } from './admin/account-manager/create-account/admin-create-account.component';
import { AdminAccountListComponent } from './admin/account-manager/account-list/admin-account-list.component';
import { AdminPlantListComponent } from './admin/plant-manager/plant-list/admin-plant-list.component';
import { AdminCreatePlantComponent } from './admin/plant-manager/create-plant/admin-create-plant.component';
import { AdminViewPlantComponent } from './admin/plant-manager/view-plant/admin-view-plant.component';
import { UpdatePlantComponent } from './admin/plant-manager/update-plant/update-plant.component';
import { UpdatePlantComponent as UserUpdatePlantComponent } from './user/update-plant/update-plant.component';
import { LoginAdminPageComponent } from './auth/login-admin/login-admin-page.component';
import { ReportListComponent } from './admin/response-manager/report-list/report-list.component';
import { TotalUsersStatisticsComponent } from './admin/statistics/total-users.component';
import { TotalPlantsStatisticsComponent } from './admin/statistics/total-plants.component';
import { TotalBrowseUsersStatisticsComponent } from './admin/statistics/total-browse-users.component';
import { AdminLayoutComponent } from './shared/admin-layout/admin-layout.component';
import { ReportPlantPageComponent } from './user/report-plant/report-plant-page.component';
import { AdminAccountDetailComponent } from './admin/account-manager/account-detail/admin-account-detail.component';
import { AdminUpdateUserComponent } from './admin/account-manager/update-user/admin-update-user.component';
import { AdminUserActivityLogsComponent } from './admin/account-manager/user-activity-logs/admin-user-activity-logs.component';

export const routes: Routes = [
  { path: '', redirectTo: 'home', pathMatch: 'full' },
  { path: 'home', component: HomeComponent },
  { path: 'login', component: AuthPopupHolderComponent, data: { showLogin: true } },
  { path: 'register', component: AuthPopupHolderComponent, data: { showRegister: true } },
  { path: 'plant-info', component: PlantInfoComponent },
  { path: 'plant-detail/:id', component: PlantDetailComponent },
  { path: 'plant-info/detail/:id', component: PlantDetailComponent },
  { path: 'about-us', component: AboutUsComponent },
  { path: 'view-user-profile', component: ViewUserProfileComponent },
  { path: 'edit-profile', component: EditUserProfileComponent },
  { path: 'profile/edit', component: EditUserProfileComponent },
  { path: 'profile/change-password', component: ChangePasswordComponent },
  { path: 'user/collection', redirectTo: 'user/my-garden', pathMatch: 'full' },
  { path: 'user/collection/add-plant/:plantId', redirectTo: 'user/add-plant/:plantId', pathMatch: 'full' },
  { path: 'user/my-garden', component: MyGardenComponent },
  { path: 'user/add-plant/:plantId', component: AddPlantComponent },
  { path: 'update-plant/:id', component: UserUpdatePlantComponent },
  { path: 'my-green-space', redirectTo: 'user/my-garden', pathMatch: 'full' }, // Redirect old path
  { path: 'my-green-space/my-garden', redirectTo: 'user/my-garden', pathMatch: 'full' }, // Redirect old path
  // ADMIN/STAFF ROUTES
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
    ]
  },
  { path: 'care-with-experts', component: HomeComponent },
  { path: 'login-admin', component: LoginAdminPageComponent },
  { path: 'user/report-plant/:id', component: ReportPlantPageComponent },
  { path: '**', redirectTo: 'home' } // Wildcard route for any unknown routes
];
