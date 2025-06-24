import { Routes } from '@angular/router';
import { TicketDetailComponent } from './ticket-detail.component';

export const TICKET_DETAIL_ROUTES: Routes = [
  {
    path: ':id',
    component: TicketDetailComponent
  }
]; 