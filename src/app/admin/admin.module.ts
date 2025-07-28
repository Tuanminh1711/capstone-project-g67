import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AdminHomeComponent } from './home/admin-home.component';
import { AdminCreateAccountComponent } from './account-manager/create-account/admin-create-account.component';
import { AdminAccountListComponent } from './account-manager/account-list/admin-account-list.component';
import { AdminAccountDetailComponent } from './account-manager/account-detail/admin-account-detail.component';
import { AdminUpdateUserComponent } from './account-manager/update-user/admin-update-user.component';
import { AdminUserActivityLogsComponent } from './account-manager/user-activity-logs/admin-user-activity-logs.component';
import { AdminPlantListComponent } from './plant-manager/plant-list/admin-plant-list.component';
import { AdminCreatePlantComponent } from './plant-manager/create-plant/admin-create-plant.component';
import { AdminViewPlantComponent } from './plant-manager/view-plant/admin-view-plant.component';
import { UpdatePlantComponent } from './plant-manager/update-plant/update-plant.component';
// Update the import path below to the correct location of ReportListComponent
import { ReportListComponent } from './response-manager/report-list/report-list.component';
import { AdminLayoutComponent } from '../shared/admin-layout/admin-layout.component';
@NgModule({
  imports: [
    CommonModule,
    RouterModule,
    FormsModule,
    AdminHomeComponent,
    AdminCreateAccountComponent,
    AdminAccountListComponent,
    AdminAccountDetailComponent,
    AdminUpdateUserComponent,
    AdminUserActivityLogsComponent,
    AdminPlantListComponent,
    AdminCreatePlantComponent,
    AdminViewPlantComponent,
    UpdatePlantComponent,
    ReportListComponent,
    AdminLayoutComponent
  ],
  declarations: []
})
export class AdminModule {}
