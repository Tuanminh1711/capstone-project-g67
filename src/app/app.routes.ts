// MAIN FEATURE
import { HomeComponent } from './main/home/home.component';
import { PlantInfoComponent } from './main/plant-info/plant-info';
import { PlantDetailComponent } from './main/plant-detail/plant-detail.component';
import { AboutUsComponent } from './main/about-us/about-us';
import { CareWithExpertsComponent } from './main/care-with-experts/care-with-experts.component';

// USER FEATURE
import { MyGardenComponent } from './user/plant/my-garden/my-garden.component';
import { AddPlantComponent } from './user/plant/add-plant/add-plant.component';
import { CreateNewPlantComponent } from './user/plant/create-plants/create-new-plant.component';
import { ViewUserPlantDetailComponent } from './user/plant/view-user-plant-detail/view-user-plant-detail.component';
import { PlantCareReminderSetupComponent } from './user/plant/plant-care-reminder-setup/plant-care-reminder-setup.component';
import { ReportPlantPageComponent } from './user/plant/report-plant/report-plant-page.component';
import { UpdatePlantComponent as UserUpdatePlantComponent } from './user/plant/update-plant/update-plant.component';

// PROFILE & AUTH
import { ViewUserProfileComponent } from './profile/view-user-profile/view-user-profile.component';
import { EditUserProfileComponent } from './profile/edit-user-profile/edit-user-profile.component';
import { ChangePasswordComponent } from './profile/change-password/change-password.component';
import { LoginAdminPageComponent } from './auth/login-admin/login-admin-page.component';


// ADMIN FEATURE

// SHARED/UTILS
import { Routes } from '@angular/router';
import { PrivacyPolicyComponent } from './main/privacy-policy/privacy-policy.component';
import { TermsOfUseComponent } from './main/terms-of-use/terms-of-use.component';

// ROUTES
export const routes: Routes = [
  // MAIN
  { path: '', redirectTo: 'home', pathMatch: 'full' },
  { path: 'home', component: HomeComponent },
  { path: 'about-us', component: AboutUsComponent },
  { path: 'care-with-experts', component: CareWithExpertsComponent },
  { path: 'plant-info', component: PlantInfoComponent },
  { path: 'plant-detail/:id', component: PlantDetailComponent },
  { path: 'plant-info/detail/:id', component: PlantDetailComponent },
  { path: 'privacy-policy', component: PrivacyPolicyComponent },
  { path: 'terms-of-use', component: TermsOfUseComponent },

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
  { path: 'user/vip-chat', loadComponent: () => import('./user/chat/vip-chat/vip-chat.component').then(m => m.VipChatComponent) },

  // PROFILE & AUTH
  { path: 'view-user-profile', component: ViewUserProfileComponent },
  { path: 'edit-profile', component: EditUserProfileComponent },
  { path: 'profile/edit', component: EditUserProfileComponent },
  { path: 'profile/change-password', component: ChangePasswordComponent },
  { path: 'login-admin', component: LoginAdminPageComponent },

  // ADMIN
  { 
    path: 'admin', 
    loadChildren: () => import('./admin/admin-routes.lazy').then(m => m.ADMIN_ROUTES) 
  },

  // SHARED/UTILS
  { path: 'my-green-space', redirectTo: 'user/my-garden', pathMatch: 'full' }, // Redirect old path
  { path: 'my-green-space/my-garden', redirectTo: 'user/my-garden', pathMatch: 'full' }, // Redirect old path
  { path: 'update-plant/:id', component: UserUpdatePlantComponent },
  { path: '**', redirectTo: 'home' } // Wildcard route for any unknown routes
];
