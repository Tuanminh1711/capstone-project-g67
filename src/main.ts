// Polyfill cho biến global để fix lỗi stompjs/sockjs-client trong trình duyệt
(window as any).global = window;
import '@angular/compiler';
import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { App } from './app/app';

bootstrapApplication(App, {
  ...appConfig
})
  .catch((err) => { /* Bootstrap error handled */ });
