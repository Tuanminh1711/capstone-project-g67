import { Routes } from '@angular/router';
import { SendResponseComponent } from './send-response.component';

export const SEND_RESPONSE_ROUTES: Routes = [
  {
    path: ':id/response',
    component: SendResponseComponent
  }
]; 