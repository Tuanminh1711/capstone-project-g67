import { Component } from '@angular/core';
import { MatDialogRef } from '@angular/material/dialog';
import { Login } from './login';

@Component({
  selector: 'app-login-dialog',
  standalone: true,
  imports: [Login],
  template: `<div class="dialog-wrapper">
    <button class="dialog-close-x" (click)="close()">&times;</button>
    <app-login></app-login>
  </div>`,
  styleUrls: ['./login.css']
})
export class LoginDialogComponent {
  constructor(private dialogRef: MatDialogRef<LoginDialogComponent>) {}
  close() {
    this.dialogRef.close();
  }
}
