import { Routes } from '@angular/router';
import { UserAuthGuard } from '../../auth/user-auth.guard';

const USER_ROUTES: Routes = [
  {
    path: '',
    canActivateChild: [UserAuthGuard],
    children: [
      // Plant management
      { 
        path: 'my-garden', 
        loadComponent: () => import('./plant/my-garden/my-garden.component').then(m => m.MyGardenComponent),
        title: 'Vườn cây của tôi'
      },
      { 
        path: 'create-new-plant', 
        loadComponent: () => import('./plant/create-plants/create-new-plant.component').then(m => m.CreateNewPlantComponent),
        title: 'Thêm cây mới'
      },
      { 
        path: 'user-plant-detail/:id', 
        loadComponent: () => import('./plant/view-user-plant-detail/view-user-plant-detail.component').then(m => m.ViewUserPlantDetailComponent),
        title: 'Chi tiết cây'
      },
      { 
        path: 'update-plant/:id', 
        loadComponent: () => import('./plant/update-plant/update-plant.component').then(m => m.UpdatePlantComponent),
        title: 'Cập nhật cây'
      },
      { 
        path: 'plant-care-calendar/:userPlantId', 
        loadComponent: () => import('./plant/plant-care-calendar/plant-care-calendar.component').then(m => m.PlantCareCalendarComponent),
        title: 'Lịch chăm sóc cây'
      },
      { 
        path: 'plant-care-reminder/:userPlantId', 
        loadComponent: () => import('./plant/plant-care-reminder-setup/plant-care-reminder-setup.component').then(m => m.PlantCareReminderSetupComponent),
        title: 'Thiết lập nhắc nhở'
      },
      { 
        path: 'add-plant/:plantId', 
        loadComponent: () => import('./plant/add-plant/add-plant.component').then(m => m.AddPlantComponent),
        title: 'Thêm cây vào vườn'
      },
      { 
        path: 'report-plant/:id', 
        loadComponent: () => import('./plant/report-plant/report-plant-page.component').then(m => m.ReportPlantPageComponent),
        title: 'Báo cáo cây'
      },
      { 
        path: 'plant/care-confirm', 
        loadComponent: () => import('./plant/care-confirm/care-confirm.component').then(m => m.CareConfirmComponent),
        title: 'Xác nhận chăm sóc'
      },
      
      // Articles
      { 
        path: 'articles', 
        redirectTo: 'articles/list', 
        pathMatch: 'full' 
      },
      { 
        path: 'articles/list', 
        loadComponent: () => import('./articles/list/user-articles-list.component').then(m => m.UserArticlesListComponent),
        title: 'Danh sách bài viết'
      },
      { 
        path: 'articles/:id', 
        loadComponent: () => import('./articles/detail/user-article-detail.component').then(m => m.UserArticleDetailComponent),
        title: 'Chi tiết bài viết'
      },
      
      // Reports
      { 
        path: 'report', 
        loadComponent: () => import('./report/list/report-list.component').then(m => m.ReportListComponent),
        title: 'Báo cáo'
      },
      { 
        path: 'report/:id', 
        loadComponent: () => import('./report/detail/report-detail.component').then(m => m.ReportDetailComponent),
        title: 'Chi tiết báo cáo'
      },
      
      // Chat AI
      { 
        path: 'chat-ai', 
        loadComponent: () => import('./chat-ai/chat-ai.component').then(m => m.ChatAiComponent),
        title: 'Chat AI'
      },
      
      // Payment
      { 
        path: 'create-payment/vip-payment', 
        loadComponent: () => import('./create-payment/vip-payment.component').then(m => m.VipPaymentComponent),
        title: 'Nâng cấp VIP'
      },
      
      // Profile
      { 
        path: 'profile', 
        redirectTo: 'profile/view', 
        pathMatch: 'full' 
      },
      { 
        path: 'profile/view', 
        loadComponent: () => import('./profile/view-user-profile/view-user-profile.component').then(m => m.ViewUserProfileComponent),
        title: 'Hồ sơ cá nhân'
      },
      { 
        path: 'profile/edit', 
        loadComponent: () => import('./profile/edit-user-profile/edit-user-profile.component').then(m => m.EditUserProfileComponent),
        title: 'Chỉnh sửa hồ sơ'
      },
      { 
        path: 'profile/change-password', 
        loadComponent: () => import('./profile/change-password/change-password.component').then(m => m.ChangePasswordComponent),
        title: 'Đổi mật khẩu'
      },
      
      // Activity logs
      { 
        path: 'activity-logs', 
        loadComponent: () => import('./activity-logs/activity-logs.component').then(m => m.ActivityLogsComponent),
        title: 'Lịch sử hoạt động'
      },
      
      // Notifications
      { 
        path: 'notification', 
        loadComponent: () => import('./notification/list/notification-list.component').then(m => m.NotificationListComponent),
        title: 'Thông báo'
      },
      
      // Support tickets
      { 
        path: 'my-tickets', 
        loadComponent: () => import('./ticket/view-ticket/view-ticket.component').then(m => m.ViewTicketComponent),
        title: 'Hỗ trợ của tôi'
      },
      { 
        path: 'my-tickets/:ticketId', 
        loadComponent: () => import('./ticket/view-ticket/view-ticket.component').then(m => m.ViewTicketComponent),
        title: 'Chi tiết hỗ trợ'
      },
      
      // Redirects for old paths
      { 
        path: 'collection', 
        redirectTo: 'my-garden', 
        pathMatch: 'full' 
      },
      { 
        path: 'collection/add-plant/:plantId', 
        redirectTo: 'add-plant/:plantId', 
        pathMatch: 'full' 
      }
    ]
  }
];

export default USER_ROUTES;
