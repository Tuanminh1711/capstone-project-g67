import { Routes } from '@angular/router';

export const diseaseRoutes: Routes = [
  {
    path: '',
    redirectTo: 'list',
    pathMatch: 'full'
  },
  {
    path: 'list',
    loadComponent: () => import('./list/disease-list.component').then(c => c.DiseaseListComponent),
    title: 'Danh sách bệnh cây'
  },
  {
    path: 'create',
    loadComponent: () => import('./create/create-disease.component').then(c => c.CreateDiseaseComponent),
    title: 'Tạo bệnh cây mới'
  },
  {
    path: ':id',
    loadComponent: () => import('./detail/disease-detail.component').then(c => c.DiseaseDetailComponent),
    title: 'Chi tiết bệnh cây'
  },
  {
    path: ':id/edit',
    loadComponent: () => import('./edit/edit-disease.component').then(c => c.EditDiseaseComponent),
    title: 'Chỉnh sửa bệnh cây'
  },
  {
    path: ':id/treatment',
    loadChildren: () => import('../treatment-guides/treatment-guides.routes').then(m => m.treatmentGuideRoutes),
    title: 'Quản lý hướng dẫn điều trị'
  }
];
