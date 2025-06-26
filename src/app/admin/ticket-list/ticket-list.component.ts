import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AdminTopNavigatorComponent } from '../../shared/admin-top-navigator/admin-top-navigator.component';
import { AdminSidebarComponent } from '../../shared/admin-sidebar/admin-sidebar.component';
import { AdminFooterComponent } from '../../shared/admin-footer/admin-footer.component';
import { BehaviorSubject, Subscription } from 'rxjs';

export interface Ticket {
  id: number;
  title: string;
  description: string;
  status: 'open' | 'in_progress' | 'resolved' | 'closed';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  category: string;
  createdAt: string;
  createdBy: string;
  assignedTo?: string;
  lastUpdated: string;
  responseCount: number;
  email: string;
}

@Component({
  selector: 'app-ticket-list',
  standalone: true,
  imports: [CommonModule, FormsModule, AdminTopNavigatorComponent, AdminSidebarComponent, AdminFooterComponent],
  templateUrl: './ticket-list.component.html',
  styleUrls: ['./ticket-list.component.scss']
})
export class TicketListComponent implements OnInit, OnDestroy {
  private ticketsSubject = new BehaviorSubject<Ticket[]>([]);
  tickets$ = this.ticketsSubject.asObservable();
  allTickets: Ticket[] = [];
  pageNo = 0;
  pageSize = 10;
  totalPages = 1;
  totalElements = 0;
  loading = false;
  errorMsg = '';
  successMsg = '';
  searchText = '';
  currentKeyword = '';
  searchDebounce: any;
  private sub: Subscription = new Subscription();

  sortField: string = '';
  sortDirection: 'asc' | 'desc' = 'asc';

  // Giả lập thông tin đăng nhập và role
  isLoggedIn = true; // Đổi thành false để test chuyển hướng
  userRole: 'admin' | 'staff' | 'user' = 'admin'; // Đổi thành 'user' để test chuyển hướng

  constructor(private router: Router) {}

  ngOnInit() {
    // Kiểm tra phân quyền
    if (!this.isLoggedIn || (this.userRole !== 'admin' && this.userRole !== 'staff')) {
      this.router.navigate(['/login']);
      return;
    }
    this.loadTickets();
  }

  ngOnDestroy() {
    this.sub.unsubscribe();
    clearTimeout(this.searchDebounce);
  }

  loadTickets() {
    this.loading = true;
    this.errorMsg = '';
    this.currentKeyword = '';
    
    // TODO: Replace with real API call
    setTimeout(() => {
      // Mock data for demonstration
      this.allTickets = [
        {
          id: 1,
          title: 'Không thể đăng nhập vào tài khoản',
          description: 'Tôi không thể đăng nhập vào tài khoản của mình',
          status: 'open',
          priority: 'high',
          category: 'Technical Support',
          createdAt: '2024-01-15 10:30:00',
          createdBy: 'user123',
          lastUpdated: '2024-01-15 10:30:00',
          responseCount: 0,
          email: 'user123@gmail.com'
        },
        {
          id: 2,
          title: 'Yêu cầu thêm tính năng mới',
          description: 'Tôi muốn có tính năng lưu trữ cây trồng',
          status: 'in_progress',
          priority: 'medium',
          category: 'Feature Request',
          createdAt: '2024-01-14 15:20:00',
          createdBy: 'user456',
          assignedTo: 'admin1',
          lastUpdated: '2024-01-15 09:15:00',
          responseCount: 3,
          email: 'user456@gmail.com'
        },
        {
          id: 3,
          title: 'Báo lỗi hiển thị hình ảnh',
          description: 'Hình ảnh cây trồng không hiển thị đúng',
          status: 'resolved',
          priority: 'low',
          category: 'Bug Report',
          createdAt: '2024-01-13 09:15:00',
          createdBy: 'user789',
          assignedTo: 'admin2',
          lastUpdated: '2024-01-14 16:45:00',
          responseCount: 5,
          email: 'user789@gmail.com'
        },
        {
          id: 4,
          title: 'Cần hỗ trợ về thanh toán',
          description: 'Tôi gặp vấn đề khi thanh toán qua thẻ tín dụng',
          status: 'closed',
          priority: 'urgent',
          category: 'Payment Support',
          createdAt: '2024-01-12 14:30:00',
          createdBy: 'user101',
          assignedTo: 'admin3',
          lastUpdated: '2024-01-13 11:20:00',
          responseCount: 8,
          email: 'user101@gmail.com'
        }
      ];
      
      this.totalElements = this.allTickets.length;
      this.totalPages = Math.ceil(this.totalElements / this.pageSize) || 1;
      this.pageNo = 0;
      this.updatePage();
      this.loading = false;
    }, 500);
  }

  updatePage() {
    const start = this.pageNo * this.pageSize;
    const end = start + this.pageSize;
    this.ticketsSubject.next(this.allTickets.slice(start, end));
  }

  onSearchInputChange(): void {
    clearTimeout(this.searchDebounce);
    this.searchDebounce = setTimeout(() => {
      const keyword = this.searchText.trim();
      if (keyword !== this.currentKeyword) {
        this.loadTickets();
      }
    }, 300);
  }

  onSearch(): void {
    const keyword = this.searchText.trim();
    if (keyword !== this.currentKeyword) {
      this.loadTickets();
    }
  }

  goToPage(page: number): void {
    if (page >= 0 && page < this.totalPages) {
      this.pageNo = page;
      this.updatePage();
    }
  }

  nextPage() {
    this.goToPage(this.pageNo + 1);
  }

  prevPage() {
    this.goToPage(this.pageNo - 1);
  }

  viewDetail(ticket: Ticket) {
    this.router.navigate(['/admin/tickets', ticket.id]);
  }

  reloadTickets() {
    this.loadTickets();
  }

  sortBy(field: string) {
    if (this.sortField === field) {
      this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortField = field;
      this.sortDirection = 'asc';
    }
    
    this.allTickets.sort((a: any, b: any) => {
      const valA = (a[field] || '').toString().toLowerCase();
      const valB = (b[field] || '').toString().toLowerCase();
      if (valA < valB) return this.sortDirection === 'asc' ? -1 : 1;
      if (valA > valB) return this.sortDirection === 'asc' ? 1 : -1;
      return 0;
    });
    
    this.pageNo = 0;
    this.updatePage();
  }

  getOpenTicketsCount(): number {
    return this.allTickets.filter(ticket => ticket.status === 'open').length;
  }

  getInProgressTicketsCount(): number {
    return this.allTickets.filter(ticket => ticket.status === 'in_progress').length;
  }

  getResolvedTicketsCount(): number {
    return this.allTickets.filter(ticket => ticket.status === 'resolved').length;
  }

  getVisiblePages(): number[] {
    const pages: number[] = [];
    const start = Math.max(1, this.pageNo - 1);
    const end = Math.min(this.totalPages, this.pageNo + 3);
    
    for (let i = start; i <= end; i++) {
      pages.push(i);
    }
    return pages;
  }

  getEndIndex(): number {
    return Math.min((this.pageNo + 1) * this.pageSize, this.totalElements);
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
} 