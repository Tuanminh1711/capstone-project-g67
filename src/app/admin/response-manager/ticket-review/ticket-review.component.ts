import { Component, OnInit, Injectable } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { AdminLayoutComponent } from '../../../shared/admin-layout/admin-layout.component';

// Models cho ticket-review
export interface TicketReview {
  id: number;
  title: string;
  description: string;
  status: 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED';
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  category: 'TECHNICAL_SUPPORT' | 'ACCOUNT_ISSUE' | 'FEATURE_REQUEST' | 'BUG_REPORT' | 'OTHER';
  createdAt: string;
  createdBy: {
    id: number;
    username: string;
    email: string;
  };
  attachments: string[];
}

export interface TicketUpdateRequest {
  ticketId: number;
  status: 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED';
  assignedToId?: number;
  comment: string;
}

// Service cho ticket-review
@Injectable({
  providedIn: 'root'
})
export class TicketReviewService {
  constructor(private http: HttpClient) {}

  getTicketForReview(id: number): Observable<TicketReview> {
    // Mock data for now
    const mockTicket: TicketReview = {
      id: id,
      title: `Ticket #${id} - Support Request`,
      description: 'This is a detailed description of the support ticket.',
      status: 'OPEN',
      priority: 'HIGH',
      category: 'TECHNICAL_SUPPORT',
      createdAt: '2024-01-15T10:30:00Z',
      createdBy: {
        id: 1,
        username: 'user123',
        email: 'user123@example.com'
      },
      attachments: []
    };

    return of(mockTicket);
  }

  updateTicket(updateData: TicketUpdateRequest): Observable<any> {
    // Mock API call
    return of({ success: true, message: 'Ticket updated successfully' });
  }
}

@Component({
  selector: 'app-ticket-review',
  standalone: true,
  imports: [CommonModule, FormsModule, AdminLayoutComponent],
  templateUrl: './ticket-review.component.html',
  styleUrls: ['./ticket-review.component.scss']
})
export class TicketReviewComponent implements OnInit {
  ticket: TicketReview | null = null;
  loading = false;
  submitting = false;
  errorMsg = '';
  successMsg = '';
  ticketId: number = 0;

  // Form data
  newStatus: 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED' = 'IN_PROGRESS';
  comment: string = '';

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private reviewService: TicketReviewService
  ) {}

  ngOnInit() {
    this.loadTicket();
  }

  loadTicket() {
    this.loading = true;
    this.errorMsg = '';
    this.ticketId = Number(this.route.snapshot.paramMap.get('id'));
    
    this.reviewService.getTicketForReview(this.ticketId).subscribe({
      next: (ticket) => {
        this.ticket = ticket;
        this.newStatus = ticket.status;
        this.loading = false;
      },
      error: (error) => {
        this.errorMsg = 'Không thể tải thông tin ticket.';
        this.loading = false;
      }
    });
  }

  submitUpdate() {
    if (!this.comment.trim()) {
      this.errorMsg = 'Vui lòng nhập comment.';
      return;
    }

    this.submitting = true;
    this.errorMsg = '';
    this.successMsg = '';

    const updateData: TicketUpdateRequest = {
      ticketId: this.ticketId,
      status: this.newStatus,
      comment: this.comment.trim()
    };

    this.reviewService.updateTicket(updateData).subscribe({
      next: (response) => {
        this.successMsg = 'Cập nhật ticket thành công!';
        this.submitting = false;
        
        setTimeout(() => {
          this.router.navigate(['/admin/response-manager/ticket-list']);
        }, 2000);
      },
      error: (error) => {
        this.errorMsg = 'Có lỗi xảy ra khi cập nhật ticket.';
        this.submitting = false;
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

  goBack() {
    this.router.navigate(['/admin/response-manager/ticket-detail', this.ticketId]);
  }

  goToList() {
    this.router.navigate(['/admin/response-manager/ticket-list']);
  }
}
