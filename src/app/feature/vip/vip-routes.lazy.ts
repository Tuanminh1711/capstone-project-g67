import { Routes } from '@angular/router';
import { VipAuthGuard } from '../../auth/vip-auth.guard';

const VIP_ROUTES: Routes = [
  {
    path: '',
    canActivateChild: [VipAuthGuard],
    children: [
      {
        path: '',
        redirectTo: 'welcome',
        pathMatch: 'full'
      },
      {
        path: 'welcome',
        loadComponent: () => import('./welcome/welcome-vip.component').then(m => m.WelcomeVipComponent),
        title: 'Chào mừng VIP'
      },
      {
        path: 'chat',
        loadComponent: () => import('./chat/chat.component').then(m => m.ChatComponent),
        title: 'Chat VIP'
      },
      {
        path: 'chat-community',
        loadComponent: () => import('./chat/chat.component').then(m => m.ChatComponent),
        title: 'Chat cộng đồng'
      },
      {
        path: 'chat-expert',
        loadComponent: () => import('./chat/chat.component').then(m => m.ChatComponent),
        title: 'Chat với chuyên gia'
      },
      {
        path: 'chat-expert/:expertId',
        loadComponent: () => import('./chat/chat.component').then(m => m.ChatComponent),
        title: 'Chat với chuyên gia'
      },
      {
        path: 'chat/chat-private',
        loadComponent: () => import('./chat/chat.component').then(m => m.ChatComponent),
        title: 'Chat riêng tư'
      },
      {
        path: 'ai-plant',
        loadComponent: () => import('./ai-plant/ai-plant.component').then(m => m.AiPlantComponent),
        title: 'AI Chăm sóc cây'
      },
      {
        path: 'disease-detection',
        loadComponent: () => import('./disease-detection/disease-detection.component').then(m => m.DiseaseDetectionComponent),
        title: 'Phát hiện bệnh cây'
      }
    ]
  }
];

export default VIP_ROUTES;
