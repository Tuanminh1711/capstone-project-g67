import { Component, OnInit, ChangeDetectorRef, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { AdminSupportTicketsService, AdminSupportTicket } from '../admin-support-tickets.service';
import { ClaimTicketDialogComponent } from '../claim/claim-ticket-dialog.component';
import { HandleTicketDialogComponent } from '../handle/handle-ticket-dialog.component';
import { ReleaseTicketConfirmDialogComponent } from '../release/release-ticket-confirm-dialog.component';
import { StatusTicketDialogComponent } from '../status/status-ticket-dialog.component';
import { ResponseTicketDialogComponent } from '../response/response-ticket-dialog.component';
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
        this.loadTickets(this.page);
      }
    });
  }

  openHandleDialog(ticket: AdminSupportTicket) {
    const dialogRef = this.dialog.open(HandleTicketDialogComponent, {
      data: { ticketId: ticket.ticketId },
      width: '420px',
      autoFocus: false
    });
    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.loadTickets();
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

  openStatusDialog(ticket: AdminSupportTicket) {
    const dialogRef = this.dialog.open(StatusTicketDialogComponent, {
      data: { ticketId: ticket.ticketId, currentStatus: ticket.status },
      width: '350px',
      autoFocus: false
    });
    dialogRef.afterClosed().subscribe(newStatus => {
      if (newStatus && newStatus !== ticket.status) {
        this.ticketsService.changeStatus(ticket.ticketId, newStatus).subscribe({
          next: () => {
            this.toast.success('Đổi trạng thái thành công!');
            this.loadTickets();
          },
          error: () => this.toast.error('Đổi trạng thái thất bại!')
        });
      }
    });
  }

  openResponseDialog(ticket: AdminSupportTicket) {
    const dialogRef = this.dialog.open(ResponseTicketDialogComponent, {
      data: { ticketId: ticket.ticketId },
      width: '400px',
      autoFocus: false
    });
    dialogRef.afterClosed().subscribe(response => {
      if (response) {
        this.ticketsService.responseTicket(ticket.ticketId, response).subscribe({
          next: () => {
            this.toast.success('Gửi phản hồi thành công!');
            this.loadTickets();
          },
          error: () => this.toast.error('Gửi phản hồi thất bại!')
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

  onStatusChange(ticket: AdminSupportTicket, newStatus: string) {
    if (ticket.status === newStatus) return;
    this.ticketsService.changeStatus(ticket.ticketId, newStatus).subscribe({
      next: () => {
        this.toast.success('Đổi trạng thái thành công!');
        ticket.status = newStatus;
      },
      error: () => this.toast.error('Đổi trạng thái thất bại!')
    });
  }
}
