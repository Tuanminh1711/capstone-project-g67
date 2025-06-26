import { Route } from '@angular/router';
import { ReportListComponent } from './report-list.component';
import { ReportDetailComponent } from './report-detail.component';
import { ReportApproveRejectComponent } from './report-approve-reject.component';
import { SendResponseComponent } from '../ticket-list/send-response.component';

export const REPORT_LIST_ROUTES: Route[] = [
  {
    path: '',
    component: ReportListComponent,
    title: 'Danh sách báo cáo'
  },
  {
    path: ':id',
    component: ReportDetailComponent,
    title: 'Chi tiết báo cáo'
  },
  {
    path: 'approve-reject',
    component: ReportApproveRejectComponent,
    title: 'Duyệt/Từ chối báo cáo'
  },
  {
    path: ':id/send-response',
    component: SendResponseComponent,
    title: 'Gửi phản hồi báo cáo'
  }
]; 