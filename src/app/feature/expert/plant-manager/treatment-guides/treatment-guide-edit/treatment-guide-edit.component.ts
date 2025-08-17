import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatSelectModule } from '@angular/material/select';
import { RouterModule, ActivatedRoute, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MatSnackBar } from '@angular/material/snack-bar';
import { TreatmentGuideService } from '../treatment-guide.service';

@Component({
  selector: 'app-treatment-guide-edit',
  standalone: true,
  imports: [
    CommonModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatCardModule,
    MatSelectModule,
    RouterModule,
    FormsModule
  ],
  templateUrl: './treatment-guide-edit.component.html',
  styleUrls: ['./treatment-guide-edit.component.scss']
})
export class TreatmentGuideEditComponent implements OnInit {
  treatmentGuide = {
    stepNumber: 1,
    title: '',
    description: '',
    duration: '',
    frequency: '',
    materials: [''],
    notes: ''
  };

  private guideId: number = 0;

  constructor(
    private treatmentGuideService: TreatmentGuideService,
    private route: ActivatedRoute,
    private router: Router,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit() {
    this.guideId = Number(this.route.snapshot.paramMap.get('guideId'));
    this.snackBar.open('Chức năng chỉnh sửa hướng dẫn điều trị chưa được triển khai', 'Đóng', {
      duration: 3000
    });
  }

  onSubmit() {
    this.snackBar.open('Chức năng này chưa được triển khai', 'Đóng', {
      duration: 3000
    });
  }

  onCancel() {
    this.router.navigate(['../list'], { relativeTo: this.route });
  }
}
