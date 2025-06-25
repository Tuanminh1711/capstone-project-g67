import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AdminLayoutComponent } from '../../shared/admin-layout/admin-layout.component';
import { AdminFooterComponent } from '../../shared/admin-footer/admin-footer.component';
import { AdminAccountService, Account } from './admin-account.service';
import { HttpClientModule } from '@angular/common/http';
import { BehaviorSubject, Subscription } from 'rxjs';
import { ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-admin-account-list',
  standalone: true,
  imports: [CommonModule, HttpClientModule, AdminLayoutComponent],
  templateUrl: './admin-account-list.component.html',
  styleUrls: ['./admin-account-list.component.scss']
})
export class AdminAccountListComponent implements OnInit, OnDestroy {
  private accountsSubject = new BehaviorSubject<Account[]>([]);
  accounts$ = this.accountsSubject.asObservable();
  allAccounts: Account[] = [];
  pageNo = 0;
  pageSize = 10;
  totalPages = 1;
  totalElements = 0;
  loading = false;
  errorMsg = '';
  searchText = '';
  currentKeyword = '';
  searchDebounce: any;
  private sub: Subscription = new Subscription();
  successMsg = '';

  sortField: string = '';
  sortDirection: 'asc' | 'desc' = 'asc';

  constructor(private accountService: AdminAccountService, private route: ActivatedRoute) {}

  ngOnInit() {
    this.route.queryParams.subscribe(params => {
      if (params['successMsg']) {
        this.successMsg = params['successMsg'];
        setTimeout(() => this.successMsg = '', 3000);
      }
    });
    setTimeout(() => {
      this.fetchAllAccounts('');
    }, 0);
  }

  ngOnDestroy() {
    this.sub.unsubscribe();
    clearTimeout(this.searchDebounce);
  }

  fetchAllAccounts(keyword: string) {
    this.loading = true;
    this.errorMsg = '';
    this.currentKeyword = keyword;
    this.sub.add(
      this.accountService.getAccounts(0, 10000, keyword).subscribe({ // lấy tối đa 10000 user
        next: res => {
          this.allAccounts = res.data || [];
          this.totalElements = this.allAccounts.length;
          this.totalPages = Math.ceil(this.totalElements / this.pageSize) || 1;
          this.pageNo = 0;
          this.updatePage();
          this.loading = false;
        },
        error: err => {
          this.accountsSubject.next([]);
          this.errorMsg = 'Không thể tải danh sách tài khoản';
          this.loading = false;
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
    const newStatus = account.status === 'active' ? 'locked' : 'active';
    this.accountService.changeStatus(account.id, newStatus).subscribe({
      next: () => {
        account.status = newStatus;
      },
      error: (err) => {
        this.errorMsg = err?.error?.message || 'Không thể cập nhật trạng thái tài khoản';
        setTimeout(() => this.errorMsg = '', 3000);
      }
    });
  }

  changeStatus(account: Account, event: Event) {
    const select = event.target as HTMLSelectElement;
    const newStatus = select.value.toUpperCase();
    if (account.status.toUpperCase() === newStatus) return;
    this.accountService.changeStatus(account.id, newStatus).subscribe({
      next: () => {
        account.status = newStatus;
      },
      error: (err) => {
        this.errorMsg = err?.error?.message || 'Không thể cập nhật trạng thái tài khoản';
        setTimeout(() => this.errorMsg = '', 3000);
      }
    });
  }

  viewDetail(account: Account) {
    // TODO: Điều hướng tới trang chi tiết tài khoản
    alert('Xem chi tiết tài khoản: ' + account.username);
  }

  reloadAccounts() {
    this.fetchAllAccounts(this.currentKeyword);
  }

  deleteAccount(account: Account) {
    if (!confirm('Bạn có chắc chắn muốn xóa tài khoản này?')) return;
    this.accountService.deleteUser(account.id).subscribe({
      next: (res) => {
        this.successMsg = res?.message || 'Xóa tài khoản thành công!';
        this.errorMsg = '';
        this.fetchAllAccounts(this.currentKeyword);
        setTimeout(() => this.successMsg = '', 3000);
      },
      error: (err) => {
        this.errorMsg = err?.error?.message || 'Xóa tài khoản thất bại!';
        setTimeout(() => this.errorMsg = '', 3000);
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
}
