
import { Component, OnInit, OnDestroy, ElementRef, ViewChild, ChangeDetectorRef } from '@angular/core';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { ChatAiComponent } from './chat-ai.component';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../../auth/auth.service';
import { Router, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';

@Component({
  selector: 'app-chat-ai-fab',
  standalone: true,
  imports: [CommonModule, MatDialogModule],
  template: `
    <button 
      *ngIf="isLoggedIn && !isOnAdminLogin && !isDialogOpen" 
      #fabButton
      class="chat-ai-fab" 
      (click)="openDialog()"
      (mousedown)="onMouseDown($event)"
      (touchstart)="onTouchStart($event)"
      [style.left.px]="position.x"
      [style.top.px]="position.y"
      [style.right]="position.x !== null ? 'auto' : '32px'"
      [style.bottom]="position.y !== null ? 'auto' : '32px'"
      title="Chat AI - Có thể kéo thả để di chuyển">
      <span>🤖</span>
    </button>
  `,
  styleUrls: ['./chat-ai-fab.component.scss']
})
export class ChatAiFabComponent implements OnInit, OnDestroy {
  @ViewChild('fabButton', { static: false }) fabButton!: ElementRef;
  
  isLoggedIn = false;
  isOnAdminLogin = false;
  isDialogOpen = false;
  position = { x: null as number | null, y: null as number | null };
  
  // Drag functionality
  private isDragging = false;
  private dragStarted = false;
  private dragThreshold = 8; // Ngưỡng để phân biệt click và drag
  private dragStartPosition = { x: 0, y: 0 };
  private dragOffset = { x: 0, y: 0 };

  constructor(private dialog: MatDialog, private authService: AuthService, private router: Router, private cdr: ChangeDetectorRef) {
    this.isLoggedIn = this.authService.isLoggedIn();
    this.checkCurrentRoute();
  }

  ngOnInit() {
    this.loadPosition();
    this.checkCurrentRoute();
    
    // Listen to route changes
    this.router.events
      .pipe(filter(event => event instanceof NavigationEnd))
      .subscribe(() => {
        this.checkCurrentRoute();
      });
  }

  ngOnDestroy() {
    this.cleanupListeners();
  }

  onMouseDown(event: MouseEvent) {
    event.preventDefault();
    this.startDrag(event.clientX, event.clientY);
    
    document.addEventListener('mousemove', this.onMouseMove);
    document.addEventListener('mouseup', this.onMouseUp);
  }

  onTouchStart(event: TouchEvent) {
    event.preventDefault();
    const touch = event.touches[0];
    this.startDrag(touch.clientX, touch.clientY);
    
    document.addEventListener('touchmove', this.onTouchMove, { passive: false });
    document.addEventListener('touchend', this.onTouchEnd);
  }

  private onMouseMove = (event: MouseEvent) => {
    this.handleDragMove(event.clientX, event.clientY);
  }

  private onTouchMove = (event: TouchEvent) => {
    event.preventDefault();
    const touch = event.touches[0];
    this.handleDragMove(touch.clientX, touch.clientY);
  }

  private onMouseUp = () => {
    this.endDrag();
  }

  private onTouchEnd = () => {
    this.endDrag();
  }

  private startDrag(clientX: number, clientY: number) {
    this.isDragging = true;
    this.dragStarted = false;
    this.dragStartPosition = { x: clientX, y: clientY };
    
    const rect = this.fabButton.nativeElement.getBoundingClientRect();
    this.dragOffset = {
      x: clientX - rect.left,
      y: clientY - rect.top
    };
  }

  private handleDragMove(clientX: number, clientY: number) {
    if (!this.isDragging) return;

    // Kiểm tra xem đã di chuyển đủ xa để coi là drag
    const distance = Math.sqrt(
      Math.pow(clientX - this.dragStartPosition.x, 2) + 
      Math.pow(clientY - this.dragStartPosition.y, 2)
    );

    if (distance > this.dragThreshold) {
      this.dragStarted = true;
      this.updatePosition(clientX, clientY);
    }
  }

  private updatePosition(clientX: number, clientY: number) {
    const newX = clientX - this.dragOffset.x;
    const newY = clientY - this.dragOffset.y;
    
    // Giới hạn trong viewport
    const padding = 10;
    const maxX = window.innerWidth - 56 - padding;
    const maxY = window.innerHeight - 56 - padding;
    
    this.position.x = Math.max(padding, Math.min(newX, maxX));
    this.position.y = Math.max(padding, Math.min(newY, maxY));
  }

  private endDrag() {
    this.isDragging = false;
    this.cleanupListeners();
    
    if (this.dragStarted) {
      this.savePosition();
    }
  }

  private cleanupListeners() {
    document.removeEventListener('mousemove', this.onMouseMove);
    document.removeEventListener('mouseup', this.onMouseUp);
    document.removeEventListener('touchmove', this.onTouchMove);
    document.removeEventListener('touchend', this.onTouchEnd);
  }

  openDialog() {
    // Chỉ mở dialog nếu KHÔNG phải là drag và chưa mở dialog
    if (this.dragStarted) {
      this.dragStarted = false;
      return;
    }
    if (this.isDialogOpen) return;
    this.isDialogOpen = true;
    const dialogRef = this.dialog.open(ChatAiComponent, {
      width: '400px',
      height: '70vh',
      maxWidth: '90vw',
      position: { right: '24px', bottom: '24px' },
      panelClass: 'chat-ai-dialog-panel',
      autoFocus: false,
      hasBackdrop: false,
      backdropClass: 'no-backdrop',
      disableClose: false
    });
    dialogRef.afterClosed().subscribe(() => {
      this.isDialogOpen = false;
      this.cdr.detectChanges();
    });
  }

  private loadPosition() {
    const savedPosition = localStorage.getItem('chat-ai-fab-position');
    if (savedPosition) {
      this.position = JSON.parse(savedPosition);
      this.applyPosition();
    }
  }

  private savePosition() {
    localStorage.setItem('chat-ai-fab-position', JSON.stringify(this.position));
  }

  private applyPosition() {
    // Position được áp dụng qua template binding, không cần DOM manipulation
  }

  private checkCurrentRoute() {
    const currentUrl = this.router.url;
    this.isOnAdminLogin = currentUrl.includes('/login-admin');
  }
}
