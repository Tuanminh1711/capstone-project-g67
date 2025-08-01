
import { environment } from '../../../../environments/environment';
import { Component, OnInit, ChangeDetectorRef, AfterViewInit } from '@angular/core';
import { DatePipe, CommonModule } from '@angular/common';
import { TopNavigatorComponent } from '../../../shared/top-navigator/top-navigator.component';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject } from 'rxjs';
import { shareReplay } from 'rxjs/operators';
import { ActivatedRoute, Router } from '@angular/router';
import { TicketDetailComponent } from '../ticket-detail/ticket-detail.component';
import { MatDialog } from '@angular/material/dialog';
import { TicketResponseDialogComponent } from '../ticket-response/ticket-response-dialog.component';

interface Ticket {
  ticketId: number;
  title: string;
  description: string;
  status: string;
  createdAt: string;
  userName: string;
  responseCount: number;
}

@Component({
  selector: 'app-view-ticket',
  templateUrl: './view-ticket.component.html',
  styleUrls: ['./view-ticket.component.scss'],
  imports: [CommonModule, DatePipe, TopNavigatorComponent, TicketDetailComponent],
})
export class ViewTicketComponent implements OnInit, AfterViewInit {
  openResponseDialog(ticket: any) {
    const ticketId = ticket.id || ticket.ticketId;
    this.dialog.open(TicketResponseDialogComponent, {
      data: { ticketId },
      width: '480px',
      panelClass: 'dialog-panel-bg'
    }).afterClosed().subscribe(result => {
      if (result === 'responseAdded') {
        // TODO: reload responses or ticket list if needed
      }
    });
  }
  private ticketsSubject = new BehaviorSubject<Ticket[]>([]);
  tickets$ = this.ticketsSubject.asObservable().pipe(shareReplay(1));
  loading = false;
  error = '';
  private dataLoaded = false;
  selectedTicket: any = null;

  constructor(
    private http: HttpClient,
    private cdr: ChangeDetectorRef,
    private route: ActivatedRoute,
    private router: Router,
    private dialog: MatDialog
  ) {}

  ngOnInit() {
    if (!this.dataLoaded) {
      this.fetchTickets();
    }
    // Listen for ticketId param and fetch detail if present
    this.route.params.subscribe(params => {
      const ticketId = params['ticketId'];
      if (ticketId && !isNaN(+ticketId)) {
        this.fetchTicketDetail(+ticketId);
      } else if (ticketId) {
        this.error = 'ID ticket không hợp lệ.';
      }
    });
  }

  ngAfterViewInit() {
    this.cdr.detectChanges();
  }

  fetchTickets() {
    this.loading = true;
    this.error = '';
    const token = localStorage.getItem('token');
    this.http.get<any>(`${environment.apiUrl}/support/tickets`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    }).subscribe({
      next: (res) => {
        const tickets = res.data || [];
        this.ticketsSubject.next(tickets);
        this.loading = false;
        this.dataLoaded = true;
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.error = 'Không thể tải danh sách ticket.';
        this.ticketsSubject.next([]);
        this.loading = false;
        this.cdr.detectChanges();
      }
    });
  }

  fetchTicketDetail(ticketId: number) {
    this.loading = true;
    this.error = '';
    const token = localStorage.getItem('token');
    this.http.get<any>(`${environment.apiUrl}/support/tickets/${ticketId}`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    }).subscribe({
      next: (res) => {
        this.selectedTicket = res.data || null;
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.error = 'Không thể tải chi tiết ticket.';
        this.selectedTicket = null;
        this.loading = false;
        this.cdr.detectChanges();
      }
    });
  }

  viewDetail(ticket: any) {
    // Gọi API lấy chi tiết ticket (nếu cần), hoặc truyền luôn nếu đã có đủ dữ liệu
    if (ticket && ticket.ticketId) {
      this.fetchTicketDetail(ticket.ticketId);
    }
  }

  closeDetail() {
    this.selectedTicket = null;
  }
}
