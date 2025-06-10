import { Component, Optional } from '@angular/core';
import { MatDialogRef } from '@angular/material/dialog';

@Component({
  selector: 'app-register',
  standalone: true,
  templateUrl: './register.html',
  styleUrl: './register.css'
})
export class Register {
  constructor(@Optional() private dialogRef?: MatDialogRef<Register>) {}

  close() {
    if (this.dialogRef) {
      this.dialogRef.close();
    }
  }
}
