import { mergeApplicationConfig, ApplicationConfig } from '@angular/core';
// Đã xoá: import { provideServerRendering, withRoutes } from '@angular/ssr';
import { appConfig } from './app.config';

// Nếu cần SSR, hãy cấu hình lại theo hướng dẫn Angular 20 hoặc bỏ qua phần này nếu chỉ FE
const serverConfig: ApplicationConfig = {
  providers: [
    // SSR: Cấu hình lại ở đây nếu cần
    // provideServerRendering(withRoutes(serverRoutes))
  ]
};

export const config = mergeApplicationConfig(appConfig, serverConfig);
