import { Component, OnInit, ChangeDetectorRef, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { AdminSupportTicketsService, AdminSupportTicket } from '../admin-support-tickets.service';
import { ClaimTicketDialogComponent } from '../claim/claim-ticket-dialog.component';
import { ReleaseTicketConfirmDialogComponent } from '../release/release-ticket-confirm-dialog.component';
import { ToastService } from '../../../shared/toast/toast.service';


@Component({
  selector: 'app-admin-support-tickets-list',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './admin-support-tickets-list.component.html',
  styleUrls: ['./admin-support-tickets-list.component.scss']
})
export class AdminSupportTicketsListComponent implements OnInit {
  viewTicketDetail(ticket: AdminSupportTicket) {
    // Điều hướng đến trang chi tiết ticket (SPA)
    this.router.navigate([`/admin/support/tickets/${ticket.ticketId}`]);
  }
  searchText: string = '';
  filteredTickets: AdminSupportTicket[] = [];
  tickets: AdminSupportTicket[] = [];
  isLoading = true;
  page = 0;
  size = 10;
  totalElements = 0;
  totalPages = 0;

  private ticketsService = inject(AdminSupportTicketsService);
  private dialog = inject(MatDialog);
  private toast = inject(ToastService);
  private router = inject(Router);
  openClaimDialog(ticket: AdminSupportTicket) {
    const dialogRef = this.dialog.open(ClaimTicketDialogComponent, {
      data: { ticketId: ticket.ticketId },
      width: '400px',
      disableClose: true
    });
    
    dialogRef.afterClosed().subscribe((claimed) => {
      if (claimed) {
        this.toast.success('Đã nhận ticket thành công!');
        // Chuyển đến trang detail để tiếp tục xử lý
        this.router.navigate([`/admin/support/tickets/${ticket.ticketId}`]);
      }
    });
  }

  openReleaseDialog(ticket: AdminSupportTicket) {
    const dialogRef = this.dialog.open(ReleaseTicketConfirmDialogComponent, {
      data: { ticketId: ticket.ticketId },
      width: '350px',
      autoFocus: false
    });
    
    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.ticketsService.releaseTicket(ticket.ticketId).subscribe({
          next: () => {
            this.toast.success('Trả lại ticket thành công!');
            this.loadTickets();
          },
          error: () => this.toast.error('Trả lại ticket thất bại!')
        });
      }
    });
  }

  constructor(private cdr: ChangeDetectorRef) {}

  ngOnInit() {
    this.loadTickets();
  }

  loadTickets(page = 0) {
    this.isLoading = true;
    this.ticketsService.getTickets(page, this.size).subscribe({
      next: (res) => {
        this.tickets = res.content || [];
        this.filteredTickets = this.tickets;
        this.totalElements = res.totalElements;
        this.totalPages = res.totalPages;
        this.page = res.number;
        this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.tickets = [];
        this.filteredTickets = [];
        this.isLoading = false;
        this.cdr.detectChanges();
      }
    });
  }

  onSearch() {
    const keyword = this.searchText.trim().toLowerCase();
    if (!keyword) {
      this.filteredTickets = this.tickets;
      return;
    }
    this.filteredTickets = this.tickets.filter(ticket =>
      ticket.title.toLowerCase().includes(keyword) ||
      ticket.description.toLowerCase().includes(keyword) ||
      ticket.userName.toLowerCase().includes(keyword)
    );
  }

  onPageChange(newPage: number) {
    this.loadTickets(newPage);
  }

  formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('vi-VN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  // Check if ticket can be reopened (only when CLOSED)
  canReopenTicket(ticket: AdminSupportTicket): boolean {
    return ticket.status === 'CLOSED';
  }

  // Check if ticket can be claimed (only when OPEN)
  canClaimTicket(ticket: AdminSupportTicket): boolean {
    return ticket.status === 'OPEN';
  }

  // Get status text with proper Vietnamese translation
  getStatusText(status: string): string {
    switch (status) {
      case 'OPEN': return 'Mở';
      case 'CLAIMED': return 'Đã nhận';
      case 'IN_PROGRESS': return 'Đang xử lý';
      case 'CLOSED': return 'Đã đóng';
      default: return status;
    }
  }

  // Get status CSS class
  getStatusClass(status: string): string {
    switch (status) {
      case 'OPEN': return 'status-open';
      case 'CLAIMED': return 'status-claimed';
      case 'IN_PROGRESS': return 'status-in-progress';
      case 'CLOSED': return 'status-closed';
      default: return '';
    }
  }

  // Reopen ticket action
  onReopenTicket(ticket: AdminSupportTicket): void {
    if (!confirm(`Bạn có chắc chắn muốn mở lại ticket #${ticket.ticketId} không?`)) {
      return;
    }

    this.ticketsService.reopenTicket(ticket.ticketId).subscribe({
      next: () => {
        this.toast.success('Đã mở lại ticket thành công!');
        this.loadTickets(this.page); // Reload current page
      },
      error: (error) => {
        console.error('Error reopening ticket:', error);
        this.toast.error('Có lỗi xảy ra khi mở lại ticket');
      }
    });
  }
}
