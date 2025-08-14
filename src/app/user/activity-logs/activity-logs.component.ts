import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { DatePipe, CommonModule } from '@angular/common';
import { TopNavigatorComponent } from '../../shared/top-navigator/top-navigator.component';
import { HttpClient } from '@angular/common/http';
import { ConfigService } from '../../shared/config.service';

@Component({
  selector: 'app-activity-logs',
  templateUrl: './activity-logs.component.html',
  styleUrls: ['./activity-logs.component.scss'],
  standalone: true,
  imports: [CommonModule, DatePipe, TopNavigatorComponent]
})
export class ActivityLogsComponent implements OnInit {
  logs: any[] = [];
  loading = true;
  error: string | null = null;
  
  // Pagination
  pageNo = 0;
  pageSize = 10;
  totalElements = 0;
  totalPages = 1;

  actionMap: Record<string, string> = {
    LOGIN: 'Đăng nhập',
    LOGOUT: 'Đăng xuất',
    CREATE_NEW_PLANT: 'Tạo cây mới',
    SETUP_CARE_REMINDERS: 'Thiết lập nhắc nhở',
    // Thêm các action khác nếu có
  };

  constructor(
    private http: HttpClient, 
    private cdr: ChangeDetectorRef,
    private configService: ConfigService
  ) {}

  ngOnInit() {
    this.fetchLogs();
  }

  fetchLogs(page = 0) {
    this.loading = true;
    this.error = null;
    this.pageNo = page;
    
    this.http.post<any>(`${this.configService.apiUrl}/personal/activity-logs`, {
      page: this.pageNo,
      size: this.pageSize
    }).subscribe({
      next: (res) => {
        const data = res?.data || res;
        this.logs = data?.content || data?.logs || data || [];
        this.totalElements = data?.totalElements || this.logs.length;
        this.totalPages = data?.totalPages || 1;
        this.pageNo = data?.number || page;
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.error = 'Không thể tải nhật ký hoạt động.';
        this.loading = false;
        this.cdr.detectChanges();
      }
    });
  }

  onPageChange(newPage: number) {
    if (newPage >= 0 && newPage < this.totalPages) {
      this.fetchLogs(newPage);
    }
  }

  translateAction(action: string): string {
    return this.actionMap[action] || action || '-';
  }

  translateDescription(log: any): string {
    if (log.action === 'LOGIN') return 'Đăng nhập thành công';
    if (log.action === 'LOGOUT') return 'Đăng xuất';
    if (log.action === 'CREATE_NEW_PLANT') return `Tạo cây mới: ${log.description?.split(':')[1]?.trim() || ''}`;
    if (log.action === 'SETUP_CARE_REMINDERS') return 'Thiết lập nhắc nhở chăm sóc';
    return log.description || '-';
  }
}
