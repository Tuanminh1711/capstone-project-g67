import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { HomeComponent } from './main/home/home.component';
import { PlantInfoComponent } from './main/plant-info/plant-info';
import { AboutUsComponent } from './main/about-us/about-us';
import { AuthPopupHolderComponent } from './shared/empty.component';
import { ViewUserProfileComponent } from './profile/view-user-profile/view-user-profile.component';
import { EditUserProfileComponent } from './profile/edit-user-profile/edit-user-profile.component';
import { ChangePasswordComponent } from './profile/change-password/change-password.component';
import { MyGardenComponent } from './main/my-green-space/my-garden/my-garden.component';
import { AdminHomeComponent } from './admin/home/admin-home.component';
import { AdminCreateAccountComponent } from './admin/create-account/admin-create-account.component';
import { AdminAccountListComponent } from './admin/account-list/admin-account-list.component';
import { AdminPlantListComponent } from './admin/plant-list/admin-plant-list.component';
import { AdminEditPlantComponent } from './admin/plant-list/admin-edit-plant.component';

const routes: Routes = [
  { path: '', redirectTo: 'home', pathMatch: 'full' },
  { path: 'home', component: HomeComponent },
  { path: 'login', component: AuthPopupHolderComponent, data: { showLogin: true } },
  { path: 'register', component: AuthPopupHolderComponent, data: { showRegister: true } },
  { path: 'plant-info', component: PlantInfoComponent },
  { path: 'about-us', component: AboutUsComponent },
  { path: 'view-user-profile', component: ViewUserProfileComponent },
  { path: 'edit-profile', component: EditUserProfileComponent },
  { path: 'profile/edit', component: EditUserProfileComponent },
  { path: 'profile/change-password', component: ChangePasswordComponent },
  { path: 'my-green-space/my-garden', component: MyGardenComponent },
  { path: 'admin', component: AdminHomeComponent },
  { path: 'admin/accounts/create', component: AdminCreateAccountComponent },
  { path: 'admin/accounts', component: AdminAccountListComponent },
  { path: 'admin/plants', component: AdminPlantListComponent },
  { path: 'admin/plants/edit/:id', component: AdminEditPlantComponent },
  { path: 'care-with-experts', component: HomeComponent }
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
