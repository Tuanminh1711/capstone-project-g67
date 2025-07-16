import { Component, OnInit, ChangeDetectorRef, AfterViewInit } from '@angular/core';
import { DatePipe, CommonModule } from '@angular/common';
import { TopNavigatorComponent } from '../../../shared/top-navigator/top-navigator.component';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject } from 'rxjs';
import { shareReplay } from 'rxjs/operators';
import { ActivatedRoute, Router } from '@angular/router';

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
  imports: [CommonModule, DatePipe, TopNavigatorComponent],
})
export class ViewTicketComponent implements OnInit, AfterViewInit {
  private ticketsSubject = new BehaviorSubject<Ticket[]>([]);
  tickets$ = this.ticketsSubject.asObservable().pipe(shareReplay(1));
  loading = false;
  error = '';
  private dataLoaded = false;
  selectedTicket: Ticket | null = null;

  constructor(
    private http: HttpClient,
    private cdr: ChangeDetectorRef,
    private route: ActivatedRoute,
    private router: Router
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
    this.http.get<any>('http://localhost:8080/api/support/tickets').subscribe({
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
    this.http.get<any>(`http://localhost:8080/api/support/tickets/${ticketId}`).subscribe({
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

  viewTicketDetail(ticket: Ticket) {
    if (ticket && ticket.ticketId) {
      this.router.navigate(['/user/my-tickets', ticket.ticketId]);
    } else {
      this.error = 'Không tìm thấy ticket.';
    }
  }
}
