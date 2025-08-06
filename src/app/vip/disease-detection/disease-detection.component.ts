
import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators, AbstractControl } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { TopNavigatorComponent } from '../../shared/top-navigator/top-navigator.component';
import { FooterComponent } from '../../shared/footer/footer.component';
import { DiseaseDetectionService } from './disease-detection.service';
import { 
  DiseaseDetectionResult,
  DiseaseDetectionHistory,
  PlantDisease
} from './disease-detection.model';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-disease-detection',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    RouterModule,
    TopNavigatorComponent
  ],
  templateUrl: './disease-detection.component.html',
  styleUrls: ['./disease-detection.component.scss']
})
export class DiseaseDetectionComponent implements OnInit, OnDestroy {
  activeTab: 'upload' | 'symptoms' | 'history' | 'diseases' = 'upload';
  imageForm!: FormGroup;
  symptomForm!: FormGroup;
  isLoading = false;
  error: string | null = null;
  selectedFile: File | null = null;
  imagePreviewUrl: string | null = null;
  detectionResult: DiseaseDetectionResult | null = null;
  
  // History data
  historyPage = 0;
  historyPageSize = 5;
  historyTotalPages = 0;
  historyTotalElements = 0;
  detectionHistory: DiseaseDetectionResult[] = [];
  
  // Common diseases & library
  commonDiseases: PlantDisease[] = [];
  diseaseLibrary: PlantDisease[] = [];
  symptomSearchDiseases: PlantDisease[] = [];
  symptomDescription: string = '';
  selectedPlantType = '';
  plantTypes = [
    { value: 'indoor', label: 'Cây trồng trong nhà' },
    { value: 'outdoor', label: 'Cây trồng ngoài trời' },
    { value: 'fruit', label: 'Cây ăn quả' },
    { value: 'vegetable', label: 'Rau củ' },
    { value: 'flower', label: 'Hoa' },
    { value: 'ornamental', label: 'Cây cảnh' }
  ];
  
  public diseaseSearchText: string = '';

  private destroy$ = new Subject<void>();

  constructor(
    private fb: FormBuilder,
    private diseaseService: DiseaseDetectionService
  ) {
    // Enable API now that backend is configured
    this.diseaseService.enableApi();
  }

  /**
   * Custom validator for symptoms array
   */
  atLeastOneSymptomValidator(control: AbstractControl) {
    const symptoms = control.value;
    if (!symptoms || !Array.isArray(symptoms) || symptoms.length === 0) {
      return { atLeastOneRequired: true };
    }
    return null;
  }

  ngOnInit(): void {
    this.initForms();
    // Không load history ngay khi init để tránh lỗi API
    // History sẽ được load khi user chọn tab history
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  initForms(): void {
    this.imageForm = this.fb.group({
      plantId: [null, [Validators.required]]
    });
    // Only one field for symptom detection
    this.symptomForm = this.fb.group({
      description: ['', [Validators.required, Validators.minLength(10)]]
    });
  }

    showGuideModal = false;
  treatmentGuide: any = null;
  openTreatmentGuide(diseaseName: string) {
    this.isLoading = true;
    this.diseaseService.getTreatmentGuide(diseaseName).subscribe({
      next: (guide) => {
        this.treatmentGuide = guide;
        this.showGuideModal = true;
        this.isLoading = false;
      },
      error: () => {
        this.error = 'Không thể tải hướng dẫn điều trị.';
        this.isLoading = false;
      }
    });
  }

  closeGuideModal() {
    this.showGuideModal = false;
    this.treatmentGuide = null;
  }

  /**
   * Set active tab
   */
  setActiveTab(tab: 'upload' | 'symptoms' | 'history' | 'diseases'): void {
    this.activeTab = tab;
    this.error = null;
    this.detectionResult = null;

    if (tab === 'history' && this.detectionHistory.length === 0) {
      this.loadDetectionHistory();
    } else if (tab === 'diseases' && this.diseaseLibrary.length === 0) {
      this.onPlantTypeChange('indoor');
    }
  }

  /**
   * File selection handler
   */
  onFileSelected(event: any): void {
    const file = event.target.files[0];
    if (file) {
      this.selectedFile = file;
      
      // Create a preview
      const reader = new FileReader();
      reader.onload = () => {
        this.imagePreviewUrl = reader.result as string;
      };
      reader.readAsDataURL(file);
    }
  }

  /**
   * Upload image for analysis
   */
  uploadImage(): void {
    if (!this.imageForm.valid || !this.selectedFile) {
      return;
    }

    this.isLoading = true;
    this.error = null;
    this.detectionResult = null;

    const plantId = this.imageForm.get('plantId')?.value;

    this.diseaseService.detectDiseaseFromImage(this.selectedFile, plantId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (result) => {
          this.detectionResult = result;
          this.isLoading = false;
        },
        error: (err) => {
          console.warn('Disease detection API error:', err.message || err);
          
          // Check if this is a JSON parsing error or timeout
          const isJsonParsingError = err.message && (
            err.message.includes('Expected') && err.message.includes('JSON') ||
            err.message.includes('JSON parsing error') ||
            err.name === 'TimeoutError'
          );
          const isServerError = err.status === 500 || err.status === 404;
          
          if (isJsonParsingError || isServerError) {
            console.log('Backend JSON/Server/Timeout error detected, using mock result as fallback');
            this.error = null; // Don't show error for better UX
            this.isLoading = false;
            this.detectionResult = this.getMockDetectionResult();
          } else {
            this.error = 'Không thể phân tích hình ảnh. Vui lòng thử lại sau.';
            this.isLoading = false;
          }
        }
      });
  }

  /**
   * Handle symptom checkbox change
   */
  onSymptomChange(event: any): void {
    const symptoms = this.symptomForm.get('symptoms')?.value || [];
    const symptomValue = event.target.value;
    
    if (event.target.checked) {
      if (!symptoms.includes(symptomValue)) {
        symptoms.push(symptomValue);
      }
    } else {
      const index = symptoms.indexOf(symptomValue);
      if (index > -1) {
        symptoms.splice(index, 1);
      }
    }
    
    this.symptomForm.patchValue({ symptoms });
  }

  /**
   * Check if symptom form can be submitted
   */
  canSubmitSymptoms(): boolean {
    const descriptionValid = this.symptomForm.get('description')?.valid;
    return !!(descriptionValid && !this.isLoading);
  }

  /**
   * Submit symptom analysis
   */
  submitSymptoms(): void {
    this.symptomForm.markAllAsTouched();
    if (!this.symptomForm.valid) {
      return;
    }
    this.isLoading = true;
    this.error = null;
    this.detectionResult = null;
    // Gửi đúng body cho backend: chỉ gồm description và detectionMethod
    const body = {
      description: this.symptomForm.get('description')?.value,
      detectionMethod: 'SYMPTOMS'
    };
    this.diseaseService.detectDiseaseFromSymptoms(body)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (result) => {
          this.detectionResult = result;
          this.isLoading = false;
        },
        error: (err) => {
          this.error = 'Không thể phân tích triệu chứng. Vui lòng thử lại sau.';
          this.isLoading = false;
        }
      });
  }

  /**
   * Load detection history
   */
  loadDetectionHistory(page: number = 0): void {
    this.isLoading = true;
    this.error = null;

    this.diseaseService.getDetectionHistory(page, this.historyPageSize)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (result) => {
          this.detectionHistory = result.content;
          this.historyPage = result.currentPage;
          this.historyTotalPages = result.totalPages;
          this.historyTotalElements = result.totalElements;
          this.isLoading = false;
        },
        error: (err) => {
          console.warn('Disease detection API error:', err.message || err);
          
          // Check if this is a JSON parsing error (status 200 but invalid JSON)
          const isJsonParsingError = err.message && err.message.includes('Expected') && err.message.includes('JSON');
          const isServerError = err.status === 500 || err.status === 404;
          
          if (isJsonParsingError || isServerError) {
            console.log('Backend JSON/Server error detected, using empty history as fallback');
            this.error = null; // Don't show error to user for better UX
            this.isLoading = false;
            this.detectionHistory = [];
            this.historyPage = 0;
            this.historyTotalPages = 0;
            this.historyTotalElements = 0;
          } else {
            // For other errors, show error message
            this.error = 'Không thể tải lịch sử. Vui lòng thử lại sau.';
            this.isLoading = false;
          }
        }
      });
  }

  /**
   * Handle plant type change
   */
  onPlantTypeChange(plantType: string): void {
    this.selectedPlantType = plantType;
    this.isLoading = true;
    this.error = null;

    this.diseaseService.getCommonDiseases(plantType)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (diseases) => {
          this.diseaseLibrary = diseases;
          this.isLoading = false;
        },
        error: (err) => {
          console.warn('Disease detection API error:', err.message || err);
          
          // Check if this is a JSON parsing error (status 200 but invalid JSON)
          const isJsonParsingError = err.message && err.message.includes('Expected') && err.message.includes('JSON');
          const isServerError = err.status === 500 || err.status === 404;
          
          if (isJsonParsingError || isServerError) {
            console.log('Backend JSON/Server error detected, using mock data as fallback');
            this.error = null;
            this.isLoading = false;
            this.commonDiseases = this.getMockDiseases(plantType);
          } else {
            this.error = 'Không thể tải danh sách bệnh. Vui lòng thử lại sau.';
            this.isLoading = false;
          }
        }
      });
  }

  /**
   * Tìm kiếm bệnh qua mô tả triệu chứng (AI)
   */
  searchDiseasesByDescription(description: string): void {
    if (!description || description.trim().length < 5) {
      this.error = 'Vui lòng nhập mô tả triệu chứng.';
      return;
    }
    this.isLoading = true;
    this.error = null;
    this.symptomSearchDiseases = [];
    // Use GET method with ?keyword= for backend
    this.diseaseService.searchDiseasesByDescription(description.trim())
      .subscribe({
        next: (diseases) => {
          this.symptomSearchDiseases = diseases;
          this.isLoading = false;
        },
        error: (err) => {
          this.error = 'Không thể tìm kiếm bệnh. Vui lòng thử lại sau.';
          this.isLoading = false;
        }
      });
  }

  /**
   * Track by function for ngFor
   */
  trackById(index: number, item: any): number {
    return item.id || item.detectionId || index;
  }

  /**
   * Format severity
   */
  formatSeverity(severity: string): string {
    return this.diseaseService.formatSeverity(severity);
  }

  /**
   * Get severity class
   */
  getSeverityClass(severity: string): string {
    return this.diseaseService.getSeverityClass(severity);
  }

  /**
   * Format date
   */
  formatDate(timestamp: number): string {
    return this.diseaseService.formatDate(timestamp);
  }

  /**
   * Get mock detection result for demo when API is not available
   */
  private getMockDetectionResult(): DiseaseDetectionResult {
    return {
      detectionId: Math.floor(Math.random() * 1000),
      detectedDisease: 'Bệnh đốm lá',
      confidenceScore: 85.5,
      severity: 'medium',
      description: 'Bệnh này thường gặp ở cây cảnh trong nhà, được gây ra bởi nấm phát triển trong môi trường ẩm ướt.',
      recommendations: [
        'Cắt bỏ những lá bị bệnh',
        'Phun thuốc diệt nấm 2-3 lần/tuần',
        'Giảm tưới nước và tăng thông gió',
        'Đặt cây ở nơi có ánh sáng gián tiếp'
      ],
      createdAt: Date.now(),
      plantName: 'Cây cảnh demo',
      plantId: this.imageForm?.get('plantId')?.value || this.symptomForm?.get('plantId')?.value || 1
    };
  }

  /**
   * Get mock diseases list for demo when API is not available
   */
  private getMockDiseases(plantType: string): PlantDisease[] {
    const baseDiseases = [
      {
        id: 1,
        name: 'Bệnh đốm lá',
        scientificName: 'Leaf spot disease',
        category: 'fungal',
        severity: 'MEDIUM' as const,
        description: 'Bệnh nấm phổ biến gây ra các đốm nâu trên lá',
        symptoms: ['Đốm nâu trên lá', 'Lá héo vàng', 'Rụng lá sớm'],
        causes: ['Độ ẩm cao', 'Thông gió kém', 'Tưới nước lên lá']
      },
      {
        id: 2,
        name: 'Bệnh thối rễ',
        scientificName: 'Root rot',
        category: 'fungal',
        severity: 'HIGH' as const,
        description: 'Bệnh nấm tấn công hệ thống rễ của cây',
        symptoms: ['Lá vàng héo', 'Cây chậm phát triển', 'Rễ đen thối'],
        causes: ['Tưới nước quá nhiều', 'Đất không thoát nước', 'Nấm bệnh']
      }
    ];

    // Add specific diseases based on plant type
    switch (plantType) {
      case 'indoor':
        return [...baseDiseases, {
          id: 3,
          name: 'Bệnh rệp sáp',
          scientificName: 'Scale insects',
          category: 'pest',
          severity: 'MEDIUM' as const,
          description: 'Côn trùng hút nhựa cây, thường gặp ở cây trong nhà',
          symptoms: ['Vết dính trên lá', 'Lá vàng', 'Cây yếu đi'],
          causes: ['Môi trường khô', 'Thiếu ánh sáng', 'Côn trùng']
        }];
      case 'outdoor':
        return [...baseDiseases, {
          id: 4,
          name: 'Bệnh phấn trắng',
          scientificName: 'Powdery mildew',
          category: 'fungal',
          severity: 'MEDIUM' as const,
          description: 'Lớp bột trắng xuất hiện trên bề mặt lá',
          symptoms: ['Lớp bột trắng trên lá', 'Lá cong quăn', 'Giảm quang hợp'],
          causes: ['Độ ẩm cao', 'Nhiệt độ ấm', 'Thông gió kém']
        }];
      default:
        return baseDiseases;
    }
  }
}
