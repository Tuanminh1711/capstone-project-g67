import { Component } from '@angular/core';
import { MatDialogRef } from '@angular/material/dialog';
import { Register } from './register';

@Component({
  selector: 'app-register-dialog',
  standalone: true,
  imports: [Register],
  template: `<div class="dialog-wrapper">
    <button class="dialog-close-x" (click)="close()">&times;</button>
    <app-register></app-register>
  </div>`,
  styleUrls: ['./register.css']
})
export class RegisterDialogComponent {
  constructor(private dialogRef: MatDialogRef<RegisterDialogComponent>) {}
  close() {
    this.dialogRef.close();
  }
}
