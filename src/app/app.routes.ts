import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { HomeComponent } from './main/home/home.component';
import { PlantInfoComponent } from './main/plant-info/plant-info.component';
import { PlantDetailComponent } from './main/plant-detail/plant-detail.component';
import { AboutUsComponent } from './main/about-us/about-us.component';
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

import { ReportListComponent } from './admin/response-manager/report-list/report-list.component';
import { ReportDetailComponent } from './admin/response-manager/report-detail/report-detail.component';
import { ReportReviewComponent } from './admin/response-manager/report-review/report-review.component';
import { TicketListComponent } from './admin/response-manager/ticket-list/ticket-list.component';
import { TicketDetailComponent } from './admin/response-manager/ticket-detail/ticket-detail.component';
import { TicketReviewComponent } from './admin/response-manager/ticket-review/ticket-review.component';

import { TotalPlantsStatisticsComponent } from './admin/statistics/total-plants.component';
import { TotalUsersStatisticsComponent } from './admin/statistics/total-users.component';
import { TotalBrowseUsersStatisticsComponent } from './admin/statistics/total-browse-users.component';

const routes: Routes = [
  { path: '', redirectTo: 'home', pathMatch: 'full' },
  { path: 'home', component: HomeComponent },
  { path: 'plant-info', component: PlantInfoComponent },
  { path: 'login', component: AuthPopupHolderComponent, data: { showLogin: true } },
  { path: 'register', component: AuthPopupHolderComponent, data: { showRegister: true } },
  { path: 'plant-detail/:id', component: PlantDetailComponent },
  { path: 'plant-info/detail/:id', component: PlantDetailComponent },
  { path: 'about-us', component: AboutUsComponent },
  { path: 'view-user-profile', component: ViewUserProfileComponent },
  { path: 'edit-profile', component: EditUserProfileComponent },
  { path: 'profile/edit', component: EditUserProfileComponent },
  { path: 'profile/change-password', component: ChangePasswordComponent },
  { path: 'my-green-space/my-garden', component: MyGardenComponent },
  { path: 'user/my-garden', component: MyGardenComponent },
  { path: 'user/add-plant/:plantId', component: AddPlantComponent },
  { path: 'my-green-space', redirectTo: 'user/my-garden', pathMatch: 'full' },
  
  // Admin routes
  { path: 'admin', component: AdminHomeComponent },
  { path: 'admin/accounts/create', component: AdminCreateAccountComponent },
  { path: 'admin/accounts', component: AdminAccountListComponent },
  
  // Response Manager routes
  { path: 'admin/response-manager/reports', component: ReportListComponent },
  { path: 'admin/response-manager/report-detail/:id', component: ReportDetailComponent },
  { path: 'admin/response-manager/report-review/:id', component: ReportReviewComponent },
  { path: 'admin/response-manager/tickets', component: TicketListComponent },
  { path: 'admin/response-manager/ticket-detail/:id', component: TicketDetailComponent },
  { path: 'admin/response-manager/ticket-review/:id', component: TicketReviewComponent },
  
  // Plant Manager routes
  { path: 'admin/plants', component: AdminPlantListComponent },
  { path: 'admin/plants/create', component: AdminCreatePlantComponent },
  { path: 'admin/plants/view/:id', component: AdminViewPlantComponent },
  { path: 'admin/plants/edit/:id', component: UpdatePlantComponent },
  
  // Statistics routes
  { path: 'admin/statistics/total-plants', component: TotalPlantsStatisticsComponent },
  { path: 'admin/statistics/total-users', component: TotalUsersStatisticsComponent },
  { path: 'admin/statistics/total-browse', component: TotalBrowseUsersStatisticsComponent },
  
  { path: '**', redirectTo: 'home' }
];

@NgModule({
  imports: [
    RouterModule.forRoot(routes, {
      onSameUrlNavigation: 'reload',
      scrollPositionRestoration: 'enabled'
    })
  ],
  exports: [RouterModule]
})
export class AppRoutingModule {}

export { routes };
