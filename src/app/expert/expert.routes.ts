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
  }
];
