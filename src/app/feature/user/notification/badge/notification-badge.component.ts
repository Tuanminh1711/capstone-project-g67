import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { NotificationService } from '../notification.service';

@Component({
  selector: 'app-notification-badge',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="notification-badge" [class.has-notifications]="unreadCount > 0">
      <i class="fas fa-bell"></i>
      <span *ngIf="unreadCount > 0" class="badge-count">
        {{ unreadCount > 99 ? '99+' : unreadCount }}
      </span>
    </div>
  `,
  styleUrls: ['./notification-badge.component.scss']
})
export class NotificationBadgeComponent implements OnInit, OnDestroy {
  unreadCount = 0;
  private destroy$ = new Subject<void>();

  constructor(private notificationService: NotificationService) {}

  ngOnInit(): void {
    this.notificationService.unreadCount$
      .pipe(takeUntil(this.destroy$))
      .subscribe(count => {
        this.unreadCount = count;
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
