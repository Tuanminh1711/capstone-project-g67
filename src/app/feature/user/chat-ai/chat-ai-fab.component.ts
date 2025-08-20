
import { Component, OnInit, OnDestroy, ChangeDetectorRef, NgZone } from '@angular/core';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { ChatAiComponent } from './chat-ai.component';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../../auth/auth.service';
import { AuthDialogService } from '../../../auth/auth-dialog.service';
import { Router, NavigationEnd } from '@angular/router';
import { filter, takeUntil } from 'rxjs/operators';
import { Subject } from 'rxjs';

@Component({
  selector: 'app-chat-ai-fab',
  standalone: true,
  imports: [CommonModule, MatDialogModule],
  template: `
  <!-- Chat AI FAB -->
    <div *ngIf="shouldShowFab()"
         class="chat-ai-fab-container"
         [ngStyle]="getFabContainerStyle()">
      <button class="chat-ai-fab-button"
              (click)="openDialog()"
              (mousedown)="handleMouseDown($event)"
              (touchstart)="handleTouchStart($event)"
              (mouseenter)="handleMouseEnter($event)"
              (mouseleave)="handleMouseLeave($event)"
              style="width: 56px; height: 56px; border-radius: 50%; background: transparent; color: inherit; border: none; box-shadow: none; display: flex; align-items: center; justify-content: center; font-size: 2rem; cursor: pointer; padding: 0;">
        🤖
      </button>
    </div>
  `,
})
export class ChatAiFabComponent implements OnInit, OnDestroy {

  getFabContainerStyle() {
    // Nếu có custom position (kéo thả), chỉ set left/top
    if (this.position.x !== null && this.position.y !== null) {
      return {
        position: 'fixed',
        left: this.position.x + 'px',
        top: this.position.y + 'px',
        zIndex: 2147483647,
        width: '56px',
        height: '56px',
        border: 'none',
        background: 'transparent',
        boxShadow: 'none',
        padding: 0
      };
    } else {
      // Mặc định ở góc phải dưới
      return {
        position: 'fixed',
        right: '20px',
        bottom: '20px',
        zIndex: 2147483647,
        width: '56px',
        height: '56px',
        border: 'none',
        background: 'transparent',
        boxShadow: 'none',
        padding: 0
      };
    }
  }
  
  isLoggedIn = false;
  isOnAdminLogin = false;
  isDialogOpen = false;
  position = { x: null as number | null, y: null as number | null };
   userRole: string | null = null;
  
  // Drag functionality
  isDragging = false;
  dragStarted = false;
  private dragThreshold = 8; // Ngưỡng để phân biệt click và drag
  private dragAnimationFrame: number | null = null;
  private dragStartPosition = { x: 0, y: 0 };
  private dragOffset = { x: 0, y: 0 };
  private destroy$ = new Subject<void>();

  constructor(
    private dialog: MatDialog, 
    private authService: AuthService, 
    private authDialogService: AuthDialogService,
    public router: Router, 
    private cdr: ChangeDetectorRef,
    private ngZone: NgZone
  ) {
    this.checkCurrentRoute();
  }

  ngOnInit() {
    this.loadPosition();
    this.checkCurrentRoute();
    
    // Listen to route changes
    this.router.events
      .pipe(
        filter(event => event instanceof NavigationEnd),
        takeUntil(this.destroy$)
      )
      .subscribe(() => {
        this.checkCurrentRoute();
        this.updateLoginStatusAndRole();
      });

    // Listen to login success events
    this.authDialogService.loginSuccess$
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.updateLoginStatusAndRole();
        this.cdr.detectChanges();
      });

    // Check login status periodically (every 30 seconds)
    setInterval(() => {
      const currentStatus = this.isLoggedIn;
      const currentRole = this.userRole;
      this.updateLoginStatusAndRole();
      if (currentStatus !== this.isLoggedIn || currentRole !== this.userRole) {
        this.cdr.detectChanges();
      }
    }, 30000);
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  handleMouseDown(event: MouseEvent) {
    event.preventDefault();
    this.startDrag(event.clientX, event.clientY);
    
    // Add global listeners
    const mouseMoveListener = (e: MouseEvent) => {
      if (this.dragAnimationFrame) {
        cancelAnimationFrame(this.dragAnimationFrame);
      }
      this.dragAnimationFrame = requestAnimationFrame(() => {
        this.handleDragMove(e.clientX, e.clientY);
      });
    };
    const mouseUpListener = () => {
      this.endDrag();
      document.removeEventListener('mousemove', mouseMoveListener);
      document.removeEventListener('mouseup', mouseUpListener);
    };
    
    document.addEventListener('mousemove', mouseMoveListener);
    document.addEventListener('mouseup', mouseUpListener);
  }

  handleTouchStart(event: TouchEvent) {
    event.preventDefault();
    const touch = event.touches[0];
    this.startDrag(touch.clientX, touch.clientY);

    // Add global listeners
    const touchMoveListener = (e: TouchEvent) => {
      e.preventDefault();
      const touch = e.touches[0];
      if (this.dragAnimationFrame) {
        cancelAnimationFrame(this.dragAnimationFrame);
      }
      this.dragAnimationFrame = requestAnimationFrame(() => {
        this.handleDragMove(touch.clientX, touch.clientY);
      });
    };

    const touchEndListener = () => {
      // Nếu không thực sự kéo, coi là click và mở dialog
      if (!this.dragStarted) {
        this.endDrag();
        this.openDialog();
        this.cdr.detectChanges(); // Fix ExpressionChangedAfterItHasBeenCheckedError
      } else {
        this.endDrag();
      }
      document.removeEventListener('touchmove', touchMoveListener);
      document.removeEventListener('touchend', touchEndListener);
    };

    document.addEventListener('touchmove', touchMoveListener, { passive: false });
    document.addEventListener('touchend', touchEndListener);
    // Đăng ký lại touchstart với passive: false để đảm bảo không bị chặn
    document.addEventListener('touchstart', () => {}, { passive: false });
  }

  private startDrag(clientX: number, clientY: number) {
    this.isDragging = true;
    this.dragStarted = false;
    this.dragStartPosition = { x: clientX, y: clientY };
    
    // Calculate drag offset from button center
    const button = document.querySelector('.chat-ai-fab-button') as HTMLElement;
    if (button) {
      const rect = button.getBoundingClientRect();
      this.dragOffset = {
        x: clientX - rect.left,
        y: clientY - rect.top
      };
  // Add dragging class for visual feedback
  button.classList.add('dragging');
  button.style.cursor = 'grabbing';
  button.style.transition = 'box-shadow 0.2s, left 0.15s, top 0.15s, right 0.15s, bottom 0.15s';
    }
  }

  private handleDragMove(clientX: number, clientY: number) {
    if (!this.isDragging) return;

    // Check if moved enough to be considered a drag
    const distance = Math.sqrt(
      Math.pow(clientX - this.dragStartPosition.x, 2) + 
      Math.pow(clientY - this.dragStartPosition.y, 2)
    );
    // Giảm threshold cho nhạy hơn
    if (distance > 2) {
      this.dragStarted = true;
      this.updateDragPosition(clientX, clientY);
    }
  }

  private updateDragPosition(clientX: number, clientY: number) {
    const newX = clientX - this.dragOffset.x;
    const newY = clientY - this.dragOffset.y;
    
    // Constrain within viewport
    const padding = 10;
    const maxX = window.innerWidth - 56 - padding;
    const maxY = window.innerHeight - 56 - padding;
    
    this.position.x = Math.max(padding, Math.min(newX, maxX));
    this.position.y = Math.max(padding, Math.min(newY, maxY));
  }

  private endDrag() {
    this.isDragging = false;
    if (this.dragAnimationFrame) {
      cancelAnimationFrame(this.dragAnimationFrame);
      this.dragAnimationFrame = null;
    }
    
    // Remove dragging class
    const button = document.querySelector('.chat-ai-fab-button') as HTMLElement;
    if (button) {
      button.classList.remove('dragging');
      button.style.cursor = 'pointer';
      button.style.transition = 'box-shadow 0.2s, left 0.15s, top 0.15s, right 0.15s, bottom 0.15s';
    }
    
    if (this.dragStarted) {
      this.savePosition();
    }
  }

  handleMouseEnter(event: MouseEvent) {
    if (!this.isDragging) {
      const button = event.target as HTMLElement;
      if (button) {
        // Normal hover effect
        button.style.background = 'linear-gradient(135deg, #388e3c, #4a7c35)';
        button.style.boxShadow = '0 8px 24px rgba(30, 174, 96, 0.28)';
        button.style.transform = 'scale(1.05)';
      }
    }
  }

  handleMouseLeave(event: MouseEvent) {
    if (!this.isDragging) {
      const button = event.target as HTMLElement;
      if (button) {
        // Restore to normal state
        button.style.background = 'linear-gradient(135deg, #178a4c, #a8e063)';
        button.style.boxShadow = '0 4px 16px rgba(30, 174, 96, 0.18)';
        button.style.transform = '';
      }
    }
  }

  openDialog() {
    // Chỉ mở dialog nếu KHÔNG phải là drag và chưa mở dialog
    if (this.dragStarted) {
      this.dragStarted = false;
      return;
    }
    if (this.isDialogOpen) return;


    this.isDialogOpen = true;

    // Responsive dialog size
    let width = '400px';
    let height = '70vh';
    if (window.innerWidth < 600) {
      width = '95vw';
      height = '60vh';
    }

    this.cdr.detectChanges(); // Thêm dòng này để tránh lỗi ExpressionChangedAfterItHasBeenCheckedError

    const dialogRef = this.dialog.open(ChatAiComponent, {
      width,
      height,
      maxWidth: '98vw',
      position: { right: '8px', bottom: '8px' },
      panelClass: 'chat-ai-dialog-panel',
      autoFocus: false,
      hasBackdrop: false,
      backdropClass: 'no-backdrop',
      disableClose: false
    });

    dialogRef.afterClosed().subscribe(() => {
      this.ngZone.run(() => {
        this.isDialogOpen = false;
        this.updateLoginStatusAndRole();
        this.cdr.detectChanges();
      });
    });
  }

  private loadPosition() {
    const savedPosition = localStorage.getItem('chat-ai-fab-position');
    if (savedPosition) {
      const pos = JSON.parse(savedPosition);
      // Đảm bảo không bị lưu giá trị ngoài viewport
      const padding = 10;
      const maxX = window.innerWidth - 56 - padding;
      const maxY = window.innerHeight - 56 - padding;
      if (typeof pos.x === 'number' && typeof pos.y === 'number') {
        this.position.x = Math.max(padding, Math.min(pos.x, maxX));
          const currentRole = this.userRole;
      } else {
        this.position = { x: null, y: null };
      }
    }
  }

  private savePosition() {
    localStorage.setItem('chat-ai-fab-position', JSON.stringify(this.position));
  }

  private checkCurrentRoute() {
    const currentUrl = this.router.url;
    this.isOnAdminLogin = currentUrl.includes('/login-admin');
  }
      private updateLoginStatusAndRole() {
        const newStatus = this.authService.isLoggedIn();
        const newRole = this.authService.getCurrentUserRole()?.toLowerCase() || null;
        this.isLoggedIn = newStatus;
        this.userRole = newRole;
      }



  shouldShowFab(): boolean {
    // Chỉ hiện nếu đăng nhập và role là user hoặc vip
    return (
      this.isLoggedIn &&
      !this.isOnAdminLogin &&
      !this.isDialogOpen &&
      (this.userRole === 'user' || this.userRole === 'vip')
    );
  }
}
