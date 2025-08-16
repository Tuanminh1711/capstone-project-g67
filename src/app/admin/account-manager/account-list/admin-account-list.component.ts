import { Component, OnInit, OnDestroy } from '@angular/core';
import { BaseAdminListComponent } from '../../../shared/base-admin-list.component';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AdminFooterComponent } from '../../../shared/admin-footer/admin-footer.component';
import { AdminAccountService, Account } from './admin-account.service';
import { HttpClientModule } from '@angular/common/http';
import { BehaviorSubject, Subscription } from 'rxjs';
import { map } from 'rxjs/operators';
import { ActivatedRoute, Router } from '@angular/router';
import { ConfirmationDialogService } from '../../../shared/confirmation-dialog/confirmation-dialog.service';
import { AuthService } from '../../../auth/auth.service';
import { AdminPageTitleService } from '../../../shared/admin-page-title.service';
import { ToastService } from '../../../shared/toast/toast.service';

@Component({
  selector: 'app-admin-account-list',
  standalone: true,
  imports: [CommonModule, HttpClientModule, FormsModule],
  templateUrl: './admin-account-list.component.html',
  styleUrls: ['./admin-account-list.component.scss']
})
export class AdminAccountListComponent extends BaseAdminListComponent implements OnInit, OnDestroy {
  private accountsSubject = new BehaviorSubject<Account[]>([]);
  accounts$ = this.accountsSubject.asObservable();
  allAccounts: Account[] = [];
  pageNo = 0;
  pageSize = 10;
  totalPages = 1;
  totalElements = 0;
  // loading, errorMsg are now handled by BaseAdminListComponent
  searchText = '';
  currentKeyword = '';
  searchDebounce: any;
  // sub, successMsg are now handled by BaseAdminListComponent

  sortField: string = '';
  sortDirection: 'asc' | 'desc' = 'asc';

  currentUserId: string | null = null;

  constructor(
    private accountService: AdminAccountService,
    private route: ActivatedRoute,
    private router: Router,
    private confirmationDialog: ConfirmationDialogService,
    private authService: AuthService,
    private pageTitleService: AdminPageTitleService,
    private toastService: ToastService
  ) {
    super();
  }

  ngOnInit() {
    // Đặt tiêu đề trang qua service
    this.pageTitleService.setTitle('Quản lý tài khoản');
    // Lấy userId hiện tại
    this.currentUserId = this.authService.getCurrentUserId();
    setTimeout(() => {
      this.fetchAllAccounts('');
    }, 0);
  }

  ngOnDestroy() {
    this.cleanupSubscriptions();
    clearTimeout(this.searchDebounce);
  }

  fetchAllAccounts(keyword: string) {
    this.setLoading(true);
    this.setError('');
    this.currentKeyword = keyword;
    this.sub.add(
      this.accountService.searchAccounts(keyword).subscribe({
        next: (users) => {
          this.allAccounts = users || [];
          this.totalElements = this.allAccounts.length;
          this.totalPages = Math.ceil(this.totalElements / this.pageSize) || 1;
          this.pageNo = 0;
          this.updatePage();
          this.setLoading(false);
        },
        error: err => {
          this.accountsSubject.next([]);
          this.setError('Không thể tải danh sách tài khoản');
          this.setLoading(false);
        }
      })
    );
  }

  updatePage() {
    const start = this.pageNo * this.pageSize;
    const end = start + this.pageSize;
    this.accountsSubject.next(this.allAccounts.slice(start, end));
  }

  onSearchInputChange(): void {
    clearTimeout(this.searchDebounce);
    this.searchDebounce = setTimeout(() => {
      const keyword = this.searchText.trim();
      if (keyword !== this.currentKeyword) {
        this.fetchAllAccounts(keyword);
      }
    }, 300);
  }

  onSearch(): void {
    const keyword = this.searchText.trim();
    if (keyword !== this.currentKeyword) {
      this.fetchAllAccounts(keyword);
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

  lockUnlock(account: Account) {
    const currentStatus = (account.status || 'active').toLowerCase();
    const newStatus = currentStatus === 'active' ? 'locked' : 'active';
    this.accountService.changeStatus(account.id, newStatus).subscribe({
      next: () => {
        account.status = newStatus;
      },
      error: (err) => {
        this.setError(err?.error?.message || 'Không thể cập nhật trạng thái tài khoản');
      }
    });
  }

  changeStatus(account: Account, event: Event) {
    const select = event.target as HTMLSelectElement;
    const newStatus = select.value.toUpperCase();
    // Không cho phép thay đổi trạng thái của chính mình
    if ((account.id + '') === (this.currentUserId + '')) {
      this.setError('Bạn không thể thay đổi trạng thái của chính mình!');
      select.value = (account.status || 'ACTIVE').toUpperCase(); // revert selection, handle null
      return;
    }
    if ((account.status || 'ACTIVE').toUpperCase() === newStatus) return; // handle null status
    this.confirmationDialog.showDialog({
      title: 'Xác nhận thay đổi trạng thái',
      message: `Bạn có chắc chắn muốn chuyển trạng thái tài khoản "${account.username}" sang "${newStatus}"?`,
      confirmText: 'Xác nhận',
      cancelText: 'Hủy',
      type: 'warning'
    }).subscribe(confirmed => {
      if (!confirmed) {
        select.value = (account.status || 'ACTIVE').toUpperCase(); // revert selection, handle null
        return;
      }
      this.accountService.changeStatus(account.id, newStatus).subscribe({
        next: () => {
          account.status = newStatus;
          this.toastService.success('Cập nhật trạng thái tài khoản thành công!');
          this.setSuccess('');
          this.reloadAccounts(); // reload the account list after status change
        },
        error: (err) => {
          this.setError(err?.error?.message || 'Không thể cập nhật trạng thái tài khoản');
        }
      });
    });
  }

  viewDetail(account: Account) {
    this.router.navigate(['/admin/accounts/detail', account.id]);
  }

  editUser(account: Account) {
    // Kiểm tra nếu đây là tài khoản VIP
    if (account.role && account.role.toUpperCase() === 'VIP') {
      this.toastService.warning('Không thể chỉnh sửa thông tin tài khoản VIP!');
      return;
    }
    
    // Kiểm tra nếu đây là tài khoản của chính mình
    if ((account.id + '') === (this.currentUserId + '')) {
      // Hiển thị cảnh báo và xác nhận
      this.confirmationDialog.showDialog({
        title: 'Chỉnh sửa tài khoản của bạn',
        message: 'Bạn đang chỉnh sửa tài khoản của chính mình. Việc thay đổi thông tin có thể ảnh hưởng đến phiên đăng nhập hiện tại. Bạn có muốn tiếp tục?',
        confirmText: 'Tiếp tục',
        cancelText: 'Hủy',
        icon: 'user-edit',
        type: 'warning'
      }).subscribe(confirmed => {
        if (confirmed) {
          // Navigate đến trang chỉnh sửa với flag đặc biệt cho self-edit
          this.router.navigate(['/admin/accounts/update', account.id], { 
            queryParams: { selfEdit: 'true' } 
          });
        }
      });
      return;
    }
    
    // Chỉnh sửa tài khoản khác bình thường
    this.router.navigate(['/admin/accounts/update', account.id]);
  }

  viewActivityLogs(account: Account) {
    this.router.navigate(['/admin/accounts/activity-logs', account.id]);
  }

  reloadAccounts() {
    this.fetchAllAccounts(this.currentKeyword);
  }

  deleteAccount(account: Account) {
    if (!confirm('Bạn có chắc chắn muốn xóa tài khoản này?')) return;
    this.accountService.deleteUser(account.id).subscribe({
      next: (res) => {
        this.toastService.success('Xóa tài khoản thành công!');
        this.setSuccess('');
        this.setError('');
        this.fetchAllAccounts(this.currentKeyword);
      },
      error: (err) => {
        this.setError(err?.error?.message || 'Xóa tài khoản thất bại!');
      }
    });
  }

  sortBy(field: string) {
    if (this.sortField === field) {
      // Đảo chiều sort nếu click lại cùng 1 cột
      this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortField = field;
      this.sortDirection = 'asc';
    }
    this.allAccounts.sort((a: any, b: any) => {
      const valA = (a[field] || '').toString().toLowerCase();
      const valB = (b[field] || '').toString().toLowerCase();
      if (valA < valB) return this.sortDirection === 'asc' ? -1 : 1;
      if (valA > valB) return this.sortDirection === 'asc' ? 1 : -1;
      return 0;
    });
    this.pageNo = 0;
    this.updatePage();
  }

  resetPassword(account: Account) {
    this.confirmationDialog.showDialog({
      title: 'Xác nhận đặt lại mật khẩu',
      message: `Bạn có chắc chắn muốn đặt lại mật khẩu cho tài khoản "${account.username}"?`,
      confirmText: 'Đặt lại',
      cancelText: 'Hủy',
      icon: 'key',
      type: 'warning'
    }).subscribe(confirmed => {
      if (!confirmed) return;
      this.setLoading(true);
      this.setError('');
      this.setSuccess('');
      this.accountService.resetPassword(account.id).subscribe({
        next: (res) => {
          this.toastService.success('Đặt lại mật khẩu thành công!');
          this.setLoading(false);
        },
        error: (err) => {
          this.setError(err?.error?.message || 'Đặt lại mật khẩu thất bại!');
          this.setLoading(false);
        }
      });
    });
  }
}
