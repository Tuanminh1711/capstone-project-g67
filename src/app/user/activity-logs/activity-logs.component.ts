import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { DatePipe } from '@angular/common';
import { TopNavigatorComponent } from '../../shared/top-navigator/top-navigator.component';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-activity-logs',
  templateUrl: './activity-logs.component.html',
  styleUrls: ['./activity-logs.component.scss'],
  standalone: true,
  imports: [DatePipe, TopNavigatorComponent]
})
export class ActivityLogsComponent implements OnInit {
  logs: any[] = [];
  actionMap: Record<string, string> = {
    LOGIN: 'Đăng nhập',
    LOGOUT: 'Đăng xuất',
    CREATE_NEW_PLANT: 'Tạo cây mới',
    SETUP_CARE_REMINDERS: 'Thiết lập nhắc nhở',
    // Thêm các action khác nếu có
  };

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
  loading = true;
  error: string | null = null;

  constructor(private http: HttpClient, private cdr: ChangeDetectorRef) {}

  ngOnInit() {
    this.fetchLogs();
  }

  fetchLogs() {
    this.loading = true;
    this.error = null;
    this.http.post<any>('http://localhost:8080/api/personal/activity-logs', {}).subscribe({
      next: (res) => {
        this.logs = res?.data?.content || res?.data?.logs || res?.data || [];
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
}
