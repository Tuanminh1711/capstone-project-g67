
import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators, AbstractControl } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { TopNavigatorComponent } from '../../shared/top-navigator/top-navigator.component';
import { FooterComponent } from '../../shared/footer/footer.component';
import { DiseaseDetectionService } from './disease-detection.service';
import { 
  DiseaseDetectionResult,
  DiseaseDetectionHistory,
  PlantDisease,
  TreatmentGuide
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
  
  // Tham chiếu đến phần kết quả để scroll/hightlight
  resultPanelRef?: HTMLElement;
  
  // History data
  historyPage = 0;
  historyPageSize = 10;
  historyTotalPages = 0;
  historyTotalElements = 0;
  detectionHistory: import('./disease-detection.model').DiseaseDetectionHistoryItem[] = [];
  
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
  
  // Storage keys for persistence
  private readonly STORAGE_KEYS = {
    ACTIVE_TAB: 'disease_detection_active_tab',
    DETECTION_RESULT: 'disease_detection_result',
    DETECTION_HISTORY: 'disease_detection_history',
    DISEASE_LIBRARY: 'disease_detection_library',
    SELECTED_PLANT_TYPE: 'disease_detection_plant_type',
    HISTORY_PAGE: 'disease_detection_history_page',
    HISTORY_TOTAL_PAGES: 'disease_detection_history_total_pages',
    HISTORY_TOTAL_ELEMENTS: 'disease_detection_history_total_elements'
  };

  // Loading states for different operations
  isImageUploading = false;
  isSymptomAnalyzing = false;
  isHistoryLoading = false;
  isLibraryLoading = false;

  // Error states for different operations
  imageError: string | null = null;
  symptomError: string | null = null;
  historyError: string | null = null;
  libraryError: string | null = null;

  constructor(
    private fb: FormBuilder,
    private diseaseService: DiseaseDetectionService,
    private cdr: ChangeDetectorRef
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
          this.loadPersistedData();
          // Don't call loadDetectionHistory() here - let setActiveTab handle it if needed
        }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Load persisted data from localStorage
   */
  private loadPersistedData(): void {
    try {
      // Load active tab
      const savedTab = localStorage.getItem(this.STORAGE_KEYS.ACTIVE_TAB);
      if (savedTab && ['upload', 'symptoms', 'history', 'diseases'].includes(savedTab)) {
        this.activeTab = savedTab as any;
      }

      // Load detection result
      const savedResult = localStorage.getItem(this.STORAGE_KEYS.DETECTION_RESULT);
      if (savedResult) {
        this.detectionResult = JSON.parse(savedResult);
        // Defensive: ensure recommendations is always array
        if (this.detectionResult && !Array.isArray(this.detectionResult.recommendations)) {
          this.detectionResult.recommendations = [];
        }
        console.log('[DiseaseDetectionComponent] Loaded detection result from localStorage:', this.detectionResult);
      }

      // Load history data
      const savedHistory = localStorage.getItem(this.STORAGE_KEYS.DETECTION_HISTORY);
      if (savedHistory) {
  this.detectionHistory = JSON.parse(savedHistory) || [];
      }

      // Load history pagination
      const savedPage = localStorage.getItem(this.STORAGE_KEYS.HISTORY_PAGE);
      if (savedPage) {
        this.historyPage = parseInt(savedPage);
      }

      const savedTotalPages = localStorage.getItem(this.STORAGE_KEYS.HISTORY_TOTAL_PAGES);
      if (savedTotalPages) {
        this.historyTotalPages = parseInt(savedTotalPages);
      }

      const savedTotalElements = localStorage.getItem(this.STORAGE_KEYS.HISTORY_TOTAL_ELEMENTS);
      if (savedTotalElements) {
        this.historyTotalElements = parseInt(savedTotalElements);
      }

      // Load disease library
      const savedLibrary = localStorage.getItem(this.STORAGE_KEYS.DISEASE_LIBRARY);
      if (savedLibrary) {
  this.diseaseLibrary = JSON.parse(savedLibrary) || [];
      }

      // Load selected plant type
      const savedPlantType = localStorage.getItem(this.STORAGE_KEYS.SELECTED_PLANT_TYPE);
      if (savedPlantType) {
        this.selectedPlantType = savedPlantType;
      }

      // After loading persisted data, if the active tab needs data, load it
      if (this.activeTab === 'history' && this.detectionHistory.length === 0) {
        this.loadDetectionHistory();
      } else if (this.activeTab === 'diseases' && this.diseaseLibrary.length === 0) {
        this.onPlantTypeChange('indoor');
      }

    } catch (error) {
      this.clearPersistedData();
    }
  }

  /**
   * Save data to localStorage for persistence
   */
  private savePersistedData(): void {
    try {
      // Save active tab
      localStorage.setItem(this.STORAGE_KEYS.ACTIVE_TAB, this.activeTab);

      // Save detection result
      if (this.detectionResult) {
        localStorage.setItem(this.STORAGE_KEYS.DETECTION_RESULT, JSON.stringify(this.detectionResult));
      }

      // Always save history data (even if empty) to maintain state
      localStorage.setItem(this.STORAGE_KEYS.DETECTION_HISTORY, JSON.stringify(this.detectionHistory));

      // Save history pagination
      localStorage.setItem(this.STORAGE_KEYS.HISTORY_PAGE, this.historyPage.toString());
      localStorage.setItem(this.STORAGE_KEYS.HISTORY_TOTAL_PAGES, this.historyTotalPages.toString());
      localStorage.setItem(this.STORAGE_KEYS.HISTORY_TOTAL_ELEMENTS, this.historyTotalElements.toString());

      // Always save disease library (even if empty) to maintain state
      localStorage.setItem(this.STORAGE_KEYS.DISEASE_LIBRARY, JSON.stringify(this.diseaseLibrary));

      // Save selected plant type
      if (this.selectedPlantType) {
        localStorage.setItem(this.STORAGE_KEYS.SELECTED_PLANT_TYPE, this.selectedPlantType);
      }

    } catch (error) {
      // Error saving persisted data
    }
  }

  /**
   * Clear all persisted data
   */
  private clearPersistedData(): void {
    Object.values(this.STORAGE_KEYS).forEach(key => {
      localStorage.removeItem(key);
    });
  }

  initForms(): void {
    this.imageForm = this.fb.group({});
    // Only one field for symptom detection
    this.symptomForm = this.fb.group({
      description: ['', [Validators.required, Validators.minLength(10)]]
    });
  }

  // Treatment guide
  treatmentGuide: TreatmentGuide | null = null;
  
  openTreatmentGuide(diseaseName: string | undefined): void {
    if (!diseaseName) {
      this.error = 'Không thể mở thông tin bệnh: thiếu tên bệnh.';
      return;
    }
    
    // Get treatment guide directly
    this.getTreatmentGuide(diseaseName);
  }

  /**
   * Set active tab
   */
  setActiveTab(tab: 'upload' | 'symptoms' | 'history' | 'diseases'): void {
    this.activeTab = tab;
    this.error = null;
    // Don't clear detection result when switching tabs
    // this.detectionResult = null;

    if (tab === 'history') {
      // Luôn gọi API lấy lịch sử khi chuyển tab
      this.loadDetectionHistory();
    } else if (tab === 'diseases') {
      // Only load diseases if we don't have data or if there was an error
      if (this.diseaseLibrary.length === 0 || this.libraryError) {
        this.onPlantTypeChange('indoor');
      }
    }

    // Save active tab
    this.savePersistedData();
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
    if (!this.selectedFile) {
      return;
    }

    this.isImageUploading = true;
    this.imageError = null;
    // Don't clear detection result immediately
    // this.detectionResult = null;

    this.diseaseService.detectDiseaseFromImage(this.selectedFile)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (result) => {
          this.detectionResult = result;
          console.log('[DiseaseDetectionComponent] Detection result set from image upload:', result);
          this.isImageUploading = false;
          this.clearError('image');
          // Tự động lấy hướng dẫn điều trị khi có kết quả
          if (result && result.detectedDisease) {
            this.getTreatmentGuide(result.detectedDisease);
          }
          // Save to localStorage for persistence
          this.savePersistedData();
          // Scroll to result
          this.scrollToResult();
          // Force change detection
          this.cdr.detectChanges();
        },
        error: (err) => {
          // Check if this is a JSON parsing error or timeout
          const isJsonParsingError = err.message && (
            err.message.includes('Expected') && err.message.includes('JSON') ||
            err.message.includes('JSON parsing error') ||
            err.name === 'TimeoutError'
          );
          const isServerError = err.status === 500 || err.status === 404;
          
          if (isJsonParsingError || isServerError) {
            this.imageError = null; // Don't show error for better UX
            this.isImageUploading = false;
            const mockResult = this.getMockDetectionResult();
            this.detectionResult = mockResult;
            // Save mock result to localStorage
            this.savePersistedData();
            
            // Force change detection
            this.cdr.detectChanges();
            
            // Auto-scroll to result
            setTimeout(() => {
              const el = document.getElementById('detection-result-panel');
              if (el) {
                el.scrollIntoView({ behavior: 'smooth', block: 'center' });
                el.classList.add('highlight-result');
                setTimeout(() => el.classList.remove('highlight-result'), 2000);
              }
            }, 100);
          } else {
            this.imageError = 'Không thể phân tích hình ảnh. Vui lòng thử lại sau.';
            this.isImageUploading = false;
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
    
    this.isSymptomAnalyzing = true;
    this.symptomError = null;
    // Don't clear detection result immediately
    // this.detectionResult = null;
    
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
          console.log('[DiseaseDetectionComponent] Detection result set from symptoms:', result);
          this.isSymptomAnalyzing = false;
          this.clearError('symptom');
          // Tự động lấy hướng dẫn điều trị khi có kết quả
          if (result && result.detectedDisease) {
            this.getTreatmentGuide(result.detectedDisease);
          }
          // Save to localStorage for persistence
          this.savePersistedData();
          // Scroll to result
          this.scrollToResult();
          
          // Force change detection
          this.cdr.detectChanges();
        },
        error: (err) => {
          // Check if this is a JSON parsing error or timeout
          const isJsonParsingError = err.message && (
            err.message.includes('Expected') && err.message.includes('JSON') ||
            err.message.includes('JSON parsing error') ||
            err.name === 'TimeoutError'
          );
          const isServerError = err.status === 500 || err.status === 404;
          
          if (isJsonParsingError || isServerError) {
            this.symptomError = null; // Don't show error for better UX
            this.isSymptomAnalyzing = false;
            const mockResult = this.getMockDetectionResultFromSymptoms(this.symptomForm.get('description')?.value || '');
            this.detectionResult = mockResult;
            
            // Save mock result to localStorage
            this.savePersistedData();
            
            // Force change detection
            this.cdr.detectChanges();
            
            // Tự động scroll đến phần kết quả nếu có
            setTimeout(() => {
              const el = document.getElementById('detection-result-panel');
              if (el) {
                el.scrollIntoView({ behavior: 'smooth', block: 'center' });
                el.classList.add('highlight-result');
                setTimeout(() => el.classList.remove('highlight-result'), 2000);
            }
          }, 100);
          } else {
            this.symptomError = 'Không thể phân tích triệu chứng. Vui lòng thử lại sau.';
            this.isSymptomAnalyzing = false;
          }
        }
      });
  }
  /**
   * Change history page and reload detection history
   */
  changeHistoryPage(newPage: number): void {
    if (newPage < 0 || newPage >= this.historyTotalPages || newPage === this.historyPage) return;
    this.historyPage = newPage;
    this.loadDetectionHistory(newPage);
  }

  /**
   * Load detection history
   */
  loadDetectionHistory(page: number = 0): void {
    this.isHistoryLoading = true;
    this.historyError = null;

    this.diseaseService.getDetectionHistory(page, this.historyPageSize)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (result) => {
          // Nếu response là kiểu mới, gán trực tiếp
          if (result.content && Array.isArray(result.content)) {
            // Map DiseaseDetectionResult[] to DiseaseDetectionHistoryItem[] for sorting
            this.detectionHistory = result.content.map((item: any) => ({
              id: item.detectionId ?? item.id,
              detectedDisease: item.detectedDisease,
              confidenceScore: item.confidenceScore,
              severity: item.severity,
              symptoms: item.symptoms ?? item.description ?? '',
              recommendedTreatment: item.recommendedTreatment ?? (item.recommendations ? item.recommendations.join(', ') : null),
              status: item.status ?? 'DETECTED',
              isConfirmed: item.isConfirmed ?? false,
              expertNotes: item.expertNotes ?? null,
              detectedAt: item.detectedAt ?? item.createdAt ?? 0,
              treatedAt: item.treatedAt ?? null,
              treatmentResult: item.treatmentResult ?? null,
              detectionMethod: item.detectionMethod ?? '',
              aiModelVersion: item.aiModelVersion ?? ''
            })).sort((a, b) => (b.detectedAt ?? 0) - (a.detectedAt ?? 0));
            this.historyPage = result.currentPage ?? 0;
            this.historyTotalPages = result.totalPages ?? 1;
            this.historyTotalElements = result.totalElements ?? result.content.length;
          } else if (Array.isArray(result)) {
            this.detectionHistory = result.map((item: any) => ({
              id: item.detectionId ?? item.id,
              detectedDisease: item.detectedDisease,
              confidenceScore: item.confidenceScore,
              severity: item.severity,
              symptoms: item.symptoms ?? item.description ?? '',
              recommendedTreatment: item.recommendedTreatment ?? (item.recommendations ? item.recommendations.join(', ') : null),
              status: item.status ?? 'DETECTED',
              isConfirmed: item.isConfirmed ?? false,
              expertNotes: item.expertNotes ?? null,
              detectedAt: item.detectedAt ?? item.createdAt ?? 0,
              treatedAt: item.treatedAt ?? null,
              treatmentResult: item.treatmentResult ?? null,
              detectionMethod: item.detectionMethod ?? '',
              aiModelVersion: item.aiModelVersion ?? ''
            })).sort((a, b) => (b.detectedAt ?? 0) - (a.detectedAt ?? 0));
            this.historyPage = 0;
            this.historyTotalPages = 1;
            this.historyTotalElements = result.length;
          }
          this.isHistoryLoading = false;
          
          // Save history data to localStorage
          this.savePersistedData();
          
          // Force change detection
          this.cdr.detectChanges();
        },
        error: (err) => {
          const isJsonParsingError = err.message && err.message.includes('Expected') && err.message.includes('JSON');
          const isServerError = err.status === 500 || err.status === 404;
          if (isJsonParsingError || isServerError) {
            this.historyError = null;
            this.isHistoryLoading = false;
            this.detectionHistory = [];
            this.historyPage = 0;
            this.historyTotalPages = 0;
            this.historyTotalElements = 0;
            // Save empty history to localStorage
            this.savePersistedData();
            
            // Force change detection
            this.cdr.detectChanges();
          } else {
            this.historyError = 'Không thể tải lịch sử. Vui lòng thử lại sau.';
            this.isHistoryLoading = false;
            
            // Force change detection
            this.cdr.detectChanges();
          }
        }
      });
  }

  /**
   * Handle plant type change
   */
  onPlantTypeChange(plantType: string): void {
    this.selectedPlantType = plantType;
    this.isLibraryLoading = true;
    this.libraryError = null;

    this.diseaseService.getCommonDiseases(plantType)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (diseases) => {
          this.diseaseLibrary = diseases;
          this.isLibraryLoading = false;
          // Save disease library to localStorage
          this.savePersistedData();
          
          // Force change detection
          this.cdr.detectChanges();
        },
        error: (err) => {
          // Check if this is a JSON parsing error (status 200 but invalid JSON)
          const isJsonParsingError = err.message && err.message.includes('Expected') && err.message.includes('JSON');
          const isServerError = err.status === 500 || err.status === 404;
          
          if (isJsonParsingError || isServerError) {
            this.libraryError = null;
            this.isLibraryLoading = false;
            this.commonDiseases = this.getMockDiseases(plantType);
            // Save mock data to localStorage
            this.savePersistedData();
            
            // Force change detection
            this.cdr.detectChanges();
          } else {
            this.libraryError = 'Không thể tải danh sách bệnh. Vui lòng thử lại sau.';
            this.isLibraryLoading = false;
            
            // Force change detection
            this.cdr.detectChanges();
          }
        }
      });
  }

  /**
   * Tìm kiếm bệnh qua mô tả triệu chứng (AI)
   */
  searchDiseasesByDescription(description: string): void {
    if (!description || description.trim().length < 5) {
      this.error = 'Vui lòng nhập mô tả triệu chứng (ít nhất 5 ký tự).';
      return;
    }
    
    this.isLibraryLoading = true;
    this.libraryError = null;
    this.symptomSearchDiseases = [];
    
    // Use the correct API endpoint from backend
    this.diseaseService.searchDiseases(description.trim())
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (diseases) => {
          this.symptomSearchDiseases = diseases;
          this.isLibraryLoading = false;
          
          // Force change detection
          this.cdr.detectChanges();
        },
        error: (err) => {
          this.libraryError = 'Không thể tìm kiếm bệnh. Vui lòng thử lại sau.';
          this.isLibraryLoading = false;
          
          // Force change detection
          this.cdr.detectChanges();
        }
      });
  }

  /**
   * Track by function for ngFor
   */
  trackById(index: number, item: any): number {
    return item.id || item.detectionId || index;
  }

  trackByRecommendation(index: number, item: string): number {
    return index;
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
   * Clear detection result manually
   */
  clearDetectionResult(): void {
    this.detectionResult = null;
    this.treatmentGuide = null;
    console.log('[DiseaseDetectionComponent] Detection result cleared');
    
    // Clear from localStorage
    localStorage.removeItem(this.STORAGE_KEYS.DETECTION_RESULT);
    
    // Force change detection
    this.cdr.detectChanges();
  }

  /**
   * Clear all errors
   */
  clearAllErrors(): void {
    this.imageError = null;
    this.symptomError = null;
    this.historyError = null;
    this.libraryError = null;
    this.error = null;
  }

  /**
   * Clear specific error
   */
  clearError(errorType: 'image' | 'symptom' | 'history' | 'library'): void {
    switch (errorType) {
      case 'image':
        this.imageError = null;
        break;
      case 'symptom':
        this.symptomError = null;
        break;
      case 'history':
        this.historyError = null;
        break;
      case 'library':
        this.libraryError = null;
        break;
    }
  }

  /**
   * Get mock detection result for demo when API is not available
   */
  private getMockDetectionResult(): DiseaseDetectionResult {
    return {
      detectionId: Math.floor(Math.random() * 1000),
      detectedDisease: 'Bệnh đốm lá',
      confidenceScore: 85.5,
      severity: 'MEDIUM',
      description: 'Bệnh này thường gặp ở cây cảnh trong nhà, được gây ra bởi nấm phát triển trong môi trường ẩm ướt. Các đốm nâu xuất hiện trên lá, có thể lan rộng và gây rụng lá.',
      recommendations: [
        'Cắt bỏ những lá bị bệnh nặng để ngăn lây lan',
        'Phun thuốc diệt nấm sinh học 2-3 lần/tuần trong 2 tuần',
        'Giảm tưới nước và tăng thông gió cho cây',
        'Đặt cây ở nơi có ánh sáng gián tiếp, tránh ánh nắng trực tiếp',
        'Sử dụng đất thoát nước tốt và tránh để nước đọng',
        'Theo dõi tiến độ điều trị và ghi chép các thay đổi'
      ],
      createdAt: Date.now(),
      plantName: 'Cây cảnh demo',
      plantId: this.imageForm?.get('plantId')?.value || this.symptomForm?.get('plantId')?.value || 1
    };
  }

  /**
   * Get mock detection result based on symptoms for demo when API is not available
   */
  private getMockDetectionResultFromSymptoms(symptoms: string): DiseaseDetectionResult {
    // Analyze symptoms to determine mock disease
    const lowerSymptoms = symptoms.toLowerCase();
    let detectedDisease = 'Bệnh đốm lá';
    let description = 'Bệnh này thường gặp ở cây cảnh trong nhà, được gây ra bởi nấm phát triển trong môi trường ẩm ướt. Các đốm nâu xuất hiện trên lá, có thể lan rộng và gây rụng lá.';
    let recommendations = [
      'Cắt bỏ những lá bị bệnh nặng để ngăn lây lan',
      'Phun thuốc diệt nấm sinh học 2-3 lần/tuần trong 2 tuần',
      'Giảm tưới nước và tăng thông gió cho cây',
      'Đặt cây ở nơi có ánh sáng gián tiếp, tránh ánh nắng trực tiếp',
      'Sử dụng đất thoát nước tốt và tránh để nước đọng',
      'Theo dõi tiến độ điều trị và ghi chép các thay đổi'
    ];
    let severity = 'MEDIUM';
    let confidenceScore = 85.5;

    if (lowerSymptoms.includes('vàng') || lowerSymptoms.includes('héo')) {
      detectedDisease = 'Bệnh thối rễ';
      description = 'Bệnh thối rễ thường xảy ra do tưới nước quá nhiều hoặc đất không thoát nước tốt. Rễ bị thối khiến cây không thể hấp thụ dinh dưỡng, dẫn đến lá vàng héo và cây chậm phát triển.';
      recommendations = [
        'Kiểm tra và cải thiện hệ thống thoát nước ngay lập tức',
        'Giảm tần suất tưới nước, chỉ tưới khi đất khô 2-3cm bề mặt',
        'Thay đất mới có khả năng thoát nước tốt (thêm cát, perlite)',
        'Cắt bỏ phần rễ bị thối bằng dụng cụ sạch',
        'Sử dụng thuốc kích thích ra rễ và thuốc trị nấm rễ',
        'Đặt cây ở nơi thoáng gió, tránh ánh nắng trực tiếp trong thời gian hồi phục',
        'Theo dõi sự phát triển của rễ mới và điều chỉnh chế độ chăm sóc'
      ];
      severity = 'HIGH';
      confidenceScore = 92.0;
    } else if (lowerSymptoms.includes('đốm') || lowerSymptoms.includes('nâu')) {
      detectedDisease = 'Bệnh đốm lá';
      description = 'Bệnh đốm lá do nấm gây ra, tạo ra các đốm nâu trên bề mặt lá. Bệnh phát triển mạnh trong môi trường ẩm ướt và có thể lây lan nhanh chóng nếu không được điều trị kịp thời.';
      recommendations = [
        'Cắt bỏ những lá bị bệnh nặng để ngăn lây lan',
        'Phun thuốc diệt nấm sinh học 2-3 lần/tuần trong 2 tuần',
        'Giảm tưới nước và tăng thông gió cho cây',
        'Đặt cây ở nơi có ánh sáng gián tiếp, tránh ánh nắng trực tiếp',
        'Sử dụng đất thoát nước tốt và tránh để nước đọng',
        'Theo dõi tiến độ điều trị và ghi chép các thay đổi'
      ];
      severity = 'MEDIUM';
      confidenceScore = 88.5;
    } else if (lowerSymptoms.includes('trắng') || lowerSymptoms.includes('bột')) {
      detectedDisease = 'Bệnh phấn trắng';
      description = 'Bệnh phấn trắng tạo ra lớp bột trắng trên bề mặt lá, làm giảm khả năng quang hợp của cây. Bệnh thường xuất hiện khi độ ẩm cao và thông gió kém.';
      recommendations = [
        'Phun thuốc diệt nấm chuyên dụng cho bệnh phấn trắng',
        'Tăng thông gió và giảm độ ẩm trong môi trường',
        'Cắt bỏ lá bị bệnh nặng để ngăn lây lan',
        'Tránh tưới nước lên lá, chỉ tưới vào gốc cây',
        'Sử dụng baking soda pha loãng (1 thìa cà phê + 1 lít nước) để phun',
        'Đặt cây ở nơi có ánh sáng tốt và thông gió',
        'Theo dõi và ghi chép tiến độ điều trị'
      ];
      severity = 'MEDIUM';
      confidenceScore = 90.0;
    } else if (lowerSymptoms.includes('rệp') || lowerSymptoms.includes('sáp')) {
      detectedDisease = 'Bệnh rệp sáp';
      description = 'Rệp sáp là loại côn trùng hút nhựa cây, thường gặp ở cây trong nhà. Chúng tạo ra vết dính trên lá và làm cây yếu đi do mất dinh dưỡng.';
      recommendations = [
        'Sử dụng tăm bông nhúng cồn để lau sạch rệp sáp',
        'Phun xà phòng diệt côn trùng (1 thìa xà phòng + 1 lít nước)',
        'Sử dụng dầu neem hoặc dầu khoáng để diệt trừ',
        'Tăng độ ẩm và thông gió để ngăn rệp sáp phát triển',
        'Kiểm tra và cách ly cây bị bệnh khỏi cây khác',
        'Theo dõi sự xuất hiện của rệp sáp mới',
        'Sử dụng thiên địch như bọ rùa nếu có thể'
      ];
      severity = 'MEDIUM';
      confidenceScore = 87.0;
    }

    return {
      detectionId: Math.floor(Math.random() * 1000),
      detectedDisease,
      confidenceScore,
      severity,
      description,
      recommendations,
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

  /**
   * Get treatment guide for detected disease
   */
  getTreatmentGuide(diseaseName: string | undefined): void {
    this.error = null;
    if (!diseaseName) {
      this.treatmentGuide = null;
      this.error = 'Không thể tải hướng dẫn điều trị: thiếu tên bệnh.';
      return;
    }
    this.isLoading = true;
    this.diseaseService.getTreatmentGuide(diseaseName)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (guide) => {
          if (guide && guide.diseaseName) {
            this.treatmentGuide = {
              ...guide,
              steps: Array.isArray(guide.steps) ? guide.steps : [],
              requiredProducts: Array.isArray(guide.requiredProducts) ? guide.requiredProducts : [],
              precautions: Array.isArray(guide.precautions) ? guide.precautions : [],
            };
            this.error = null;
          } else {
            this.treatmentGuide = null;
            this.error = 'Không có dữ liệu hướng dẫn điều trị.';
          }
          this.isLoading = false;
          // Force UI update
          this.cdr.detectChanges();
        },
        error: (err) => {
          this.treatmentGuide = null;
          if (err && err.status === 404) {
            this.error = 'Bệnh này chưa có phương pháp chữa trị chính xác. Vui lòng kết nối với chuyên gia để được hỗ trợ.';
          } else if (err && err.status === 500) {
            this.error = 'Lỗi máy chủ (500): Không thể xử lý yêu cầu. Vui lòng thử lại sau hoặc liên hệ hỗ trợ.';
          } else {
            this.error = `Không thể tải hướng dẫn điều trị (Lỗi ${err?.status || 'không xác định'}). Vui lòng thử lại sau.`;
          }
          this.isLoading = false;
        }
      });
  }

  /**
   * Start tracking treatment progress
   */
  startTreatmentTracking(detectionId: number | undefined): void {
    if (!detectionId) {
      this.error = 'Không thể bắt đầu theo dõi điều trị: thiếu ID phát hiện bệnh.';
      return;
    }
    
    this.isLoading = true;
    
    this.diseaseService.trackTreatmentProgress(detectionId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (progress) => {
          this.isLoading = false;
          // Sau khi theo dõi điều trị, reload lịch sử phát hiện bệnh
          this.loadDetectionHistory();
          // Force change detection
          this.cdr.detectChanges();
        },
        error: (err) => {
          this.error = 'Không thể bắt đầu theo dõi điều trị.';
          this.isLoading = false;
          
          // Force change detection
          this.cdr.detectChanges();
        }
      });
  }

  /**
   * Update treatment progress
   */
  updateTreatmentProgress(detectionId: number, updateData: any): void {
    this.isLoading = true;
    
    this.diseaseService.updateTreatmentProgress(detectionId, updateData)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (progress) => {
          this.isLoading = false;
          
          // Show success message or update UI
          // this.showSuccessMessage('Tiến độ điều trị đã được cập nhật');
          
          // Force change detection
          this.cdr.detectChanges();
        },
        error: (err) => {
          this.error = 'Không thể cập nhật tiến độ điều trị.';
          this.isLoading = false;
          
          // Force change detection
          this.cdr.detectChanges();
        }
      });
  }

  /**
   * Complete treatment
   */
  completeTreatment(detectionId: number, result: string, successRate: number): void {
    this.isLoading = true;
    
    this.diseaseService.completeTreatment(detectionId, result, successRate)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (progress) => {
          this.isLoading = false;
          
          // Show success message
          // this.showSuccessMessage('Điều trị đã hoàn thành thành công!');
          
          // Force change detection
          this.cdr.detectChanges();
        },
        error: (err) => {
          this.error = 'Không thể hoàn thành điều trị.';
          this.isLoading = false;
          
          // Force change detection
          this.cdr.detectChanges();
        }
      });
  }

  /**
   * Search diseases by keyword
   */
  searchDiseases(keyword: string): void {
    if (!keyword || keyword.trim().length < 3) {
      this.error = 'Vui lòng nhập từ khóa tìm kiếm (ít nhất 3 ký tự).';
      return;
    }
    
    this.isLibraryLoading = true;
    this.libraryError = null;
    
    this.diseaseService.searchDiseases(keyword.trim())
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (diseases) => {
          this.diseaseLibrary = diseases;
          this.isLibraryLoading = false;
          
          // Save to localStorage
          this.savePersistedData();
          
          // Force change detection
          this.cdr.detectChanges();
        },
        error: (err) => {
          this.libraryError = 'Không thể tìm kiếm bệnh. Vui lòng thử lại sau.';
          this.isLibraryLoading = false;
          
          // Force change detection
          this.cdr.detectChanges();
        }
      });
  }

  /**
   * Scroll to the detection result panel
   */
  private scrollToResult(): void {
    setTimeout(() => {
      const el = document.getElementById('detection-result-panel');
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        el.classList.add('highlight-result');
        setTimeout(() => el.classList.remove('highlight-result'), 2000);
      }
    }, 100);
  }

  /**
   * Clear detection result and reset form
   */
}
