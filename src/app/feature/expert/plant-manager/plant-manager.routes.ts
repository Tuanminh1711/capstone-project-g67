import { Routes } from '@angular/router';

export const plantManagerRoutes: Routes = [
  {
    path: '',
    redirectTo: 'diseases',
    pathMatch: 'full'
  },
  {
    path: 'diseases',
    loadChildren: () => import('./diseases/diseases.routes').then(r => r.diseaseRoutes),
    title: 'Quản lý bệnh cây'
  },
  {
    path: 'treatment-guides',
    loadChildren: () => import('./treatment-guides/treatment-guides.routes').then(r => r.treatmentGuideRoutes),
    title: 'Quản lý hướng dẫn điều trị'
  }
];
