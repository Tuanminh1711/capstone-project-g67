import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AdminTopNavigatorComponent } from '../../shared/admin-top-navigator/admin-top-navigator.component';
import { AdminSidebarComponent } from '../../shared/admin-sidebar/admin-sidebar.component';
import { AdminFooterComponent } from '../../shared/admin-footer/admin-footer.component';
import { Ticket } from './ticket-list.component';

export interface TicketResponse {
  id: number;
  ticketId: number;
  content: string;
  createdBy: string;
  createdAt: string;
  isAdminResponse: boolean;
}

export interface TicketDetail extends Ticket {
  responses: TicketResponse[];
  attachments?: string[];
  tags?: string[];
  email: string;
}

@Component({
  selector: 'app-ticket-detail',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, AdminTopNavigatorComponent, AdminSidebarComponent, AdminFooterComponent],
  templateUrl: './ticket-detail.component.html',
  styleUrls: ['./ticket-detail.component.scss']
})
export class TicketDetailComponent implements OnInit {
  ticket: TicketDetail | null = null;
  loading = false;
  errorMsg = '';
  ticketId: number = 0;
  newResponse: string = '';

  constructor(
    private route: ActivatedRoute,
    private router: Router
  ) {}

  ngOnInit() {
    this.loading = true;
    this.ticketId = Number(this.route.snapshot.paramMap.get('id'));
    
    // TODO: Replace with real API call
    setTimeout(() => {
      // Mock data for demonstration
      this.ticket = {
        id: this.ticketId,
        title: 'Không thể đăng nhập vào tài khoản',
        description: 'Tôi không thể đăng nhập vào tài khoản của mình. Khi tôi nhập username và password, hệ thống báo lỗi "Invalid credentials". Tôi đã thử reset password nhưng vẫn không được.',
        status: 'open',
        priority: 'high',
        category: 'Technical Support',
        createdAt: '2024-01-15 10:30:00',
        createdBy: 'user123',
        assignedTo: 'admin1',
        lastUpdated: '2024-01-15 10:30:00',
        responseCount: 2,
        email: 'user123@gmail.com',
        responses: [
          {
            id: 1,
            ticketId: this.ticketId,
            content: 'Xin chào! Cảm ơn bạn đã liên hệ với chúng tôi. Tôi hiểu vấn đề bạn đang gặp phải. Bạn có thể cho tôi biết thêm thông tin về cây của bạn không?',
            createdBy: 'admin1',
            createdAt: '2025-06-15 11:00:00',
            isAdminResponse: true
          },
          {
            id: 2,
            ticketId: this.ticketId,
            content: 'Cây lan của tôi bị héo .',
            createdBy: 'user123',
            createdAt: '2026-06-15 11:15:00',
            isAdminResponse: false
          }
        ],
        attachments: ['screenshot_error.png', 'error_log.txt'],
        tags: ['login', 'authentication', 'urgent']
      };
      this.loading = false;
    }, 500);
  }

  getStatusClass(status: string): string {
    switch (status.toLowerCase()) {
      case 'open': return 'status-open';
      case 'in_progress': return 'status-in-progress';
      case 'resolved': return 'status-resolved';
      case 'closed': return 'status-closed';
      default: return '';
    }
  }

  getStatusText(status: string): string {
    switch (status.toLowerCase()) {
      case 'open': return 'Mở';
      case 'in_progress': return 'Đang xử lý';
      case 'resolved': return 'Đã giải quyết';
      case 'closed': return 'Đã đóng';
      default: return status;
    }
  }

  getPriorityClass(priority: string): string {
    switch (priority.toLowerCase()) {
      case 'low': return 'priority-low';
      case 'medium': return 'priority-medium';
      case 'high': return 'priority-high';
      case 'urgent': return 'priority-urgent';
      default: return '';
    }
  }

  getPriorityText(priority: string): string {
    switch (priority.toLowerCase()) {
      case 'low': return 'Thấp';
      case 'medium': return 'Trung bình';
      case 'high': return 'Cao';
      case 'urgent': return 'Khẩn cấp';
      default: return priority;
    }
  }

  getCategoryText(category: string): string {
    switch (category) {
      case 'Technical Support': return 'Hỗ trợ kỹ thuật';
      case 'Feature Request': return 'Yêu cầu tính năng';
      case 'Bug Report': return 'Báo lỗi';
      case 'Payment Support': return 'Hỗ trợ thanh toán';
      default: return category;
    }
  }

  updateStatus(newStatus: 'open' | 'in_progress' | 'resolved' | 'closed') {
    if (this.ticket) {
      this.ticket.status = newStatus;
      this.ticket.lastUpdated = new Date().toISOString();
      // TODO: Call API to update status
    }
  }

  onAssignChange(event: Event) {
    const target = event.target as HTMLSelectElement;
    const assignedTo = target.value;
    this.assignTicket(assignedTo);
  }

  assignTicket(assignedTo: string) {
    if (this.ticket) {
      this.ticket.assignedTo = assignedTo;
      this.ticket.lastUpdated = new Date().toISOString();
      // TODO: Call API to assign ticket
    }
  }

  sendResponse() {
    if (!this.newResponse.trim()) {
      this.errorMsg = 'Vui lòng nhập nội dung phản hồi.';
      setTimeout(() => this.errorMsg = '', 3000);
      return;
    }

    if (!this.ticket) return;

    const response: TicketResponse = {
      id: this.ticket.responses.length + 1,
      ticketId: this.ticket.id,
      content: this.newResponse,
      createdBy: 'admin1', // TODO: Get from auth service
      createdAt: new Date().toISOString(),
      isAdminResponse: true
    };

    this.ticket.responses.push(response);
    this.ticket.responseCount = this.ticket.responses.length;
    this.ticket.lastUpdated = new Date().toISOString();
    this.newResponse = '';

    // TODO: Call API to send response
    this.successMsg = 'Phản hồi đã được gửi thành công!';
    setTimeout(() => this.successMsg = '', 3000);
  }

  goBack() {
    this.router.navigate(['/admin/tickets']);
  }

  get successMsg(): string {
    return this._successMsg;
  }

  set successMsg(value: string) {
    this._successMsg = value;
  }

  private _successMsg: string = '';
} 