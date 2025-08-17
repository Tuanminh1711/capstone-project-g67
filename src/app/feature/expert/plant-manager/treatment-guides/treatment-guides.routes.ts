import { Routes } from '@angular/router';

export const treatmentGuideRoutes: Routes = [
  {
    path: '',
    redirectTo: 'list',
    pathMatch: 'full'
  },
  {
    path: 'list',
    loadComponent: () => import('./treatment-guide-list/treatment-guide-list.component').then(c => c.TreatmentGuideListComponent),
    title: 'Danh sách hướng dẫn điều trị'
  },
  {
    path: 'create',
    loadComponent: () => import('./treatment-guide-create/treatment-guide-create.component').then(c => c.TreatmentGuideCreateComponent),
    title: 'Tạo hướng dẫn điều trị mới'
  },
  {
    path: 'create/:diseaseId',
    loadComponent: () => import('./treatment-guide-create/treatment-guide-create.component').then(c => c.TreatmentGuideCreateComponent),
    title: 'Tạo hướng dẫn điều trị cho bệnh'
  },
  {
    path: 'edit/:guideId',
    loadComponent: () => import('./treatment-guide-edit/treatment-guide-edit.component').then(c => c.TreatmentGuideEditComponent),
    title: 'Chỉnh sửa hướng dẫn điều trị'
  },
  {
    path: 'view/:guideId',
    loadComponent: () => import('./treatment-guide-view/treatment-guide-view.component').then(c => c.TreatmentGuideViewComponent),
    title: 'Xem chi tiết hướng dẫn điều trị'
  }
];
