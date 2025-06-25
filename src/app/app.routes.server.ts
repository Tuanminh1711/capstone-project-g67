import { RenderMode, ServerRoute } from '@angular/ssr';

export const serverRoutes: ServerRoute[] = [
  // Routes that require server-side rendering (authentication, dynamic content)
  {
    path: 'admin/plants/edit/:id',
    renderMode: RenderMode.Server
  },
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
  {
    path: 'admin/**',
    renderMode: RenderMode.Server // All admin routes require authentication
  },
  // Static routes can be prerendered
  {
    path: '**',
    renderMode: RenderMode.Prerender
  }
];
