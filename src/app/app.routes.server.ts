import { RenderMode, ServerRoute } from '@angular/ssr';

export const serverRoutes: ServerRoute[] = [
  // Routes that require server-side rendering (authentication, dynamic content)
  {
    path: 'my-green-space/my-garden',
    renderMode: RenderMode.Server // Requires authentication
  },
  {
    path: 'profile/change-password',
    renderMode: RenderMode.Client // Debug: force client-side rendering
  },
  {
    path: 'profile/**',
    renderMode: RenderMode.Server // All other profile routes require authentication
  },
  // Add plant route with parameters - use Client rendering
  {
    path: 'user/add-plant/:plantId',
    renderMode: RenderMode.Client
  },
  {
    path: 'user/**',
    renderMode: RenderMode.Server // User routes require authentication
  },
  // Admin routes with parameters - use Client rendering first
  {
    path: 'admin/plants/edit/:id',
    renderMode: RenderMode.Client
  },
  {
    path: 'admin/plants/view/:id',
    renderMode: RenderMode.Client
  },
  {
    path: 'admin/**',
    renderMode: RenderMode.Server // All other admin routes require authentication
  },
  // Plant detail routes with parameters - use Client rendering
  {
    path: 'plant-detail/:id',
    renderMode: RenderMode.Client
  },
  {
    path: 'plant-info/detail/:id',
    renderMode: RenderMode.Client
  },
  // Static routes can be prerendered
  {
    path: '**',
    renderMode: RenderMode.Prerender
  }
];
