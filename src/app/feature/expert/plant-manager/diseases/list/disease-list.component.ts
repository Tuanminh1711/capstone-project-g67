import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatTableModule } from '@angular/material/table';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatSnackBarModule, MatSnackBar } from '@angular/material/snack-bar';
import { MatMenuModule } from '@angular/material/menu';
import { MatCardModule } from '@angular/material/card';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { DiseaseService } from '../shared/disease.service';
import { PlantDisease } from '../shared/disease.model';

@Component({
  selector: 'app-disease-list',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatTableModule,
    MatPaginatorModule,
    MatButtonModule,
    MatIconModule,
    MatProgressBarModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
    MatMenuModule,
    MatCardModule,
    MatTooltipModule
  ],
  template: `
    <div class="disease-list-container">
      <mat-card class="header-card">
        <mat-card-header>
          <mat-card-title>Quản lý bệnh cây</mat-card-title>
          <mat-card-subtitle>Danh sách các loại bệnh hại cây trồng</mat-card-subtitle>
        </mat-card-header>
        <mat-card-actions>
          <button mat-raised-button class="add-button" [routerLink]="['../create']">
            <mat-icon>add</mat-icon>
            Thêm bệnh mới
          </button>
        </mat-card-actions>
      </mat-card>

      <mat-card class="content-card">
        <div class="loading-shade" *ngIf="loading">
          <mat-spinner diameter="40"></mat-spinner>
        </div>
        <mat-card-content>
          <table mat-table [dataSource]="diseases" class="disease-table">
            <!-- Disease Info Column -->
            <ng-container matColumnDef="disease">
              <th mat-header-cell *matHeaderCellDef>Tên bệnh</th>
              <td mat-cell *matCellDef="let disease">
                <div class="disease-info">
                  <div class="disease-name">
                    <div [class]="'disease-icon ' + disease.category?.toLowerCase()">
                      <mat-icon>{{getCategoryIcon(disease.category)}}</mat-icon>
                    </div>
                    <div class="name-details">
                      <span class="primary-name">{{disease.diseaseName}}</span>
                      <span class="scientific-name" *ngIf="disease.scientificName">{{disease.scientificName}}</span>
                    </div>
                  </div>
                  <span class="category-tag">{{disease.category}}</span>
                </div>
              </td>
            </ng-container>

            <!-- Symptoms Column -->
            <ng-container matColumnDef="symptoms">
              <th mat-header-cell *matHeaderCellDef>Triệu chứng & Điều trị</th>
              <td mat-cell *matCellDef="let disease">
                <div class="symptoms-cell">
                  <div class="symptoms-info">
                    <div class="symptoms">
                      <strong>Triệu chứng:</strong> {{disease.symptoms | slice:0:80}}{{disease.symptoms?.length > 80 ? '...' : ''}}
                    </div>
                    <div class="treatment" *ngIf="disease.treatment">
                      <strong>Điều trị:</strong> {{disease.treatment | slice:0:80}}{{disease.treatment?.length > 80 ? '...' : ''}}
                    </div>
                  </div>
                </div>
              </td>
            </ng-container>

            <!-- Plants Column -->
            <ng-container matColumnDef="plants">
              <th mat-header-cell *matHeaderCellDef>Cây trồng ảnh hưởng</th>
              <td mat-cell *matCellDef="let disease">
                <div class="plants-info">
                  <mat-icon class="plant-icon">yard</mat-icon>
                  <span>{{disease.plants?.length || 0}} loại cây</span>
                </div>
              </td>
            </ng-container>

            <!-- Severity Column -->
            <ng-container matColumnDef="severity">
              <th mat-header-cell *matHeaderCellDef>Mức độ nghiêm trọng</th>
              <td mat-cell *matCellDef="let disease">
                <span [class]="'severity-badge ' + disease.severity.toLowerCase()">
                  {{getSeverityLabel(disease.severity)}}
                </span>
              </td>
            </ng-container>

            <!-- Actions Column -->
            <ng-container matColumnDef="actions">
              <th mat-header-cell *matHeaderCellDef>Thao tác</th>
              <td mat-cell *matCellDef="let disease">
                <button mat-icon-button [matMenuTriggerFor]="menu" class="action-button">
                  <mat-icon>more_horiz</mat-icon>
                </button>
                <mat-menu #menu="matMenu">
                  <button mat-menu-item [routerLink]="['/expert/plant-manager/diseases', disease.id]">
                    <mat-icon>visibility</mat-icon>
                    <span>Chi tiết</span>
                  </button>
                  <button mat-menu-item [routerLink]="['/expert/plant-manager/diseases', disease.id, 'edit']">
                    <mat-icon>edit</mat-icon>
                    <span>Chỉnh sửa</span>
                  </button>
                  <button mat-menu-item [routerLink]="['/expert/plant-manager/diseases', disease.id, 'treatment']">
                    <mat-icon>healing</mat-icon>
                    <span>Hướng dẫn điều trị</span>
                  </button>
                  <button mat-menu-item (click)="deleteDisease(disease)">
                    <mat-icon>delete</mat-icon>
                    <span>Xóa</span>
                  </button>
                </mat-menu>
              </td>
            </ng-container>

            <tr mat-header-row *matHeaderRowDef="displayedColumns; sticky: true"></tr>
            <tr mat-row *matRowDef="let row; columns: displayedColumns;"></tr>
          </table>

          <!-- No data message -->
          <div class="no-data" *ngIf="!loading && (!diseases || diseases.length === 0)">
            <mat-icon class="empty-icon">bug_report</mat-icon>
            <h3>Chưa có thông tin về bệnh</h3>
            <p>Hiện chưa có thông tin về bệnh cây nào được thêm vào hệ thống.</p>
            <button mat-raised-button class="add-button" [routerLink]="['../create']">
              <mat-icon>add</mat-icon>
              Thêm bệnh mới
            </button>
          </div>

          <mat-paginator
            [length]="totalDiseases"
            [pageSize]="pageSize"
            [pageSizeOptions]="[10, 25, 50, 100]"
            (page)="onPageChange($event)"
            showFirstLastButtons>
          </mat-paginator>
        </mat-card-content>
      </mat-card>
    </div>
  `,
  styleUrls: ['./disease-list.component.scss']
})

export class DiseaseListComponent implements OnInit {
  diseases: PlantDisease[] = [];
  totalDiseases = 0;
  pageSize = 10;
  currentPage = 0;
  loading = false;

  displayedColumns: string[] = ['disease', 'symptoms', 'plants', 'severity', 'actions'];

  getCategoryIcon(category: string): string {
    switch (category.toLowerCase()) {
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

  constructor(
    private diseaseService: DiseaseService,
    private snackBar: MatSnackBar,
    private cdr: ChangeDetectorRef
  ) { }

  ngOnInit(): void {
    this.loadDiseases();
  }

  loadDiseases(event?: PageEvent): void {
    this.loading = true;
    if (event) {
      this.currentPage = event.pageIndex;
      this.pageSize = event.pageSize;
    }

    this.diseaseService.getAllPlantDiseases(this.currentPage, this.pageSize)
      .subscribe({
        next: (response) => {
          this.diseases = response.data.content;
          this.totalDiseases = response.data.totalElements;
          this.loading = false;
          this.cdr.detectChanges();
        },
        error: (error) => {
          this.snackBar.open('Lỗi khi tải danh sách bệnh cây', 'Đóng', { duration: 3000 });
          this.loading = false;
          this.cdr.detectChanges();
        }
      });
  }

  onPageChange(event: PageEvent): void {
    this.loadDiseases(event);
  }

  deleteDisease(disease: PlantDisease): void {
    if (confirm(`Bạn có chắc chắn muốn xóa bệnh "${disease.diseaseName}" không?`)) {
      this.loading = true;
      this.diseaseService.deletePlantDisease(disease.id)
        .subscribe({
          next: () => {
            this.snackBar.open('Xóa bệnh cây thành công', 'Đóng', { duration: 3000 });
            this.loadDiseases();
          },
          error: (error) => {
            this.snackBar.open('Lỗi khi xóa bệnh cây', 'Đóng', { duration: 3000 });
            this.loading = false;
            this.cdr.detectChanges();
          }
        });
    }
  }
}
