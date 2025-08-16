import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subject, takeUntil } from 'rxjs';
import { trigger, state, style, transition, animate } from '@angular/animations';
import { ConfirmationDialogService, ConfirmationDialogData } from '../../services/confirmation-dialog/confirmation-dialog.service';

@Component({
  selector: 'app-confirmation-dialog',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './confirmation-dialog.component.html',
  styleUrls: ['./confirmation-dialog.component.scss'],
  animations: [
    trigger('fadeIn', [
      transition(':enter', [
        style({ opacity: 0 }),
        animate('300ms ease-in', style({ opacity: 1 }))
      ]),
      transition(':leave', [
        animate('300ms ease-out', style({ opacity: 0 }))
      ])
    ]),
    trigger('slideIn', [
      transition(':enter', [
        style({ transform: 'scale(0.8) translateY(-50px)', opacity: 0 }),
        animate('300ms cubic-bezier(0.34, 1.56, 0.64, 1)', 
                style({ transform: 'scale(1) translateY(0)', opacity: 1 }))
      ]),
      transition(':leave', [
        animate('200ms ease-out', 
                style({ transform: 'scale(0.8) translateY(-50px)', opacity: 0 }))
      ])
    ])
  ]
})
export class ConfirmationDialogComponent implements OnInit, OnDestroy {
  dialogData: ConfirmationDialogData | null = null;
  isVisible = false;
  private readonly destroy$ = new Subject<void>();
  private readonly confirmationService = inject(ConfirmationDialogService) as ConfirmationDialogService;

  ngOnInit(): void {
    this.confirmationService.dialogData$
      .pipe(takeUntil(this.destroy$))
      .subscribe((data: ConfirmationDialogData | null) => {
        this.dialogData = data;
        this.isVisible = !!data;
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  onConfirm(): void {
    this.confirmationService.confirm();
  }

  onCancel(): void {
    this.confirmationService.cancel();
  }

  onBackdropClick(): void {
    this.confirmationService.close();
  }

  onDialogClick(event: Event): void {
    event.stopPropagation();
  }
  getIconClass(): string {
    switch (this.dialogData?.type) {
      case 'danger':
        return 'icon-danger';
      case 'warning':
        return 'icon-warning';
      case 'info':
        return 'icon-info';
      case 'success':
        return 'icon-success';
      default:
        return 'icon-warning';
    }
  }
}
