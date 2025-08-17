import { Route } from '@angular/router';

export const articleRoutes: Route[] = [
  {
    path: '',
    loadComponent: () => import('./list/articles.component').then(c => c.ArticlesComponent),
    title: 'Danh sách bài viết'
  },
  {
    path: 'detail/:id',
    loadComponent: () => import('./detail/article-detail.component').then(c => c.ArticleDetailComponent),
    title: 'Chi tiết bài viết'
  },
  {
    path: 'add',
    loadComponent: () => import('./create/create-article.component').then(c => c.CreateArticleComponent),
    title: 'Tạo bài viết mới'
  },
  {
    path: 'edit/:id',
    loadComponent: () => import('./edit/edit-article.component').then(c => c.EditArticleComponent),
    title: 'Chỉnh sửa bài viết'
  }
];
