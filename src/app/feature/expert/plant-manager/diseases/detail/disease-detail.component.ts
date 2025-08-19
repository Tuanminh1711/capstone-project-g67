import { Component, OnInit, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, ActivatedRoute, Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { DiseaseService } from '../shared/disease.service';
import { PlantDisease } from '../shared/disease.model';

@Component({
  selector: 'app-disease-detail',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatCardModule,
    MatIconModule,
    MatButtonModule,
    MatProgressSpinnerModule,
    MatSnackBarModule
  ],
  templateUrl: './disease-detail.component.html',
  styleUrls: ['./disease-detail.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class DiseaseDetailComponent implements OnInit {
  disease: PlantDisease | null = null;
  loading = true;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private diseaseService: DiseaseService,
    private snackBar: MatSnackBar,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.route.params.subscribe(params => {
      const id = params['id'];
      if (id) {
        this.disease = null;
        this.loading = true;
        this.cdr.detectChanges();
        this.loadDisease(parseInt(id, 10));
      }
    });
  }

  loadDisease(id: number): void {
    this.diseaseService.getPlantDiseaseById(id).subscribe({
      next: (response) => {
        this.disease = response.data;
        this.loading = false;
        Promise.resolve().then(() => this.cdr.detectChanges());
      },
      error: (error) => {
        this.snackBar.open('Lỗi khi tải thông tin bệnh cây', 'Đóng', {
          duration: 3000
        });
        this.loading = false;
        this.cdr.detectChanges();
        this.router.navigate(['/expert/plant-manager/diseases/list']);
      }
    });
  }

  getCategoryIcon(category: string): string {
    switch (category?.toLowerCase()) {
      case 'nấm': return 'mold';
      case 'côn trùng': return 'bug_report';
      case 'vi khuẩn': return 'bacteria';
      case 'virus': return 'coronavirus';
      case 'sinh lý': return 'eco';
      default: return 'help_outline';
    }
  }

  getSeverityLabel(severity: string): string {
    const labels: Record<string, string> = {
      'LOW': 'Thấp',
      'MEDIUM': 'Trung bình',
      'HIGH': 'Cao',
      'CRITICAL': 'Nghiêm trọng'
    };
    return labels[severity] || severity;
  }
}
