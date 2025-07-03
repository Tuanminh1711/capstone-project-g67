import { Component, OnInit, Injectable } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { AdminLayoutComponent } from '../../../shared/admin-layout/admin-layout.component';

// Models cho ticket-detail
export interface TicketDetail {
  id: number;
  title: string;
  description: string;
  status: 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED';
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  category: 'TECHNICAL_SUPPORT' | 'ACCOUNT_ISSUE' | 'FEATURE_REQUEST' | 'BUG_REPORT' | 'OTHER';
  createdAt: string;
  updatedAt: string;
  createdBy: {
    id: number;
    username: string;
    email: string;
  };
  assignedTo?: {
    id: number;
    username: string;
    email: string;
  };
  comments: TicketComment[];
  attachments: string[];
}

export interface TicketComment {
  id: number;
  content: string;
  createdAt: string;
  createdBy: {
    id: number;
    username: string;
    email: string;
  };
}

// Service cho ticket-detail
@Injectable({
  providedIn: 'root'
})
export class TicketDetailService {
  constructor(private http: HttpClient) {}

  getTicketDetail(id: number): Observable<TicketDetail> {
    // Mock data for now
    const mockTicket: TicketDetail = {
      id: id,
      title: `Ticket #${id} - Support Request`,
      description: 'This is a detailed description of the support ticket.',
      status: 'OPEN',
      priority: 'HIGH',
      category: 'TECHNICAL_SUPPORT',
      createdAt: '2024-01-15T10:30:00Z',
      updatedAt: '2024-01-15T10:30:00Z',
      createdBy: {
        id: 1,
        username: 'user123',
        email: 'user123@example.com'
      },
      comments: [
        {
          id: 1,
          content: 'Initial comment from user',
          createdAt: '2024-01-15T10:30:00Z',
          createdBy: {
            id: 1,
            username: 'user123',
            email: 'user123@example.com'
          }
        }
      ],
      attachments: []
    };

    return of(mockTicket);
  }
}

@Component({
  selector: 'app-ticket-detail',
  standalone: true,
  imports: [CommonModule, AdminLayoutComponent],
  templateUrl: './ticket-detail.component.html',
  styleUrls: ['./ticket-detail.component.scss']
})
export class TicketDetailComponent implements OnInit {
  ticket: TicketDetail | null = null;
  loading = false;
  errorMsg = '';
  ticketId: number = 0;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private ticketService: TicketDetailService
  ) {}

  ngOnInit() {
    this.loadTicket();
  }

  loadTicket() {
    this.loading = true;
    this.errorMsg = '';
    this.ticketId = Number(this.route.snapshot.paramMap.get('id'));
    
    this.ticketService.getTicketDetail(this.ticketId).subscribe({
      next: (ticket) => {
        this.ticket = ticket;
        this.loading = false;
      },
      error: (error) => {
        this.errorMsg = 'Không thể tải chi tiết ticket.';
        this.loading = false;
      }
    });
  }

  getStatusText(status: string): string {
    switch (status) {
      case 'OPEN': return 'Mở';
      case 'IN_PROGRESS': return 'Đang xử lý';
      case 'RESOLVED': return 'Đã giải quyết';
      case 'CLOSED': return 'Đã đóng';
      default: return status;
    }
  }

  getPriorityText(priority: string): string {
    switch (priority) {
      case 'LOW': return 'Thấp';
      case 'MEDIUM': return 'Trung bình';
      case 'HIGH': return 'Cao';
      case 'URGENT': return 'Khẩn cấp';
      default: return priority;
    }
  }

  getCategoryText(category: string): string {
    switch (category) {
      case 'TECHNICAL_SUPPORT': return 'Hỗ trợ kỹ thuật';
      case 'ACCOUNT_ISSUE': return 'Vấn đề tài khoản';
      case 'FEATURE_REQUEST': return 'Yêu cầu tính năng';
      case 'BUG_REPORT': return 'Báo lỗi';
      case 'OTHER': return 'Khác';
      default: return category;
    }
  }

  formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleString('vi-VN');
  }

  goToReview() {
    this.router.navigate(['/admin/response-manager/ticket-review', this.ticketId]);
  }

  goBack() {
    this.router.navigate(['/admin/response-manager/ticket-list']);
  }
}
