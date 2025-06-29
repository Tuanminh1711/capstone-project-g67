import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { HomeComponent } from './main/home/home.component';
import { PlantInfoComponent } from './main/plant-info/plant-info.component';
import { PlantDetailComponent } from './main/plant-detail/index';
import { AboutUsComponent } from './main/about-us/about-us.component';
import { AuthPopupHolderComponent } from './shared/empty.component';
import { ViewUserProfileComponent } from './profile/view-user-profile/view-user-profile.component';
import { EditUserProfileComponent } from './profile/edit-user-profile/edit-user-profile.component';
import { ChangePasswordComponent } from './profile/change-password/change-password.component';
import { MyGardenComponent } from './main/my-green-space/my-garden/my-garden.component';

import { AdminHomeComponent } from './admin/home/admin-home.component';
import { AdminCreateAccountComponent } from './admin/account-manager/create-account/admin-create-account.component';
import { AdminAccountListComponent } from './admin/account-manager/account-list/admin-account-list.component';
import { ReportListComponent } from './admin/response-manager/report-list/report-list.component';
import { ReportDetailComponent } from './admin/response-manager/report-detail/report-detail.component';
import { ReportReviewComponent } from './admin/response-manager/report-review/report-review.component';
import { TicketListComponent } from './admin/response-manager/ticket-list/ticket-list.component';
import { TicketDetailComponent } from './admin/response-manager/ticket-detail/ticket-detail.component';
import { TicketReviewComponent } from './admin/response-manager/ticket-review/ticket-review.component';
import { AdminPlantListComponent } from './admin/plant-manager/plant-list/admin-plant-list.component';
import { AdminEditPlantComponent } from './admin/plant-manager/plant-list/admin-edit-plant.component';
import { AdminCreatePlantComponent } from './admin/plant-manager/create-plant/admin-create-plant.component';

const routes: Routes = [
  { path: '', redirectTo: 'home', pathMatch: 'full' },
  { path: 'home', component: HomeComponent },
  { path: 'login', component: AuthPopupHolderComponent, data: { showLogin: true } },
  { path: 'register', component: AuthPopupHolderComponent, data: { showRegister: true } },
  { path: 'plant-info', component: PlantInfoComponent },
  { path: 'plant-info/detail/:id', component: PlantDetailComponent },
  { path: 'about-us', component: AboutUsComponent },
  { path: 'view-user-profile', component: ViewUserProfileComponent },
  { path: 'edit-profile', component: EditUserProfileComponent },
  { path: 'profile/edit', component: EditUserProfileComponent },
  { path: 'profile/change-password', component: ChangePasswordComponent },
  { path: 'my-green-space/my-garden', component: MyGardenComponent },

  // Admin routes
  { path: 'admin', component: AdminHomeComponent },
  { path: 'admin/accounts/create', component: AdminCreateAccountComponent },
  { path: 'admin/accounts', component: AdminAccountListComponent },
  { path: 'admin/reports', component: ReportListComponent },
  { path: 'admin/reports/:id', component: ReportDetailComponent },
  { path: 'admin/reports/:id/review', component: ReportReviewComponent },
  { path: 'admin/tickets', component: TicketListComponent },
  { path: 'admin/tickets/:id', component: TicketDetailComponent },
  { path: 'admin/tickets/:id/review', component: TicketReviewComponent },
  { path: 'admin/plants', component: AdminPlantListComponent },
  { path: 'admin/plants/edit/:id', component: AdminEditPlantComponent },
  { path: 'admin/plants/create', component: AdminCreatePlantComponent }, // Nếu bạn có trang tạo cây

  { path: 'care-with-experts', component: HomeComponent },

  { path: '**', redirectTo: 'home' } // fallback cho route không tồn tại
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
