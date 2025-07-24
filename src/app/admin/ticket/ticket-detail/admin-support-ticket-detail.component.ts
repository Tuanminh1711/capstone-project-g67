import { Component, OnInit, OnDestroy, ChangeDetectorRef, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { AdminSupportTicketDetailService, AdminSupportTicketDetail } from './admin-support-ticket-detail.service';
import { Subscription } from 'rxjs';
import { AdminLayoutComponent } from '../../../shared/admin-layout/admin-layout.component';

@Component({
  selector: 'app-admin-support-ticket-detail',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './admin-support-ticket-detail.component.html',
  styleUrls: ['./admin-support-ticket-detail.component.scss']
})
export class AdminSupportTicketDetailComponent implements OnInit, OnDestroy {
  getActionLabel(action: string): string {
    switch (action) {
      case 'CLAIM': return 'Nhận xử lý';
      case 'RELEASE': return 'Trả lại';
      case 'HANDLE': return 'Xử lý';
      case 'CREATE': return 'Tạo phiếu';
      case 'RESPONSE': return 'Phản hồi';
      case 'CLOSE': return 'Đóng phiếu';
      default: return action;
    }
  }
  ticketId: number = 0;
  ticket: AdminSupportTicketDetail | null = null;
  loading = false;
  error = '';
  routeSub?: Subscription;
  private ticketService = inject(AdminSupportTicketDetailService);

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.routeSub = this.route.params.subscribe(params => {
      const newId = +params['id'];
      if (newId && newId !== this.ticketId) {
        this.ticketId = newId;
        this.loadTicketDetail();
      }
    });
    // Initial load
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.ticketId = +id;
      this.loadTicketDetail();
    }
  }

  ngOnDestroy(): void {
    this.routeSub?.unsubscribe();
  }

  loadTicketDetail(): void {
    if (!this.ticketId || this.ticketId <= 0) {
      this.error = 'ID phiếu hỗ trợ không hợp lệ';
      this.loading = false;
      this.ticket = null;
      return;
    }
    this.loading = true;
    this.error = '';
    this.ticket = null;
    this.ticketService.getTicketDetail(this.ticketId).subscribe({
      next: (ticket) => {
        this.ticket = ticket;
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.error = 'Không tìm thấy phiếu hỗ trợ hoặc có lỗi xảy ra.';
        this.loading = false;
        this.ticket = null;
        this.cdr.detectChanges();
      }
    });
  }
}
