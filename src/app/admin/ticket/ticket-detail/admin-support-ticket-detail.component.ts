import { Component, OnInit, OnDestroy, ChangeDetectorRef, inject, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule, NgIf, NgFor } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { AdminSupportTicketDetailService, AdminSupportTicketDetail } from './admin-support-ticket-detail.service';
import { AdminSupportTicketsService } from '../admin-support-tickets.service';
import { Subscription } from 'rxjs';
import { MatDialog } from '@angular/material/dialog';
import { HandleTicketDialogComponent } from '../handle/handle-ticket-dialog.component';
import { ClaimTicketDialogComponent } from '../claim/claim-ticket-dialog.component';
import { ReleaseTicketConfirmDialogComponent } from '../release/release-ticket-confirm-dialog.component';
import { ResponseTicketDialogComponent } from '../response/response-ticket-dialog.component';
import { ToastService } from '../../../shared/toast/toast.service';
import { HttpClient } from '@angular/common/http';
import { DomSanitizer, SafeUrl } from '@angular/platform-browser';
import { environment } from '../../../../environments/environment';
import { CookieService } from '../../../auth/cookie.service';

@Component({
  selector: 'app-admin-support-ticket-detail',
  standalone: true,
  imports: [CommonModule, RouterModule, NgIf, NgFor],
  templateUrl: './admin-support-ticket-detail.component.html',
  styleUrls: ['./admin-support-ticket-detail.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AdminSupportTicketDetailComponent implements OnInit, OnDestroy {
  getActionLabel(action: string): string {
    switch (action) {
      case 'CLAIM': return 'Nhận xử lý';
      case 'RELEASE': return 'Trả lại';
      case 'HANDLE': return 'Xử lý';
      case 'CREATE': return 'Tạo phiếu';
      case 'RESPONSE': return 'Phản hồi';
      case 'CLOSE': return 'Đóng phiếu';
      case 'REOPEN': return 'Mở lại';
      default: return action;
    }
  }

  // Getter to return logs sorted by creation time (earliest first)
  get sortedLogs() {
    if (!this.ticket?.logs) return [];
    return [...this.ticket.logs].sort((a, b) => {
      const dateA = new Date(a.createdAt);
      const dateB = new Date(b.createdAt);
      return dateA.getTime() - dateB.getTime(); // Ascending order (earliest first)
    });
  }
  ticketId: number = 0;
  ticket: AdminSupportTicketDetail | null = null;
  loading = false;
  error = '';
  routeSub?: Subscription;
  imageObjectUrl: SafeUrl | null = null;
  
  private ticketService = inject(AdminSupportTicketDetailService);
  private adminSupportTicketsService = inject(AdminSupportTicketsService);
  private dialog = inject(MatDialog);
  private toastService = inject(ToastService);
  private http = inject(HttpClient);
  private sanitizer = inject(DomSanitizer);
  private cookieService = inject(CookieService);

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.routeSub = this.route.params.subscribe(params => {
      const newId = +params['id'];
      if (newId && newId !== this.ticketId) {
        this.ticketId = newId;
        this.loadTicketDetail();
      }
    });
    // Initial load
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.ticketId = +id;
      this.loadTicketDetail();
    }
  }

  ngOnDestroy(): void {
    this.routeSub?.unsubscribe();
    
    // Clean up object URL to prevent memory leaks
    if (this.imageObjectUrl) {
      URL.revokeObjectURL(this.imageObjectUrl.toString());
    }
  }

  loadTicketDetail(): void {
    if (!this.ticketId || this.ticketId <= 0) {
      this.error = 'ID phiếu hỗ trợ không hợp lệ';
      this.loading = false;
      this.cdr.markForCheck();
      return;
    }
    
    this.loading = true;
    this.error = '';
    
    this.ticketService.getTicketDetail(this.ticketId).subscribe({
      next: (ticket) => {
        this.ticket = ticket;
        this.loading = false;
        
        // Load image if exists
        if (ticket.imageUrl) {
          this.loadImage(ticket.imageUrl);
        }
        
        this.cdr.markForCheck();
      },
      error: (err) => {
        console.error('Error loading ticket:', err);
        this.error = 'Không tìm thấy phiếu hỗ trợ hoặc có lỗi xảy ra.';
        this.loading = false;
        this.ticket = null;
        this.cdr.markForCheck();
      }
    });
  }

  private loadImage(imageUrl: string) {
    if (!imageUrl) return;

    const token = localStorage.getItem('token');
    // Trong development: sử dụng URL tương đối (qua proxy)
    // Trong production: sử dụng baseUrl + imageUrl
    const fullImageUrl = environment.production 
      ? `${environment.baseUrl}${imageUrl}`
      : (imageUrl.startsWith('/') ? imageUrl : `/${imageUrl}`);
    
    this.http.get(fullImageUrl, {
      responseType: 'blob',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    }).subscribe({
      next: (blob) => {
        const objectUrl = URL.createObjectURL(blob);
        this.imageObjectUrl = this.sanitizer.bypassSecurityTrustUrl(objectUrl);
        this.cdr.markForCheck();
      },
      error: (error) => {
        console.error('Failed to load image:', error);
        this.imageObjectUrl = null;
        this.cdr.markForCheck();
      }
    });
  }

  // Check if user can claim a ticket (for unclaimed tickets)
  canClaimTicket(): boolean {
    // Can only claim when ticket is OPEN
    return this.ticket?.status === 'OPEN';
  }

  // Check if user can handle a ticket (for claimed tickets)
  canHandleTicket(): boolean {
    // Can handle when ticket is CLAIMED (đã nhận nhưng chưa xử lý)
    return this.ticket?.status === 'CLAIMED';
  }

  // Check if user can release a ticket
  canReleaseTicket(): boolean {
    // Can release when ticket is CLAIMED or IN_PROGRESS
    return this.ticket?.status === 'CLAIMED' || this.ticket?.status === 'IN_PROGRESS';
  }

  // Check if user can respond to a ticket
  canRespondToTicket(): boolean {
    // Can respond when ticket is CLAIMED or IN_PROGRESS
    return this.ticket?.status === 'CLAIMED' || this.ticket?.status === 'IN_PROGRESS';
  }

  // Check if user can close a ticket
  canCloseTicket(): boolean {
    // Can close when ticket is IN_PROGRESS
    return this.ticket?.status === 'IN_PROGRESS';
  }

  // Check if user can reopen a ticket
  canReopenTicket(): boolean {
    // Can reopen when ticket is CLOSED
    return this.ticket?.status === 'CLOSED';
  }

  // Get person in charge based on ticket status
  getPersonInCharge(): string {
    if (!this.ticket) return '--';
    
    // Priority: handledByUserName > claimedByUserName > no one
    if (this.ticket.handledByUserName) {
      return this.ticket.handledByUserName;
    } else if (this.ticket.claimedByUserName) {
      return this.ticket.claimedByUserName;
    } else {
      return '--';
    }
  }

  // Claim ticket action (for unclaimed tickets)
  onClaimTicket(): void {
    if (!this.ticket) return;
    // Mở dialog nhập note nhận ticket
    const dialogRef = this.dialog.open(ClaimTicketDialogComponent, {
      data: { ticketId: this.ticket!.ticketId },
      width: '400px',
      disableClose: true
    });
    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.toastService.success('Đã nhận phiếu hỗ trợ thành công!');
        this.loadTicketDetail();
      }
    });
  }

  // Handle ticket action (for claimed tickets)
  onHandleTicket(): void {
    if (!this.ticket) return;

    const dialogRef = this.dialog.open(HandleTicketDialogComponent, {
      width: '500px',
      data: { ticket: this.ticket }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        // Use setTimeout to avoid ExpressionChangedAfterItHasBeenCheckedError
        setTimeout(() => {
          this.toastService.success('Đã bắt đầu xử lý phiếu hỗ trợ thành công!');
          this.loadTicketDetail(); // Reload to get updated status
        }, 0);
      }
    });
  }

  // Release ticket action
  onReleaseTicket(): void {
    if (!this.ticket) return;

    const dialogRef = this.dialog.open(ReleaseTicketConfirmDialogComponent, {
      width: '400px',
      data: { ticketId: this.ticket.ticketId }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        // Use setTimeout to avoid ExpressionChangedAfterItHasBeenCheckedError
        setTimeout(() => {
          // Call API to release ticket
          this.adminSupportTicketsService.releaseTicket(this.ticket!.ticketId).subscribe({
            next: () => {
              this.toastService.success('Đã trả lại phiếu hỗ trợ thành công!');
              this.loadTicketDetail(); // Reload to get updated status
            },
            error: (err) => {
              console.error('Release ticket error:', err);
              this.toastService.error('Trả lại phiếu hỗ trợ thất bại!');
            }
          });
        }, 0);
      }
    });
  }

  // Response to ticket action
  onResponseTicket(): void {
    if (!this.ticket) return;

    const dialogRef = this.dialog.open(ResponseTicketDialogComponent, {
      width: '600px',
      maxHeight: '80vh',
      data: { ticketId: this.ticket.ticketId }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        // Use setTimeout to avoid ExpressionChangedAfterItHasBeenCheckedError
        setTimeout(() => {
          this.toastService.success('Đã gửi phản hồi thành công!');
          this.loadTicketDetail(); // Reload to get updated status
        }, 0);
      }
    });
  }

  // Close ticket action
  onCloseTicket(): void {
    if (!this.ticket) return;

    if (!confirm('Bạn có chắc chắn muốn đóng phiếu hỗ trợ này không?')) {
      return;
    }

    this.loading = true;
    this.http.put(`${environment.apiUrl}/admin/support/tickets/${this.ticket.ticketId}/status`, 
      { status: 'CLOSED' },
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.getAuthToken()}`
        }
      })
      .subscribe({
        next: (response) => {
          this.loading = false;
          this.toastService.success('Đã đóng phiếu hỗ trợ thành công!');
          this.loadTicketDetail(); // Reload to get updated status
        },
        error: (error) => {
          this.loading = false;
          console.error('Error closing ticket:', error);
          this.toastService.error('Có lỗi xảy ra khi đóng phiếu hỗ trợ');
        }
      });
  }

  // Reopen ticket action
  onReopenTicket(): void {
    if (!this.ticket) return;

    if (!confirm('Bạn có chắc chắn muốn mở lại phiếu hỗ trợ này không?')) {
      return;
    }

    this.loading = true;
    this.http.put(`${environment.apiUrl}/admin/support/tickets/${this.ticket.ticketId}/status`, 
      { status: 'OPEN' },
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.getAuthToken()}`
        }
      })
      .subscribe({
        next: (response) => {
          this.loading = false;
          this.toastService.success('Đã mở lại phiếu hỗ trợ thành công!');
          this.loadTicketDetail(); // Reload to get updated status
        },
        error: (error) => {
          this.loading = false;
          console.error('Error reopening ticket:', error);
          this.toastService.error('Có lỗi xảy ra khi mở lại phiếu hỗ trợ');
        }
      });
  }

  private getAuthToken(): string {
    return this.cookieService.getCookie('auth_token') || '';
  }
}
