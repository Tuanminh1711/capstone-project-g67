import { Routes } from '@angular/router';
import { HomeComponent } from './main/home/home.component';
import { PlantInfoComponent } from './main/plant-info/plant-info';
import { AboutUsComponent } from './main/about-us/about-us';
import { AuthPopupHolderComponent } from './shared/empty.component';
import { ViewUserProfileComponent } from './profile/view-user-profile/view-user-profile.component';
import { EditUserProfileComponent } from './profile/edit-user-profile/edit-user-profile.component';
import { MyGardenComponent } from './main/my-green-space/my-garden/my-garden.component';

export const routes: Routes = [
  { path: '', redirectTo: 'home', pathMatch: 'full' },
  { path: 'home', component: HomeComponent },
  { path: 'login', component: AuthPopupHolderComponent, data: { showLogin: true } },
  { path: 'register', component: AuthPopupHolderComponent, data: { showRegister: true } },
  { path: 'plant-info', component: PlantInfoComponent },
  { path: 'about-us', component: AboutUsComponent },
  { path: 'view-user-profile', component: ViewUserProfileComponent },
  { path: 'edit-profile', component: EditUserProfileComponent },
  { path: 'my-green-space/my-garden', component: MyGardenComponent }
];
