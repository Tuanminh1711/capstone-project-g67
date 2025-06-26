import { Route } from '@angular/router';
import { TicketListComponent } from './ticket-list.component';

export const TICKET_LIST_ROUTES: Route[] = [
  {
    path: '',
    component: TicketListComponent,
    title: 'Danh sách ticket hỗ trợ'
  }
]; 