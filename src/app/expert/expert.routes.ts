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
    loadComponent: () => import('./articles/list/articles.component').then(c => c.ArticlesComponent),
    title: 'Danh sách bài viết',
    canActivate: [ExpertAuthGuard]
  },
  {
    path: 'articles-detail/:id',
    loadComponent: () => import('./articles/detail/article-detail.component').then(c => c.ArticleDetailComponent),
    title: 'Chi tiết bài viết',
    canActivate: [ExpertAuthGuard]
  },
  {
    path: 'articles/add',
    loadComponent: () => import('./articles/create/create-article.component').then(c => c.CreateArticleComponent),
    title: 'Tạo bài viết mới',
    canActivate: [ExpertAuthGuard]
  },
  {
    path: 'articles/edit/:id',
    loadComponent: () => import('./articles/edit/edit-article.component').then(c => c.EditArticleComponent),
    title: 'Chỉnh sửa bài viết',
    canActivate: [ExpertAuthGuard]
  }
];
