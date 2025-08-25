
import { Routes } from '@angular/router';
import { UserAuthGuard } from './auth/user-auth.guard';

// Keep only essential components that are needed immediately
import { HomeComponent } from './main/home/home.component';

// ROUTES
export const routes: Routes = [
  // MAIN - Convert to lazy loading
  { path: '', redirectTo: 'home', pathMatch: 'full' },
  { path: 'home', component: HomeComponent },
  { path: 'about-us', loadComponent: () => import('./main/about-us/about-us').then(m => m.AboutUsComponent) },
  { path: 'plant-info', loadComponent: () => import('./main/plant-info/plant-info').then(m => m.PlantInfoComponent) },
  { path: 'plant-detail/:id', loadComponent: () => import('./main/plant-detail/plant-detail.component').then(m => m.PlantDetailComponent) },
  { path: 'plant-info/detail/:id', loadComponent: () => import('./main/plant-detail/plant-detail.component').then(m => m.PlantDetailComponent) },
  { path: 'privacy-policy', loadComponent: () => import('./main/privacy-policy/privacy-policy.component').then(m => m.PrivacyPolicyComponent) },
  { path: 'terms-of-use', loadComponent: () => import('./main/terms-of-use/terms-of-use.component').then(m => m.TermsOfUseComponent) },
  { path: 'care-expert', loadComponent: () => import('./main/care-expert/care-expert.component').then(m => m.CareExpertComponent) },

  // USER & VIP - Lazy loading modules (đã có guard)
  { 
    path: 'user', 
    loadChildren: () => import('./feature/user/user-routes.lazy').then(m => m.default) 
  },
  { 
    path: 'vip', 
    loadChildren: () => import('./feature/vip/vip-routes.lazy').then(m => m.default) 
  },

  // EXPERT
  { 
    path: 'expert', 
    loadChildren: () => import('./feature/expert/expert.routes').then(m => m.expertRoutes) 
  },

  // ADMIN
  { 
    path: 'admin', 
    loadChildren: () => import('./feature/admin/admin-routes.lazy').then(m => m.default) 
  },

  // PROFILE & AUTH - Bảo vệ bởi UserAuthGuard
  { 
    path: 'view-user-profile', 
    loadComponent: () => import('./feature/user/profile/view-user-profile/view-user-profile.component').then(m => m.ViewUserProfileComponent),
    canActivate: [UserAuthGuard]
  },
  { 
    path: 'edit-profile', 
    loadComponent: () => import('./feature/user/profile/edit-user-profile/edit-user-profile.component').then(m => m.EditUserProfileComponent),
    canActivate: [UserAuthGuard]
  },
  { 
    path: 'profile/edit', 
    loadComponent: () => import('./feature/user/profile/edit-user-profile/edit-user-profile.component').then(m => m.EditUserProfileComponent),
    canActivate: [UserAuthGuard]
  },
  { 
    path: 'profile/change-password', 
    loadComponent: () => import('./feature/user/profile/change-password/change-password.component').then(m => m.ChangePasswordComponent),
    canActivate: [UserAuthGuard]
  },
  
  // LOGIN ADMIN - Không cần guard
  { path: 'login-admin', loadComponent: () => import('./auth/login-admin/login-admin-page.component').then(m => m.LoginAdminPageComponent) },

  // SHARED/UTILS - Bảo vệ bởi UserAuthGuard
  { path: 'my-green-space', redirectTo: 'user/my-garden', pathMatch: 'full' }, // Redirect old path
  { path: 'my-green-space/my-garden', redirectTo: 'user/my-garden', pathMatch: 'full' }, // Redirect old path
  
  // Các route plant cần bảo vệ
  { 
    path: 'update-plant/:id', 
    loadComponent: () => import('./feature/user/plant/update-plant/update-plant.component').then(m => m.UpdatePlantComponent),
    canActivate: [UserAuthGuard]
  },
  { 
    path: 'user/plant/care-confirm', 
    loadComponent: () => import('./feature/user/plant/care-confirm/care-confirm.component').then(m => m.CareConfirmComponent),
    canActivate: [UserAuthGuard]
  },
  
  // Articles - Redirect đến user routes (đã có guard)
  { path: 'articles', redirectTo: 'user/articles/list', pathMatch: 'full' },
  
  // Test route để kiểm tra guard (chỉ dùng trong development)
  { 
    path: 'guard-test', 
    loadComponent: () => import('./auth/guard-test.component').then(m => m.GuardTestComponent) 
  },
  
  { path: '**', redirectTo: 'home' } // Wildcard route for any unknown routes
];
