import { Component, OnInit, ChangeDetectorRef, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { AdminSupportTicketsService, AdminSupportTicket } from '../admin-support-tickets.service';
import { ClaimTicketDialogComponent } from '../claim/claim-ticket-dialog.component';
import { ReleaseTicketConfirmDialogComponent } from '../release/release-ticket-confirm-dialog.component';
import { ToastService } from '../../../../shared/toast/toast.service';
import { AuthService } from '../../../../auth/auth.service';


@Component({
  selector: 'app-admin-support-tickets-list',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './admin-support-tickets-list.component.html',
  styleUrls: ['./admin-support-tickets-list.component.scss']
})
export class AdminSupportTicketsListComponent implements OnInit {
  viewTicketDetail(ticket: AdminSupportTicket) {
    // Kiểm tra quyền truy cập ticket detail
    if (ticket.status === 'OPEN') {
      // Ticket chưa được claim, mọi admin đều có thể xem
      this.router.navigate([`/admin/support/tickets/${ticket.ticketId}`]);
    } else if (ticket.status === 'CLOSED') {
      // Ticket đã đóng, mọi admin đều có thể xem
      this.router.navigate([`/admin/support/tickets/${ticket.ticketId}`]);
    } else if (ticket.status === 'CLAIMED' || ticket.status === 'IN_PROGRESS') {
      // Ticket đã được claim, cần kiểm tra chi tiết từ API
      this.checkClaimedTicketAccess(ticket.ticketId);
    } else {
      // Các trạng thái khác, cho phép xem
      this.router.navigate([`/admin/support/tickets/${ticket.ticketId}`]);
    }
  }

  private checkClaimedTicketAccess(ticketId: number) {
    // Gọi API detail để lấy thông tin claimedByUserName
    this.ticketsService.getTicketDetail(ticketId).subscribe({
      next: (ticket) => {
        const currentUsername = this.authService.getCurrentUsername();
        
        if (ticket.claimedByUserName === currentUsername) {
          // Admin hiện tại đã claim ticket này
          this.router.navigate([`/admin/support/tickets/${ticketId}`]);
        } else {
          // Admin khác đã claim
          const claimerName = ticket.claimedByUserName || 'không xác định';
          this.toast.error(`Ticket này đã được admin "${claimerName}" nhận xử lý. Chỉ admin đó mới có thể tiếp tục xử lý!`);
        }
      },
      error: (error) => {
        console.error('Error checking ticket access:', error);
        this.toast.error('Có lỗi xảy ra khi kiểm tra quyền truy cập ticket');
      }
    });
  }

  /**
   * Hiển thị tooltip thông tin quyền truy cập
   */
  getAccessTooltip(ticket: AdminSupportTicket): string {
    const currentUsername = this.authService.getCurrentUsername();
    
    if (ticket.status === 'OPEN') {
      return 'Click để xem chi tiết và có thể nhận xử lý ticket';
    } else if (ticket.status === 'CLOSED') {
      return 'Click để xem chi tiết ticket đã đóng';
    } else if (ticket.status === 'CLAIMED' || ticket.status === 'IN_PROGRESS') {
      if (ticket.claimedByUserName === currentUsername) {
        return 'Click để tiếp tục xử lý ticket đã nhận';
      } else {
        return `Ticket đã được "${ticket.claimedByUserName || 'không xác định'}" nhận xử lý. Chỉ xem được thôi.`;
      }
    }
    return 'Click để xem chi tiết ticket';
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
  private authService = inject(AuthService);
  openClaimDialog(ticket: AdminSupportTicket) {
    console.log(`[DEBUG] openClaimDialog called for ticket ${ticket.ticketId} with status ${ticket.status}`);
    const dialogRef = this.dialog.open(ClaimTicketDialogComponent, {
      data: { ticketId: ticket.ticketId },
      width: '400px',
      disableClose: true
    });
    
    dialogRef.afterClosed().subscribe((claimed) => {
      if (claimed) {
        this.toast.success('Đã nhận ticket thành công!');
        // Reload danh sách để cập nhật thông tin claimedBy
        setTimeout(() => {
          this.loadTickets(this.page);
        }, 0);
        // Chuyển đến trang detail để tiếp tục xử lý
        this.router.navigate([`/admin/support/tickets/${ticket.ticketId}`]);
      }
    });
  }

  openReleaseDialog(ticket: AdminSupportTicket) {
    // Check if ticket status allows release (only CLAIMED status)
    if (ticket.status !== 'CLAIMED') {
      let statusMessage = '';
      switch (ticket.status) {
        case 'OPEN':
          statusMessage = 'Ticket này chưa được ai nhận, không thể trả lại.';
          break;
        case 'IN_PROGRESS':
          statusMessage = 'Ticket đang được xử lý, không thể trả lại.';
          break;
        case 'CLOSED':
          statusMessage = 'Ticket đã đóng, không thể trả lại.';
          break;
        default:
          statusMessage = 'Trạng thái ticket không cho phép trả lại.';
      }
      this.toast.error(statusMessage);
      return;
    }

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
            setTimeout(() => {
              this.loadTickets();
            }, 0);
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
        
        // Debug: log ticket statuses
        console.log(`[DEBUG] Loaded ${this.tickets.length} tickets:`);
        this.tickets.forEach((ticket, index) => {
          console.log(`  ${index + 1}. Ticket ${ticket.ticketId}: status = "${ticket.status}"`);
        });
        
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
    if (newPage >= 0 && newPage < this.totalPages && newPage !== this.page) {
      this.page = newPage;
      this.loadTickets(newPage);
    }
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

  // Check if current admin can release this ticket (only who claimed it and only when CLAIMED status)
  canReleaseTicket(ticket: AdminSupportTicket): boolean {
    // Only allow release when ticket is CLAIMED (not OPEN, IN_PROGRESS, or CLOSED)
    // In list view, we can't verify the claimedByUserName, so we'll need to check in detail
    // For now, show the button only for CLAIMED status - actual permission will be checked in dialog
    return ticket.status === 'CLAIMED';
  }

  // Check if current admin can process this ticket (only who claimed it)
  canProcessTicket(ticket: AdminSupportTicket): boolean {
    // For list view, we don't have claimedByUserName, so hide the button
    // User will need to go to detail view to perform actions
    return false; // Hide process button in list view
  }

  // Check if ticket can be reopened (only when CLOSED)
  canReopenTicket(ticket: AdminSupportTicket): boolean {
    return ticket.status === 'CLOSED';
  }

  // Check if ticket can be claimed (only when OPEN)
  canClaimTicket(ticket: AdminSupportTicket): boolean {
    console.log(`[DEBUG] canClaimTicket for ticket ${ticket.ticketId}: status = ${ticket.status}, can claim = ${ticket.status === 'OPEN'}`);
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
        // Use setTimeout to avoid ExpressionChangedAfterItHasBeenCheckedError
        setTimeout(() => {
          this.loadTickets(this.page); // Reload current page
        }, 0);
      },
      error: (error) => {
        console.error('Error reopening ticket:', error);
        this.toast.error('Có lỗi xảy ra khi mở lại ticket');
      }
    });
  }
}
