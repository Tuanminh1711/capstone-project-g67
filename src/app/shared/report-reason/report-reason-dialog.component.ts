import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatDialogRef } from '@angular/material/dialog';

@Component({
  selector: 'app-report-reason-dialog',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './report-reason-dialog.component.html',
  styleUrls: ['./report-reason-dialog.component.scss']
})
export class ReportReasonDialogComponent {
  reason = '';
  errorMsg = '';
  private dialogRef = inject(MatDialogRef<ReportReasonDialogComponent>);

  onCancel() {
    this.dialogRef.close(null);
  }

  onSubmit() {
    if (!this.reason.trim()) {
      this.errorMsg = 'Vui lòng nhập lý do báo cáo.';
      return;
    }
    this.dialogRef.close(this.reason.trim());
  }
}
