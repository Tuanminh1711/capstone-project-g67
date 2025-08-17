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
import { ToastService } from '../../../../shared/toast/toast.service';
import { HttpClient } from '@angular/common/http';
import { DomSanitizer, SafeUrl } from '@angular/platform-browser';
import { environment } from '../../../../../environments/environment';
import { CookieService } from '../../../../auth/cookie.service';
import { AuthService } from '../../../../auth/auth.service';

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

  // Get responder icon based on role
  getResponderIcon(role: string): string {
    switch (role) {
      case 'ADMIN': return 'fas fa-user-shield';
      case 'VIP': return 'fas fa-crown';
      case 'USER': return 'fas fa-user';
      default: return 'fas fa-user-circle';
    }
  }

  // Get role text in Vietnamese
  getRoleText(role: string): string {
    switch (role) {
      case 'ADMIN': return 'Admin';
      case 'VIP': return 'VIP';
      case 'USER': return 'Người dùng';
      default: return 'Không xác định';
    }
  }

  // Get CSS class for role styling
  getRoleClass(role: string): string {
    switch (role) {
      case 'ADMIN': return 'role-admin';
      case 'VIP': return 'role-vip';
      case 'USER': return 'role-user';
      default: return 'role-unknown';
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
  private authService = inject(AuthService);

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

  // Kiểm tra quyền truy cập và hiển thị cảnh báo nếu cần
  private checkAccessPermission(): void {
    if (!this.ticket) return;
    
    const currentUsername = this.authService.getCurrentUsername();
    
    // Nếu ticket đã được claim bởi admin khác, hiển thị cảnh báo
    if ((this.ticket.status === 'CLAIMED' || this.ticket.status === 'IN_PROGRESS') && 
        this.ticket.claimedByUserName !== currentUsername) {
      const claimerName = this.ticket.claimedByUserName || 'không xác định';
      this.toastService.show(`Lưu ý: Ticket này đã được admin "${claimerName}" nhận xử lý. Bạn chỉ có thể xem thông tin.`, 'warning');
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
        
        // Check access permission and show warning if needed
        setTimeout(() => this.checkAccessPermission(), 100);
        
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
    let fullImageUrl = imageUrl;
    // Nếu là absolute URL (http/https), dùng trực tiếp, ngược lại build như cũ
    if (!/^https?:\/\//i.test(fullImageUrl)) {
      fullImageUrl = environment.production 
        ? `${environment.baseUrl}${fullImageUrl}`
        : (fullImageUrl.startsWith('/') ? fullImageUrl : `/${fullImageUrl}`);
    }

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

  // Check if current admin has permission to process this ticket
  hasProcessPermission(): boolean {
    if (!this.ticket) return false;
    
    const currentUsername = this.authService.getCurrentUsername();
    
    // For OPEN tickets, anyone can claim
    if (this.ticket.status === 'OPEN') return true;
    
    // For CLOSED tickets, anyone can reopen
    if (this.ticket.status === 'CLOSED') return true;
    
    // For CLAIMED/IN_PROGRESS tickets, only the claimed admin can process
    if (this.ticket.status === 'CLAIMED' || this.ticket.status === 'IN_PROGRESS') {
      return this.ticket.claimedByUserName === currentUsername;
    }
    
    return false;
  }

  // Check if user can claim a ticket (for unclaimed tickets)
  canClaimTicket(): boolean {
    // Can only claim when ticket is OPEN
    return this.ticket?.status === 'OPEN';
  }

  // Check if user can handle a ticket (for claimed tickets)
  canHandleTicket(): boolean {
    // Can handle when ticket is CLAIMED and current user is the claimer
    return this.ticket?.status === 'CLAIMED' && this.hasProcessPermission();
  }

  // Check if user can release a ticket
  canReleaseTicket(): boolean {
    // Can only release when ticket is CLAIMED (not IN_PROGRESS, CLOSED, or OPEN) and current user is the claimer
    return this.ticket?.status === 'CLAIMED' && this.hasProcessPermission();
  }

  // Check if user can respond to a ticket
  canRespondToTicket(): boolean {
    // Can respond when ticket is CLAIMED or IN_PROGRESS and current user is the claimer
    return (this.ticket?.status === 'CLAIMED' || this.ticket?.status === 'IN_PROGRESS') && this.hasProcessPermission();
  }

  // Check if user can close a ticket
  canCloseTicket(): boolean {
    // Can close when ticket is IN_PROGRESS and current user is the claimer
    return this.ticket?.status === 'IN_PROGRESS' && this.hasProcessPermission();
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

  // Get current admin permission message
  getPermissionMessage(): string {
    if (!this.ticket) return '';
    
    const currentUsername = this.authService.getCurrentUsername();
    
    if (this.ticket.status === 'OPEN') {
      return 'Ticket này chưa có ai nhận. Bạn có thể nhận để xử lý.';
    } else if (this.ticket.status === 'CLOSED') {
      return 'Ticket đã được đóng.';
    } else if (this.ticket.status === 'CLAIMED' || this.ticket.status === 'IN_PROGRESS') {
      const hasPermission = this.ticket.claimedByUserName === currentUsername;
      
      if (hasPermission) {
        return 'Bạn đã nhận ticket này và có thể tiếp tục xử lý.';
      } else {
        const claimerName = this.ticket.claimedByUserName || 'không xác định';
        return `Ticket này đã được admin "${claimerName}" nhận xử lý. Chỉ admin đó mới có thể tiếp tục xử lý.`;
      }
    }
    
    return '';
  }

  // Claim ticket action (for unclaimed tickets)
  onClaimTicket(): void {
    if (!this.ticket) return;

    const dialogRef = this.dialog.open(ClaimTicketDialogComponent, {
      width: '400px',
      data: { ticketId: this.ticket.ticketId },
      disableClose: true
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        // Use setTimeout to avoid ExpressionChangedAfterItHasBeenCheckedError
        setTimeout(() => {
          this.toastService.success('Đã nhận phiếu hỗ trợ thành công!');
          this.loadTicketDetail(); // Reload to get updated status
        }, 0);
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

    // Check if ticket status allows release (only CLAIMED status)
    if (this.ticket.status !== 'CLAIMED') {
      let statusMessage = '';
      switch (this.ticket.status) {
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
      this.toastService.error(statusMessage);
      return;
    }

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
