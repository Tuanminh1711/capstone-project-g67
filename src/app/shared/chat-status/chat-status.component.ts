import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subscription } from 'rxjs';
import { ChatStateService } from '../services/chat-state.service';
import { ChatService } from '../services/chat.service';
import { ToastService } from '../toast/toast.service';

@Component({
  selector: 'app-chat-status',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="chat-status-container" *ngIf="showStatus">
      <!-- API Status -->
      <div class="status-item" [class]="'status-' + (apisAvailable ? 'success' : 'error')">
        <i class="status-icon" [class]="apisAvailable ? 'fas fa-check-circle' : 'fas fa-exclamation-triangle'"></i>
        <span class="status-text">
          {{ apisAvailable ? 'Chat APIs Available' : 'Chat APIs Unavailable' }}
        </span>
        <span class="status-time" *ngIf="lastCheckTime">
          {{ lastCheckTime | date:'HH:mm:ss' }}
        </span>
      </div>

      <!-- WebSocket Status -->
      <div class="status-item" [class]="'status-' + (websocketConnected ? 'success' : 'warning')">
        <i class="status-icon" [class]="websocketConnected ? 'fas fa-wifi' : 'fas fa-wifi-slash'"></i>
        <span class="status-text">
          {{ websocketConnected ? 'WebSocket Connected' : 'WebSocket Disconnected' }}
        </span>
      </div>

      <!-- Environment Info -->
      <div class="status-item status-info">
        <i class="status-icon fas fa-server"></i>
        <span class="status-text">
          {{ isProduction ? 'Production' : 'Development' }}
        </span>
        <span class="status-url">{{ apiBaseUrl }}</span>
      </div>

      <!-- Actions -->
      <div class="status-actions" *ngIf="!apisAvailable">
        <button class="btn btn-sm btn-primary" (click)="refreshApis()">
          <i class="fas fa-sync-alt"></i> Retry
        </button>
        <button class="btn btn-sm btn-secondary" (click)="showHelp()">
          <i class="fas fa-question-circle"></i> Help
        </button>
      </div>
    </div>
  `,
  styles: [`
    .chat-status-container {
      position: fixed;
      top: 20px;
      right: 20px;
      z-index: 1000;
      background: white;
      border-radius: 8px;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
      padding: 16px;
      min-width: 300px;
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
    }

    .status-item {
      display: flex;
      align-items: center;
      margin-bottom: 12px;
      padding: 8px 12px;
      border-radius: 6px;
      font-size: 14px;
    }

    .status-item:last-child {
      margin-bottom: 0;
    }

    .status-success {
      background-color: #d4edda;
      color: #155724;
      border: 1px solid #c3e6cb;
    }

    .status-error {
      background-color: #f8d7da;
      color: #721c24;
      border: 1px solid #f5c6cb;
    }

    .status-warning {
      background-color: #fff3cd;
      color: #856404;
      border: 1px solid #ffeaa7;
    }

    .status-info {
      background-color: #d1ecf1;
      color: #0c5460;
      border: 1px solid #bee5eb;
    }

    .status-icon {
      margin-right: 8px;
      font-size: 16px;
    }

    .status-text {
      flex: 1;
      font-weight: 500;
    }

    .status-time, .status-url {
      font-size: 12px;
      opacity: 0.8;
      margin-left: 8px;
    }

    .status-actions {
      display: flex;
      gap: 8px;
      margin-top: 12px;
      padding-top: 12px;
      border-top: 1px solid #e9ecef;
    }

    .btn {
      padding: 6px 12px;
      border: none;
      border-radius: 4px;
      font-size: 12px;
      cursor: pointer;
      display: flex;
      align-items: center;
      gap: 4px;
      transition: all 0.2s ease;
    }

    .btn-primary {
      background-color: #007bff;
      color: white;
    }

    .btn-primary:hover {
      background-color: #0056b3;
    }

    .btn-secondary {
      background-color: #6c757d;
      color: white;
    }

    .btn-secondary:hover {
      background-color: #545b62;
    }

    .btn-sm {
      padding: 4px 8px;
      font-size: 11px;
    }

    /* Responsive */
    @media (max-width: 768px) {
      .chat-status-container {
        top: 10px;
        right: 10px;
        left: 10px;
        min-width: auto;
      }
    }
  `]
})
export class ChatStatusComponent implements OnInit, OnDestroy {
  // Status properties
  apisAvailable = true;
  websocketConnected = false;
  lastCheckTime: Date | null = null;
  isProduction = false;
  apiBaseUrl = '';
  showStatus = false;

  // Subscriptions
  private subscriptions = new Subscription();

  constructor(
    private chatStateService: ChatStateService,
    private chatService: ChatService,
    private toastService: ToastService
  ) {}

  ngOnInit(): void {
    this.initializeSubscriptions();
    this.updateStatus();
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }

  /**
   * Initialize subscriptions to chat state
   */
  private initializeSubscriptions(): void {
    // Subscribe to API availability
    this.subscriptions.add(
      this.chatStateService.apisAvailable$.subscribe(available => {
        this.apisAvailable = available;
        this.updateStatus();
      })
    );

    // Subscribe to WebSocket connection status
    this.subscriptions.add(
      this.chatStateService.websocketConnected$.subscribe(connected => {
        this.websocketConnected = connected;
        this.updateStatus();
      })
    );

    // Subscribe to state changes
    this.subscriptions.add(
      this.chatStateService.state$.subscribe(state => {
        this.lastCheckTime = state.lastCheckTime;
        this.isProduction = state.apisAvailable ? this.chatStateService.isProduction() : false;
        this.apiBaseUrl = this.chatStateService.getApiBaseUrl();
        this.updateStatus();
      })
    );
  }

  /**
   * Update status display
   */
  private updateStatus(): void {
    // Show status if there are issues or in development mode
    this.showStatus = !this.apisAvailable || 
                     !this.websocketConnected || 
                     this.chatStateService.isDevelopment();
  }

  /**
   * Refresh API availability check
   */
  refreshApis(): void {
    this.chatService.refreshApiAvailability().subscribe(available => {
      if (available) {
        this.toastService.success('Chat APIs are now available!', 3000);
      } else {
        this.toastService.error('Chat APIs are still unavailable', 3000);
      }
    });
  }

  /**
   * Show help information
   */
  showHelp(): void {
    const helpMessage = this.isProduction 
      ? 'Chat APIs are temporarily unavailable on the production server. The backend team is working on implementing the missing endpoints. WebSocket chat should still work for real-time messaging.'
      : 'Chat APIs are not available in development mode. Make sure your backend server is running on localhost:8080.';

    this.toastService.info(helpMessage, 8000);
  }
}
