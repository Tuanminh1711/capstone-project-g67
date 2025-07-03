import { Component, OnInit, Injectable } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { AdminLayoutComponent } from '../../../shared/admin-layout/admin-layout.component';

// Models cho ticket-list
export interface TicketSummary {
  id: number;
  title: string;
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
}

export interface TicketListResponse {
  tickets: TicketSummary[];
  totalElements: number;
  totalPages: number;
  currentPage: number;
}

// Service cho ticket-list
@Injectable({
  providedIn: 'root'
})
export class TicketListService {
  constructor(private http: HttpClient) {}

  getTickets(page: number = 0, size: number = 10, searchKeyword: string = ''): Observable<TicketListResponse> {
    // Mock data for now
    const mockTickets: TicketSummary[] = [
      {
        id: 1,
        title: 'Cannot login to the system',
        status: 'OPEN',
        priority: 'HIGH',
        category: 'TECHNICAL_SUPPORT',
        createdAt: '2024-01-15T10:30:00Z',
        updatedAt: '2024-01-15T10:30:00Z',
        createdBy: {
          id: 1,
          username: 'user123',
          email: 'user123@example.com'
        }
      },
      {
        id: 2,
        title: 'Feature request: Dark mode',
        status: 'IN_PROGRESS',
        priority: 'MEDIUM',
        category: 'FEATURE_REQUEST',
        createdAt: '2024-01-14T09:15:00Z',
        updatedAt: '2024-01-15T11:00:00Z',
        createdBy: {
          id: 2,
          username: 'user456',
          email: 'user456@example.com'
        },
        assignedTo: {
          id: 10,
          username: 'admin',
          email: 'admin@example.com'
        }
      }
    ];

    // Filter by search keyword if provided
    let filteredTickets = mockTickets;
    if (searchKeyword.trim()) {
      const keyword = searchKeyword.toLowerCase();
      filteredTickets = mockTickets.filter(ticket => 
        ticket.title.toLowerCase().includes(keyword) ||
        ticket.createdBy.username.toLowerCase().includes(keyword)
      );
    }

    const response: TicketListResponse = {
      tickets: filteredTickets,
      totalElements: filteredTickets.length,
      totalPages: Math.ceil(filteredTickets.length / size),
      currentPage: page
    };

    return of(response);
  }
}

@Component({
  selector: 'app-ticket-list',
  standalone: true,
  imports: [CommonModule, FormsModule, AdminLayoutComponent],
  template: `
    <app-admin-layout>
      <div class="ticket-list-container">
        <h1>Danh sách Ticket</h1>
        
        <div class="search-section">
        <input 
          type="text" 
          [(ngModel)]="searchKeyword" 
          placeholder="Tìm kiếm ticket..."
          (keyup.enter)="onSearch()">
        <button (click)="onSearch()">Tìm kiếm</button>
      </div>
      
      <div *ngIf="loading">Đang tải...</div>
      
      <div *ngIf="errorMsg" class="error">{{ errorMsg }}</div>
      
      <div *ngIf="!loading && tickets.length === 0" class="no-data">
        Không có ticket nào.
      </div>
      
      <div *ngIf="tickets.length > 0" class="tickets-table">
        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>Tiêu đề</th>
              <th>Trạng thái</th>
              <th>Độ ưu tiên</th>
              <th>Người tạo</th>
              <th>Ngày tạo</th>
              <th>Thao tác</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let ticket of tickets">
              <td>{{ ticket.id }}</td>
              <td>{{ ticket.title }}</td>
              <td><span [class]="getStatusClass(ticket.status)">{{ getStatusText(ticket.status) }}</span></td>
              <td><span [class]="getPriorityClass(ticket.priority)">{{ getPriorityText(ticket.priority) }}</span></td>
              <td>{{ ticket.createdBy.username }}</td>
              <td>{{ formatDate(ticket.createdAt) }}</td>
              <td>
                <button (click)="viewTicketDetail(ticket.id)">Xem</button>
                <button (click)="editTicket(ticket.id)">Xử lý</button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      
      <!-- Pagination -->
      <div *ngIf="totalPages > 1" class="pagination">
        <button (click)="prevPage()" [disabled]="currentPage === 0">Trước</button>
        <span>{{ currentPage + 1 }} / {{ totalPages }}</span>
        <button (click)="nextPage()" [disabled]="currentPage >= totalPages - 1">Sau</button>
      </div>
    </div>
  `,
  styles: [`
    .ticket-list-container {
      padding: 20px;
    }
    
    .search-section {
      margin-bottom: 20px;
      display: flex;
      gap: 10px;
    }
    
    .search-section input {
      flex: 1;
      padding: 8px;
      border: 1px solid #ddd;
      border-radius: 4px;
    }
    
    .tickets-table table {
      width: 100%;
      border-collapse: collapse;
    }
    
    .tickets-table th,
    .tickets-table td {
      padding: 8px;
      text-align: left;
      border-bottom: 1px solid #ddd;
    }
    
    .tickets-table th {
      background-color: #f5f5f5;
    }
    
    .pagination {
      margin-top: 20px;
      text-align: center;
    }
    
    .pagination button {
      margin: 0 10px;
      padding: 8px 16px;
    }
    
    .error {
      color: red;
      background: #ffebee;
      padding: 10px;
      border-radius: 4px;
      margin: 10px 0;
    }
    
    .no-data {
      text-align: center;
      padding: 40px;
      color: #666;
    }
    
    .status-open { color: #f44336; }
    .status-progress { color: #ff9800; }
    .status-resolved { color: #4caf50; }
    .status-closed { color: #9e9e9e; }
    
    .priority-low { color: #4caf50; }
    .priority-medium { color: #ff9800; }
    .priority-high { color: #f44336; }
    .priority-urgent { color: #e91e63; }
  `]
})
export class TicketListComponent implements OnInit {
  tickets: TicketSummary[] = [];
  loading = false;
  errorMsg = '';
  
  // Pagination
  currentPage = 0;
  pageSize = 10;
  totalPages = 0;
  totalElements = 0;
  
  // Search
  searchKeyword = '';

  constructor(
    private router: Router,
    private ticketService: TicketListService
  ) {}

  ngOnInit() {
    this.loadTickets();
  }

  loadTickets() {
    this.loading = true;
    this.errorMsg = '';
    
    this.ticketService.getTickets(this.currentPage, this.pageSize, this.searchKeyword).subscribe({
      next: (response) => {
        this.tickets = response.tickets;
        this.totalElements = response.totalElements;
        this.totalPages = response.totalPages;
        this.currentPage = response.currentPage;
        this.loading = false;
      },
      error: (error) => {
        this.errorMsg = 'Không thể tải danh sách ticket.';
        this.loading = false;
      }
    });
  }

  onSearch() {
    this.currentPage = 0;
    this.loadTickets();
  }

  goToPage(page: number) {
    if (page >= 0 && page < this.totalPages) {
      this.currentPage = page;
      this.loadTickets();
    }
  }

  nextPage() {
    if (this.currentPage + 1 < this.totalPages) {
      this.currentPage++;
      this.loadTickets();
    }
  }

  prevPage() {
    if (this.currentPage > 0) {
      this.currentPage--;
      this.loadTickets();
    }
  }

  viewTicketDetail(ticketId: number) {
    this.router.navigate(['/admin/response-manager/ticket-detail', ticketId]);
  }

  editTicket(ticketId: number) {
    this.router.navigate(['/admin/response-manager/ticket-review', ticketId]);
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

  getStatusClass(status: string): string {
    switch (status) {
      case 'OPEN': return 'status-open';
      case 'IN_PROGRESS': return 'status-progress';
      case 'RESOLVED': return 'status-resolved';
      case 'CLOSED': return 'status-closed';
      default: return '';
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

  getPriorityClass(priority: string): string {
    switch (priority) {
      case 'LOW': return 'priority-low';
      case 'MEDIUM': return 'priority-medium';
      case 'HIGH': return 'priority-high';
      case 'URGENT': return 'priority-urgent';
      default: return '';
    }
  }

  formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleString('vi-VN');
  }
}
