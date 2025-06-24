import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { HomeComponent } from './main/home/home.component';
import { PlantInfoComponent } from './main/plant-info/plant-info.component';
import { AboutUsComponent } from './main/about-us/about-us.component';
import { AuthPopupHolderComponent } from './shared/empty.component';
import { ViewUserProfileComponent } from './profile/view-user-profile/view-user-profile.component';
import { EditUserProfileComponent } from './profile/edit-user-profile/edit-user-profile.component';
import { MyGardenComponent } from './main/my-green-space/my-garden/my-garden.component';
import { AdminHomeComponent } from './admin/home/admin-home.component';
import { AdminCreateAccountComponent } from './admin/create-account/admin-create-account.component';
import { AdminAccountListComponent } from './admin/account-list/admin-account-list.component';
import { ReportListComponent } from './admin/report-list/report-list.component';
import { ReportDetailComponent } from './admin/report-list/report-detail.component';
import { ReportApproveRejectComponent } from './admin/report-list/report-approve-reject.component';
import { TicketListComponent } from './admin/ticket-list/ticket-list.component';
import { TicketDetailComponent } from './admin/ticket-list/ticket-detail.component';
import { SendResponseComponent } from './admin/ticket-list/send-response.component';

const routes: Routes = [
  { path: '', redirectTo: 'home', pathMatch: 'full' },
  { path: 'home', component: HomeComponent },
  { path: 'login', component: AuthPopupHolderComponent, data: { showLogin: true } },
  { path: 'register', component: AuthPopupHolderComponent, data: { showRegister: true } },
  { path: 'plant-info', component: PlantInfoComponent },
  { path: 'about-us', component: AboutUsComponent },
  { path: 'view-user-profile', component: ViewUserProfileComponent },
  { path: 'edit-profile', component: EditUserProfileComponent },
  { path: 'my-green-space/my-garden', component: MyGardenComponent },
  { path: 'admin', component: AdminHomeComponent },
  { path: 'admin/accounts/create', component: AdminCreateAccountComponent },
  { path: 'admin/accounts', component: AdminAccountListComponent },
  { path: 'admin/reports', component: ReportListComponent },
  { path: 'admin/reports/:id', component: ReportDetailComponent },
  { path: 'admin/reports/approve-reject', component: ReportApproveRejectComponent },
  { path: 'admin/tickets', component: TicketListComponent },
  { path: 'admin/tickets/:id', component: TicketDetailComponent },
  { path: 'admin/tickets/:id/response', component: SendResponseComponent }
];

export { routes };

@NgModule({
  imports: [
    RouterModule.forRoot(routes, {
      onSameUrlNavigation: 'reload',        // ✅ Cần thiết để reload component khi URL giống nhau
      scrollPositionRestoration: 'enabled'  // 👌 Optional: cuộn về đầu trang
    })
  ],
  exports: [RouterModule]
})
export class AppRoutingModule {}
