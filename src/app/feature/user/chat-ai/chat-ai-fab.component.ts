
import { Component, OnInit, OnDestroy, ChangeDetectorRef, AfterViewInit, Renderer2, Inject } from '@angular/core';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { ChatAiComponent } from './chat-ai.component';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../../auth/auth.service';
import { AuthDialogService } from '../../../auth/auth-dialog.service';
import { Router, NavigationEnd } from '@angular/router';
import { filter, takeUntil } from 'rxjs/operators';
import { Subject } from 'rxjs';
import { DOCUMENT } from '@angular/common';

@Component({
  selector: 'app-chat-ai-fab',
  standalone: true,
  imports: [CommonModule, MatDialogModule],
  template: ``
})
export class ChatAiFabComponent implements OnInit, OnDestroy, AfterViewInit {
  
  isLoggedIn = false;
  isOnAdminLogin = false;
  isDialogOpen = false;
  position = { x: null as number | null, y: null as number | null };
  
  // Drag functionality
  isDragging = false;
  dragStarted = false;
  private dragThreshold = 8; // Ngưỡng để phran biệt click và drag
  private dragStartPosition = { x: 0, y: 0 };
  private dragOffset = { x: 0, y: 0 };
  private destroy$ = new Subject<void>();
  portalElement: HTMLElement | null = null;

  constructor(
    private dialog: MatDialog, 
    private authService: AuthService, 
    private authDialogService: AuthDialogService,
    public router: Router, 
    private cdr: ChangeDetectorRef,
    private renderer: Renderer2,
    @Inject(DOCUMENT) private document: Document
  ) {
    this.updateLoginStatus();
    this.checkCurrentRoute();
    
    // Clean up any existing chat AI elements on init
    this.cleanupExistingElements();
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
        this.updateLoginStatus();
      });

    // Listen to login success events
    this.authDialogService.loginSuccess$
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.updateLoginStatus();
        this.cdr.detectChanges();
      });

    // Check login status periodically (every 30 seconds)
    setInterval(() => {
      const currentStatus = this.isLoggedIn;
      this.updateLoginStatus();
      if (currentStatus !== this.isLoggedIn) {
        this.cdr.detectChanges();
      }
    }, 30000);
  }

  ngAfterViewInit() {
    // Create portal element attached to body for maximum z-index
    this.createPortalElement();
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
    this.destroyPortalElement();
  }

  private createPortalElement() {
    if (!this.shouldShowFab()) return;
    
    // Ensure only one portal element exists
    if (this.portalElement) {
      this.destroyPortalElement();
    }
    
    // Remove any existing chat AI elements from DOM
    const existingElements = this.document.querySelectorAll('.chat-ai-portal, .chat-ai-fab-portal, [class*="chat-ai"]');
    existingElements.forEach(el => {
      if (el.parentNode) {
        el.parentNode.removeChild(el);
      }
    });
    
    this.portalElement = this.renderer.createElement('div');
    this.renderer.addClass(this.portalElement, 'chat-ai-portal');
    this.renderer.setAttribute(this.portalElement, 'id', 'chat-ai-fab-portal');
    this.renderer.setStyle(this.portalElement, 'position', 'fixed');
    this.renderer.setStyle(this.portalElement, 'z-index', '2147483648');
    this.renderer.setStyle(this.portalElement, 'pointer-events', 'none');
    this.renderer.setStyle(this.portalElement, 'width', '56px');
    this.renderer.setStyle(this.portalElement, 'height', '56px');
    
    // Set initial position
    this.updatePortalPosition();
    
    // Create the button
    const button = this.renderer.createElement('button');
    this.renderer.addClass(button, 'chat-ai-fab-portal');
    this.renderer.setStyle(button, 'position', 'relative');
    this.renderer.setStyle(button, 'pointer-events', 'auto');
    this.renderer.setStyle(button, 'width', '56px');
    this.renderer.setStyle(button, 'height', '56px');
    this.renderer.setStyle(button, 'border-radius', '50%');
    this.renderer.setStyle(button, 'background', 'linear-gradient(135deg, #178a4c, #a8e063)');
    this.renderer.setStyle(button, 'color', '#fff');
    this.renderer.setStyle(button, 'border', 'none');
    this.renderer.setStyle(button, 'box-shadow', '0 4px 16px rgba(30, 174, 96, 0.18)');
    this.renderer.setStyle(button, 'display', 'flex');
    this.renderer.setStyle(button, 'align-items', 'center');
    this.renderer.setStyle(button, 'justify-content', 'center');
    this.renderer.setStyle(button, 'font-size', '2rem');
    this.renderer.setStyle(button, 'cursor', 'pointer');
    this.renderer.setStyle(button, 'transition', 'background 0.2s ease, box-shadow 0.2s ease, transform 0.1s ease');
    this.renderer.setStyle(button, 'user-select', 'none');
    this.renderer.setStyle(button, '-webkit-user-select', 'none');
    this.renderer.setStyle(button, 'touch-action', 'none');
    
    // Add emoji
    const span = this.renderer.createElement('span');
    const text = this.renderer.createText('🤖');
    this.renderer.appendChild(span, text);
    this.renderer.appendChild(button, span);
    
    // Add event listeners for drag, click, and hover
    this.renderer.listen(button, 'click', (event) => this.handlePortalClick(event));
    this.renderer.listen(button, 'mousedown', (event) => this.handlePortalMouseDown(event));
    this.renderer.listen(button, 'touchstart', (event) => this.handlePortalTouchStart(event));
    this.renderer.listen(button, 'mouseenter', () => this.handlePortalMouseEnter(button));
    this.renderer.listen(button, 'mouseleave', () => this.handlePortalMouseLeave(button));
    
    // Store button reference for styling updates
    if (this.portalElement) {
      this.portalElement.appendChild(button);
      this.renderer.appendChild(this.document.body, this.portalElement);
    }
    

  }

  private destroyPortalElement() {
    // Remove by reference if available
    if (this.portalElement) {
      this.renderer.removeChild(this.document.body, this.portalElement);
      this.portalElement = null;
    }
    
    // Also remove by ID as fallback
    const existingPortal = this.document.getElementById('chat-ai-fab-portal');
    if (existingPortal && existingPortal.parentNode) {
      existingPortal.parentNode.removeChild(existingPortal);
    }
    
    // Clean up any orphaned chat AI elements
    const orphanedElements = this.document.querySelectorAll('.chat-ai-portal, .chat-ai-fab-portal');
    orphanedElements.forEach(el => {
      if (el.parentNode) {
        el.parentNode.removeChild(el);
      }
    });
  }

  private updatePortalVisibility() {
    if (this.shouldShowFab() && !this.portalElement) {
      this.createPortalElement();
    } else if (!this.shouldShowFab() && this.portalElement) {
      this.destroyPortalElement();
    } else if (this.shouldShowFab() && this.portalElement) {
      // Update position if portal exists but position changed
      this.updatePortalPosition();
    }
  }

  private updatePortalPosition() {
    if (!this.portalElement) return;
    
    if (this.position.x !== null && this.position.y !== null) {
      this.renderer.setStyle(this.portalElement, 'left', `${this.position.x}px`);
      this.renderer.setStyle(this.portalElement, 'top', `${this.position.y}px`);
      this.renderer.setStyle(this.portalElement, 'right', 'auto');
      this.renderer.setStyle(this.portalElement, 'bottom', 'auto');
    } else {
      this.renderer.setStyle(this.portalElement, 'right', '32px');
      this.renderer.setStyle(this.portalElement, 'bottom', '32px');
      this.renderer.setStyle(this.portalElement, 'left', 'auto');
      this.renderer.setStyle(this.portalElement, 'top', 'auto');
    }
  }

  private handlePortalClick(event: Event) {
    // Only open dialog if it wasn't a drag
    if (this.dragStarted) {
      this.dragStarted = false;
      return;
    }
    this.openDialog();
  }

  private handlePortalMouseDown(event: MouseEvent) {
    event.preventDefault();
    this.startPortalDrag(event.clientX, event.clientY);
    
    // Add global listeners
    const mouseMoveListener = this.renderer.listen('document', 'mousemove', (e) => this.handlePortalDragMove(e.clientX, e.clientY));
    const mouseUpListener = this.renderer.listen('document', 'mouseup', () => {
      this.endPortalDrag();
      mouseMoveListener();
      mouseUpListener();
    });
  }

  private handlePortalTouchStart(event: TouchEvent) {
    event.preventDefault();
    const touch = event.touches[0];
    this.startPortalDrag(touch.clientX, touch.clientY);
    
    // Add global listeners
    const touchMoveListener = this.renderer.listen('document', 'touchmove', (e) => {
      e.preventDefault();
      const touch = e.touches[0];
      this.handlePortalDragMove(touch.clientX, touch.clientY);
    });
    const touchEndListener = this.renderer.listen('document', 'touchend', () => {
      this.endPortalDrag();
      touchMoveListener();
      touchEndListener();
    });
  }

  private startPortalDrag(clientX: number, clientY: number) {
    this.isDragging = true;
    this.dragStarted = false;
    this.dragStartPosition = { x: clientX, y: clientY };
    
    if (this.portalElement) {
      const rect = this.portalElement.getBoundingClientRect();
      this.dragOffset = {
        x: clientX - rect.left,
        y: clientY - rect.top
      };
      
      // Add dragging class for visual feedback
      const button = this.portalElement.querySelector('button');
      if (button) {
        this.renderer.addClass(button, 'dragging');
        this.renderer.setStyle(button, 'cursor', 'grabbing');
        this.renderer.setStyle(button, 'transform', 'scale(1.1) translateZ(0)');
        this.renderer.setStyle(button, 'box-shadow', '0 12px 32px rgba(30, 174, 96, 0.4)');
        this.renderer.setStyle(button, 'transition', 'none');
      }
    }
  }

  private handlePortalDragMove(clientX: number, clientY: number) {
    if (!this.isDragging) return;

    // Check if moved enough to be considered a drag
    const distance = Math.sqrt(
      Math.pow(clientX - this.dragStartPosition.x, 2) + 
      Math.pow(clientY - this.dragStartPosition.y, 2)
    );

    if (distance > this.dragThreshold) {
      this.dragStarted = true;
      this.updatePortalDragPosition(clientX, clientY);
    }
  }

  private updatePortalDragPosition(clientX: number, clientY: number) {
    const newX = clientX - this.dragOffset.x;
    const newY = clientY - this.dragOffset.y;
    
    // Constrain within viewport
    const padding = 10;
    const maxX = window.innerWidth - 56 - padding;
    const maxY = window.innerHeight - 56 - padding;
    
    this.position.x = Math.max(padding, Math.min(newX, maxX));
    this.position.y = Math.max(padding, Math.min(newY, maxY));
    
    this.updatePortalPosition();
  }

  private endPortalDrag() {
    this.isDragging = false;
    
    if (this.portalElement) {
      const button = this.portalElement.querySelector('button');
      if (button) {
        this.renderer.removeClass(button, 'dragging');
        this.renderer.setStyle(button, 'cursor', 'pointer');
        this.renderer.setStyle(button, 'transform', 'translateZ(0)');
        this.renderer.setStyle(button, 'box-shadow', '0 4px 16px rgba(30, 174, 96, 0.18)');
        this.renderer.setStyle(button, 'transition', 'background 0.2s ease, box-shadow 0.2s ease, transform 0.1s ease');
      }
    }
    
    if (this.dragStarted) {
      this.savePosition();
    }
  }

  private handlePortalMouseEnter(button: HTMLElement) {
    if (!this.isDragging) {
      // Normal hover effect
      this.renderer.setStyle(button, 'background', 'linear-gradient(135deg, #388e3c, #4a7c35)');
      this.renderer.setStyle(button, 'box-shadow', '0 8px 24px rgba(30, 174, 96, 0.28)');
      this.renderer.setStyle(button, 'transform', 'scale(1.05) translateZ(0)');
    }
  }

  private handlePortalMouseLeave(button: HTMLElement) {
    if (!this.isDragging) {
      // Restore to normal state
      this.renderer.setStyle(button, 'background', 'linear-gradient(135deg, #178a4c, #a8e063)');
      this.renderer.setStyle(button, 'box-shadow', '0 4px 16px rgba(30, 174, 96, 0.18)');
      this.renderer.setStyle(button, 'transform', 'translateZ(0)');
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
    this.updatePortalVisibility(); // Hide icon when dialog opens
    
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
      this.updatePortalVisibility(); // Show icon when dialog closes
      this.cdr.detectChanges();
    });
  }

  private loadPosition() {
    const savedPosition = localStorage.getItem('chat-ai-fab-position');
    if (savedPosition) {
      this.position = JSON.parse(savedPosition);
    }
  }

  private savePosition() {
    localStorage.setItem('chat-ai-fab-position', JSON.stringify(this.position));
  }

  private checkCurrentRoute() {
    const currentUrl = this.router.url;
    this.isOnAdminLogin = currentUrl.includes('/login-admin');
  }

  private updateLoginStatus() {
    const newStatus = this.authService.isLoggedIn();
    if (this.isLoggedIn !== newStatus) {
      this.isLoggedIn = newStatus;
      this.updatePortalVisibility();
    }
  }

  shouldShowFab(): boolean {
    return this.isLoggedIn && !this.isOnAdminLogin && !this.isDialogOpen;
  }

  private cleanupExistingElements() {
    // Remove any existing chat AI elements that might be left over
    const existingElements = this.document.querySelectorAll(
      '#chat-ai-fab-portal, .chat-ai-portal, .chat-ai-fab-portal, [class*="chat-ai-fab"]'
    );
    existingElements.forEach(el => {
      if (el.parentNode) {
        el.parentNode.removeChild(el);
      }
    });
  }


}
