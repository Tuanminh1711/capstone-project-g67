import { Routes } from '@angular/router';
import { VipAuthGuard } from './auth/vip-auth.guard';

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
// LAZY LOADING IMPORTS 

  // USER - Convert to lazy loading
  { 
    path: 'vip/welcome', 
    loadComponent: () => import('./feature/vip/welcome/welcome-vip.component').then(m => m.WelcomeVipComponent),
    canActivate: [VipAuthGuard]
  },
  { 
    path: 'vip/chat', 
    loadComponent: () => import('./feature/vip/chat/chat.component').then(m => m.ChatComponent),
    canActivate: [VipAuthGuard]
  },

  { 
    path: 'vip/ai-plant', 
    loadComponent: () => import('./feature/vip/ai-plant/ai-plant.component').then(m => m.AiPlantComponent),
    canActivate: [VipAuthGuard]
  },
  { 
    path: 'vip/disease-detection', 
    loadComponent: () => import('./feature/vip/disease-detection/disease-detection.component').then(m => m.DiseaseDetectionComponent),
    canActivate: [VipAuthGuard]
  },
  { path: 'user/chat-ai', loadComponent: () => import('./feature/user/chat-ai/chat-ai.component').then(m => m.ChatAiComponent) },
  { path: 'huong-dan-nhac-nho', loadComponent: () => import('./feature/user/plant/plant-care-reminder-guide/plant-care-reminder-guide.component').then(m => m.PlantCareReminderGuideComponent) },
  { path: 'user/my-garden', loadComponent: () => import('./feature/user/plant/my-garden/my-garden.component').then(m => m.MyGardenComponent) },
  { path: 'user/create-payment/vip-payment', loadComponent: () => import('./feature/user/create-payment/vip-payment.component').then(m => m.VipPaymentComponent) },
  { path: 'user/create-new-plant', loadComponent: () => import('./feature/user/plant/create-plants/create-new-plant.component').then(m => m.CreateNewPlantComponent) },
  { path: 'user/user-plant-detail/:id', loadComponent: () => import('./feature/user/plant/view-user-plant-detail/view-user-plant-detail.component').then(m => m.ViewUserPlantDetailComponent) },
  { path: 'user/plant-care-reminder/:userPlantId', loadComponent: () => import('./feature/user/plant/plant-care-reminder-setup/plant-care-reminder-setup.component').then(m => m.PlantCareReminderSetupComponent) },
  { path: 'user/add-plant/:plantId', loadComponent: () => import('./feature/user/plant/add-plant/add-plant.component').then(m => m.AddPlantComponent) },
  { path: 'user/report-plant/:id', loadComponent: () => import('./feature/user/plant/report-plant/report-plant-page.component').then(m => m.ReportPlantPageComponent) },

  // EXPERT
  { 
    path: 'expert', 
    loadChildren: () => import('./feature/expert/expert.routes').then(m => m.expertRoutes) 
  },
  
  { path: 'user/collection', redirectTo: 'user/my-garden', pathMatch: 'full' },
  { path: 'user/collection/add-plant/:plantId', redirectTo: 'user/add-plant/:plantId', pathMatch: 'full' },
  { path: 'user/my-tickets', loadComponent: () => import('./feature/user/ticket/view-ticket/view-ticket.component').then(m => m.ViewTicketComponent) },
  { path: 'user/my-tickets/:ticketId', loadComponent: () => import('./feature/user/ticket/view-ticket/view-ticket.component').then(m => m.ViewTicketComponent) },
  { path: 'user/activity-logs', loadComponent: () => import('./feature/user/activity-logs/activity-logs.component').then(m => m.ActivityLogsComponent) },
  { path: 'user/notification', loadComponent: () => import('./feature/user/notification/list/notification-list.component').then(m => m.NotificationListComponent) },
  { path: 'user/report', loadComponent: () => import('./feature/user/report/list/report-list.component').then(m => m.ReportListComponent) },
  { path: 'user/report/:id', loadComponent: () => import('./feature/user/report/detail/report-detail.component').then(m => m.ReportDetailComponent) },
  { path: 'user/articles', redirectTo: 'user/articles/list', pathMatch: 'full' },
  { path: 'user/articles/list', loadComponent: () => import('./feature/user/articles/list/user-articles-list.component').then(m => m.UserArticlesListComponent) },
  { path: 'user/articles/:id', loadComponent: () => import('./feature/user/articles/detail/user-article-detail.component').then(m => m.UserArticleDetailComponent) },
  { path: 'articles', redirectTo: 'user/articles/list', pathMatch: 'full' },


  // PROFILE & AUTH - Convert to lazy loading
  { path: 'view-user-profile', loadComponent: () => import('./feature/user/profile/view-user-profile/view-user-profile.component').then(m => m.ViewUserProfileComponent) },
  { path: 'edit-profile', loadComponent: () => import('./feature/user/profile/edit-user-profile/edit-user-profile.component').then(m => m.EditUserProfileComponent) },
  { path: 'profile/edit', loadComponent: () => import('./feature/user/profile/edit-user-profile/edit-user-profile.component').then(m => m.EditUserProfileComponent) },
  { path: 'profile/change-password', loadComponent: () => import('./feature/user/profile/change-password/change-password.component').then(m => m.ChangePasswordComponent) },
  { path: 'login-admin', loadComponent: () => import('./auth/login-admin/login-admin-page.component').then(m => m.LoginAdminPageComponent) },

  // ADMIN
  { 
    path: 'admin', 
    loadChildren: () => import('./feature/admin/admin-routes.lazy').then(m => m.default) 
  },

  // SHARED/UTILS
  { path: 'my-green-space', redirectTo: 'user/my-garden', pathMatch: 'full' }, // Redirect old path
  { path: 'my-green-space/my-garden', redirectTo: 'user/my-garden', pathMatch: 'full' }, // Redirect old path
  { path: 'update-plant/:id', loadComponent: () => import('./feature/user/plant/update-plant/update-plant.component').then(m => m.UpdatePlantComponent) },
  { path: 'user/plant/care-confirm', loadComponent: () => import('./feature/user/plant/care-confirm/care-confirm.component').then(m => m.CareConfirmComponent) },
  { path: '**', redirectTo: 'home' } // Wildcard route for any unknown routes
];
