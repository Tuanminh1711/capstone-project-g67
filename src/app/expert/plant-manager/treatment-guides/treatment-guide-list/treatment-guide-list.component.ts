import { Component, OnInit, OnDestroy, ChangeDetectorRef, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, ActivatedRoute } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { Subject, takeUntil } from 'rxjs';
import { TreatmentGuideService } from '../treatment-guide.service';
import { DiseaseService } from '../../diseases/shared/disease.service';
import { ToastService } from '../../../../shared/toast/toast.service';

@Component({
  selector: 'app-treatment-guide-list',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    FormsModule
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="page-container">
      <div class="page-header">
        <h1>Danh sách hướng dẫn điều trị</h1>
        <p class="subtitle">Quản lý các phương pháp điều trị bệnh cây hiệu quả</p>
      </div>

      <div class="content-wrapper">
        <!-- Disease Selection Card -->
        <div class="selection-card">
          <div class="card-header">
            <h2>Chọn bệnh cây để xem hướng dẫn</h2>
            <button class="btn-create" routerLink="/expert/plant-manager/treatment-guides/create">
              Tạo hướng dẫn mới
            </button>
          </div>
          
          <div class="disease-selector">
            <select 
              [(ngModel)]="selectedDiseaseId" 
              (ngModelChange)="onDiseaseChange()"
              class="disease-select"
              [disabled]="isLoadingDiseases">
              <option value="" [value]="null">
                {{ isLoadingDiseases ? 'Đang tải danh sách bệnh...' : '-- Chọn bệnh cây để xem hướng dẫn --' }}
              </option>
              <option *ngFor="let disease of diseases; trackBy: trackByDiseaseId" [value]="disease.id">
                {{ disease.diseaseName || disease.name || 'Bệnh không tên' }}
              </option>
            </select>
          </div>
        </div>

        <!-- Loading State -->
        <div *ngIf="isLoadingGuides" class="loading-card">
          <div class="loading-content">
            <div class="loading-spinner"></div>
            <p>Đang tải hướng dẫn điều trị...</p>
          </div>
        </div>

        <!-- Treatment Guides Grid -->
        <div *ngIf="!isLoadingGuides && selectedDiseaseId && treatmentGuides.length > 0" class="guides-container">
          <div class="guides-header">
            <div class="header-info">
              <h3>Hướng dẫn điều trị</h3>
              <span class="guide-count">{{ treatmentGuides.length }} hướng dẫn</span>
            </div>
            <div class="disease-info">
              <span>Bệnh: {{ getSelectedDiseaseName() }}</span>
            </div>
          </div>
          
          <div class="guides-grid">
            <div *ngFor="let guide of treatmentGuides; let i = index; trackBy: trackByGuideId" class="guide-card">
              <div class="step-indicator">
                <span class="step-number">{{ guide.stepNumber }}</span>
              </div>
              
              <div class="guide-content">
                <h4 class="guide-title">{{ guide.title }}</h4>
                <p class="guide-description">{{ guide.description | slice:0:120 }}<span *ngIf="guide.description && guide.description.length > 120">...</span></p>
                
                <div class="guide-meta" *ngIf="guide.createdAt">
                  <span class="created-date">{{ guide.createdAt | date:'dd/MM/yyyy' }}</span>
                  <span class="updated-date" *ngIf="guide.updatedAt && guide.updatedAt !== guide.createdAt">
                    Cập nhật: {{ guide.updatedAt | date:'dd/MM/yyyy' }}
                  </span>
                </div>
              </div>
              
              <div class="guide-actions">
                <button class="action-btn view-btn" (click)="viewGuide(guide.id)" title="Xem chi tiết">
                  Xem
                </button>
                <button class="action-btn edit-btn" (click)="editGuide(guide.id)" title="Chỉnh sửa">
                  Sửa
                </button>
                <button class="action-btn delete-btn" (click)="deleteGuide(guide.id)" title="Xóa">
                  Xóa
                </button>
              </div>
            </div>
          </div>
          
          <div class="add-more-section">
            <button class="btn-add-step" [routerLink]="['/expert/plant-manager/treatment-guides/create', selectedDiseaseId]">
              Thêm bước điều trị tiếp theo
            </button>
          </div>
        </div>

        <!-- No Guides State -->
        <div *ngIf="!isLoadingGuides && selectedDiseaseId && treatmentGuides.length === 0" class="empty-state">
          <div class="empty-content">
            <div class="empty-icon"></div>
            <h3>Chưa có hướng dẫn điều trị</h3>
            <p>Bệnh "{{ getSelectedDiseaseName() }}" chưa có hướng dẫn điều trị nào.</p>
            <button class="btn-create-first" [routerLink]="['/expert/plant-manager/treatment-guides/create', selectedDiseaseId]">
              Tạo hướng dẫn đầu tiên
            </button>
          </div>
        </div>

        <!-- Initial Instructions -->
        <div *ngIf="!selectedDiseaseId && !isLoadingDiseases" class="instructions-card">
          <div class="instructions-content">
            <h3>Hướng dẫn sử dụng</h3>
            <div class="instruction-steps">
              <div class="step">
                <span class="step-num">1</span>
                <span>Chọn bệnh cây từ danh sách phía trên</span>
              </div>
              <div class="step">
                <span class="step-num">2</span>
                <span>Xem các hướng dẫn điều trị có sẵn</span>
              </div>
              <div class="step">
                <span class="step-num">3</span>
                <span>Tạo mới hoặc chỉnh sửa hướng dẫn</span>
              </div>
              <div class="step">
                <span class="step-num">4</span>
                <span>Quản lý các bước điều trị một cách có hệ thống</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styleUrls: ['./treatment-guide-list.component.scss']
})
export class TreatmentGuideListComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  
  diseases: any[] = [];
  treatmentGuides: any[] = [];
  selectedDiseaseId: number | null = null;
  isLoadingDiseases = false;
  isLoadingGuides = false;

  constructor(
    private treatmentGuideService: TreatmentGuideService,
    private diseaseService: DiseaseService,
    private route: ActivatedRoute,
    private toastService: ToastService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit() {
    this.loadDiseases();
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadDiseases() {
    this.isLoadingDiseases = true;
    this.diseaseService.getAllPlantDiseases(0, 100)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          let diseaseArray: any[] = [];
          
          if (response && response.data && response.data.content && Array.isArray(response.data.content)) {
            diseaseArray = response.data.content;
          } else if (response && response.content && Array.isArray(response.content)) {
            diseaseArray = response.content;
          } else if (response && response.data && Array.isArray(response.data)) {
            diseaseArray = response.data;
          } else if (Array.isArray(response)) {
            diseaseArray = response;
          }
          
          this.diseases = diseaseArray;
          this.isLoadingDiseases = false;
          
          // Trigger change detection
          this.cdr.detectChanges();
          
          console.log('🌿 Loaded diseases for treatment guides:', this.diseases.length);
        },
        error: (error) => {
          console.error('Error loading diseases:', error);
          this.toastService.error('❌ Lỗi khi tải danh sách bệnh cây');
          this.diseases = [];
          this.isLoadingDiseases = false;
          this.cdr.detectChanges();
        }
      });
  }

  onDiseaseChange() {
    console.log('🔄 Disease selection changed:', this.selectedDiseaseId);
    
    // Clear previous guides immediately
    this.treatmentGuides = [];
    this.cdr.detectChanges();
    
    if (this.selectedDiseaseId) {
      this.loadTreatmentGuides();
    }
  }

  loadTreatmentGuides() {
    if (!this.selectedDiseaseId) return;

    this.isLoadingGuides = true;
    this.cdr.detectChanges();
    
    console.log('🔍 Loading treatment guides for disease:', this.selectedDiseaseId);

    this.treatmentGuideService.getTreatmentGuidesByDisease(this.selectedDiseaseId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          console.log('📋 Treatment guides response:', response);
          
          if (response && response.data && Array.isArray(response.data)) {
            this.treatmentGuides = response.data;
          } else if (response && Array.isArray(response)) {
            this.treatmentGuides = response;
          } else {
            this.treatmentGuides = [];
          }

          // Sort by step number
          this.treatmentGuides.sort((a, b) => (a.stepNumber || 0) - (b.stepNumber || 0));
          
          this.isLoadingGuides = false;
          this.cdr.detectChanges();
          
          console.log('📝 Loaded treatment guides:', this.treatmentGuides.length);

          if (this.treatmentGuides.length > 0) {
            this.toastService.success(`✅ Tìm thấy ${this.treatmentGuides.length} hướng dẫn điều trị`);
          }
        },
        error: (error) => {
          console.error('❌ Error loading treatment guides:', error);
          this.treatmentGuides = [];
          this.isLoadingGuides = false;
          this.cdr.detectChanges();
          this.toastService.error('❌ Lỗi khi tải hướng dẫn điều trị');
        }
      });
  }

  getSelectedDiseaseName(): string {
    if (!this.selectedDiseaseId) return '';
    const disease = this.diseases.find(d => d.id === Number(this.selectedDiseaseId));
    return disease ? (disease.diseaseName || disease.name || 'Bệnh không tên') : '';
  }

  viewGuide(guideId: number) {
    // Navigate to view page
    console.log('👁️ Viewing guide:', guideId);
    // TODO: Implement navigation to view page
  }

  editGuide(guideId: number) {
    // Navigate to edit page
    console.log('✏️ Editing guide:', guideId);
    // TODO: Implement navigation to edit page
  }

  deleteGuide(guideId: number) {
    if (confirm('🗑️ Bạn có chắc chắn muốn xóa hướng dẫn này?')) {
      this.treatmentGuideService.deleteTreatmentGuide(guideId)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: () => {
            this.toastService.success('✅ Xóa hướng dẫn thành công');
            this.loadTreatmentGuides(); // Reload list
          },
          error: (error) => {
            console.error('❌ Error deleting guide:', error);
            this.toastService.error('❌ Lỗi khi xóa hướng dẫn');
          }
        });
    }
  }

  trackByDiseaseId(index: number, disease: any): number {
    return disease ? disease.id : index;
  }

  trackByGuideId(index: number, guide: any): number {
    return guide ? guide.id : index;
  }
}
