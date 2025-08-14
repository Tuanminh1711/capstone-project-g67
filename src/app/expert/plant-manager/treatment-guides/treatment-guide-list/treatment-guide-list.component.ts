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
        <h1>🌿 Danh sách hướng dẫn điều trị</h1>
        <p class="subtitle">Quản lý các hướng dẫn điều trị bệnh cây</p>
      </div>

      <div class="content-card">
        <div class="card-header">
          <h2>📋 Hướng dẫn điều trị theo bệnh cây</h2>
          <p class="description">
            Chọn bệnh cây để xem danh sách hướng dẫn điều trị
          </p>
        </div>
        
        <div class="card-content">
          <!-- Disease Selection -->
          <div class="disease-selection">
            <div class="selection-header">
              <h3>🔍 Chọn bệnh cây</h3>
              <button class="btn btn-create" routerLink="/expert/plant-manager/treatment-guides/create">
                <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
                  <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/>
                </svg>
                Tạo hướng dẫn mới
              </button>
            </div>
            
            <div class="disease-dropdown">
              <select 
                [(ngModel)]="selectedDiseaseId" 
                (ngModelChange)="onDiseaseChange()"
                class="disease-select"
                [disabled]="isLoadingDiseases">
                <option value="" [value]="null">
                  {{ isLoadingDiseases ? 'Đang tải danh sách bệnh...' : '-- Chọn bệnh cây để xem hướng dẫn --' }}
                </option>
                <option *ngFor="let disease of diseases; trackBy: trackByDiseaseId" [value]="disease.id">
                  🦠 {{ disease.diseaseName || disease.name || 'Bệnh không tên' }}
                </option>
              </select>
            </div>
          </div>

          <!-- Loading State -->
          <div *ngIf="isLoadingGuides" class="loading-section">
            <div class="loading-spinner"></div>
            <p>🔍 Đang tải hướng dẫn điều trị...</p>
          </div>

          <!-- Treatment Guides List -->
          <div *ngIf="!isLoadingGuides && selectedDiseaseId && treatmentGuides.length > 0" class="guides-section">
            <div class="section-header">
              <h3>📚 Hướng dẫn điều trị ({{ treatmentGuides.length }} hướng dẫn)</h3>
              <span class="disease-name">cho bệnh: {{ getSelectedDiseaseName() }}</span>
            </div>
            
            <div class="guides-grid">
              <div *ngFor="let guide of treatmentGuides; let i = index; trackBy: trackByGuideId" class="guide-card">
                <div class="guide-header">
                  <div class="step-badge">Bước {{ guide.stepNumber }}</div>
                  <div class="guide-actions">
                    <button class="btn-action btn-edit" (click)="editGuide(guide.id)" title="Chỉnh sửa">
                      ✏️
                    </button>
                    <button class="btn-action btn-view" (click)="viewGuide(guide.id)" title="Xem chi tiết">
                      👁️
                    </button>
                    <button class="btn-action btn-delete" (click)="deleteGuide(guide.id)" title="Xóa">
                      🗑️
                    </button>
                  </div>
                </div>
                
                <div class="guide-content">
                  <h4 class="guide-title">{{ guide.title }}</h4>
                  <p class="guide-description">{{ guide.description | slice:0:150 }}<span *ngIf="guide.description && guide.description.length > 150">...</span></p>
                  
                  <div class="guide-meta" *ngIf="guide.createdAt">
                    <span class="meta-item">
                      📅 {{ guide.createdAt | date:'dd/MM/yyyy' }}
                    </span>
                    <span class="meta-item" *ngIf="guide.updatedAt && guide.updatedAt !== guide.createdAt">
                      🔄 {{ guide.updatedAt | date:'dd/MM/yyyy' }}
                    </span>
                  </div>
                </div>
              </div>
            </div>
            
            <div class="guides-actions">
              <button class="btn btn-primary" [routerLink]="['/expert/plant-manager/treatment-guides/create', selectedDiseaseId]">
                ➕ Thêm bước tiếp theo
              </button>
            </div>
          </div>

          <!-- No Guides Message -->
          <div *ngIf="!isLoadingGuides && selectedDiseaseId && treatmentGuides.length === 0" class="no-guides-section">
            <div class="no-guides-message">
              <div class="no-guides-icon">📝</div>
              <h3>Chưa có hướng dẫn điều trị</h3>
              <p>Bệnh "{{ getSelectedDiseaseName() }}" chưa có hướng dẫn điều trị nào.</p>
              <button class="btn btn-primary" [routerLink]="['/expert/plant-manager/treatment-guides/create', selectedDiseaseId]">
                🚀 Tạo hướng dẫn đầu tiên
              </button>
            </div>
          </div>

          <!-- Initial State -->
          <div *ngIf="!selectedDiseaseId && !isLoadingDiseases" class="initial-state">
            <div class="info-box">
              <div class="info-icon">
                <svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z"/>
                </svg>
              </div>
              <div class="info-content">
                <h3>🚀 Cách sử dụng</h3>
                <ul class="instruction-list">
                  <li>
                    <span class="step-number">1</span>
                    <span>Chọn bệnh cây từ dropdown phía trên</span>
                  </li>
                  <li>
                    <span class="step-number">2</span>
                    <span>Xem danh sách hướng dẫn điều trị có sẵn</span>
                  </li>
                  <li>
                    <span class="step-number">3</span>
                    <span>Tạo mới hoặc chỉnh sửa hướng dẫn</span>
                  </li>
                  <li>
                    <span class="step-number">4</span>
                    <span>Quản lý các bước điều trị một cách có hệ thống</span>
                  </li>
                </ul>
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
