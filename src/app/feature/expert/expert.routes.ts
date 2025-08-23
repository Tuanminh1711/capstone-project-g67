import { Routes } from '@angular/router';
import { ExpertLayoutComponent } from './shared/expert-layout/expert-layout.component';
import { ExpertAuthGuard } from '../../auth/expert-auth.guard';

export const expertRoutes: Routes = [
  {
    path: '',
    component: ExpertLayoutComponent,
    canActivate: [ExpertAuthGuard],
    children: [
      {
        path: '',
        redirectTo: 'welcome',
        pathMatch: 'full'
      },
      {
        path: 'welcome',
        loadComponent: () => import('./welcome/welcome-expert.component').then(c => c.WelcomeExpertComponent),
        title: 'Chào mừng'
      },
      {
        path: 'chat',
        loadComponent: () => import('./chat/expert-chat.component').then(c => c.ExpertChatComponent),
        title: 'Phòng Chat Chuyên gia'
      },
      {
        path: 'private-chat',
        loadComponent: () => import('./chat/expert-private-chat.component').then(c => c.ExpertPrivateChatComponent),
        title: 'Tin nhắn riêng tư'
      },
      {
        path: 'articles',
        loadChildren: () => import('./articles/articles.routes').then(r => r.articleRoutes),
        title: 'Quản lý bài viết'
      },
      {
        path: 'categories',
        loadComponent: () => import('./categories/categories.component').then(c => c.CategoriesComponent),
        title: 'Quản lý danh mục'
      },
      {
        path: 'plant-manager',
        loadChildren: () => import('./plant-manager/plant-manager.routes').then(r => r.plantManagerRoutes),
        title: 'Quản lý cây trồng'
      },
      {
        path: 'profile/edit',
        loadComponent: () => import('./profile/edit-expert-profile/edit-expert-profile.component').then(c => c.EditExpertProfileComponent),
        title: 'Chỉnh sửa hồ sơ chuyên gia'
      },
      {
        path: 'profile/view',
        loadComponent: () => import('./profile/view-expert-profile/view-expert-profile.component').then(c => c.ViewExpertProfileComponent),
        title: 'Xem hồ sơ chuyên gia'
      },
      {
        path: 'reports',
        loadComponent: () => import('./reports/expert-reports.component').then(c => c.ExpertReportsComponent),
        title: 'Báo cáo thống kê'
      }
    ]
  }
];
