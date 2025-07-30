// Polyfill cho biến global để fix lỗi stompjs/sockjs-client trong trình duyệt
(window as any).global = window;
import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { App } from './app/app';
import { provideCharts, withDefaultRegisterables } from 'ng2-charts';

bootstrapApplication(App, {
  ...appConfig,
  providers: [...(appConfig.providers || []), provideCharts(withDefaultRegisterables())]
})
  .catch((err) => console.error(err));
