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
    const dialogRef = this.dialog.open(component, {
      disableClose: true,
      panelClass: 'dialog-panel-bg'
    });
    dialogRef.afterClosed().subscribe(() => {
      this.dialogOpened = false;
    });
  }
}
