import { Routes } from '@angular/router';
import { ExpertAuthGuard } from '../auth/expert-auth.guard';

export const expertRoutes: Routes = [
  {
    path: '',
    redirectTo: 'welcome',
    pathMatch: 'full'
  },
  {
    path: 'welcome',
    loadComponent: () => import('./welcome/welcome-expert.component').then(c => c.WelcomeExpertComponent),
    title: 'Chào mừng Chuyên gia',
    canActivate: [ExpertAuthGuard]
  },
  {
    path: 'chat',
    loadComponent: () => import('./chat/expert-chat.component').then(c => c.ExpertChatComponent),
    title: 'Phòng Chat Chuyên gia',
    canActivate: [ExpertAuthGuard]
  },
  {
    path: 'private-chat',
    loadComponent: () => import('./chat/expert-private-chat.component').then(c => c.ExpertPrivateChatComponent),
    title: 'Tin nhắn riêng tư - Chuyên gia',
    canActivate: [ExpertAuthGuard]
  },
  {
    path: 'categories',
    loadComponent: () => import('./categories/categories.component').then(c => c.CategoriesComponent),
    title: 'Quản lý danh mục bài viết',
    canActivate: [ExpertAuthGuard]
  },
  {
    path: 'articles',
    loadComponent: () => import('./articles/articles.component').then(c => c.ArticlesComponent),
    title: 'Quản lý bài viết chuyên gia',
    canActivate: [ExpertAuthGuard]
  }
];
