import { Injectable, Inject, PLATFORM_ID } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';

@Injectable({ providedIn: 'root' })
export class DialogManager {
  private dialogOpened = false;

  constructor(
    private dialog: MatDialog,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {}

  open(component: any): void {
    if (this.dialogOpened) return;
    this.dialogOpened = true;
    // Nếu là LoginDialogComponent thì không set width nhỏ, để mặc định
    const isLoginDialog = component && component.name === 'LoginDialogComponent';
    const dialogRef = this.dialog.open(component, isLoginDialog ? {
      disableClose: true,
      panelClass: ['dialog-panel-bg', 'high-z-index'],
      backdropClass: 'high-z-backdrop'
    } : {
      disableClose: true,
      panelClass: 'dialog-panel-bg'
    });
    dialogRef.afterClosed().subscribe(() => {
      this.dialogOpened = false;
    });
  }
}
