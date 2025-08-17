
import { Component, OnInit, OnDestroy, ViewChild, ElementRef, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { Subject, takeUntil, debounceTime, distinctUntilChanged, firstValueFrom } from 'rxjs';
import { TopNavigatorComponent } from '../../../shared/top-navigator/top-navigator.component';

// Interfaces
interface PlantDisease {
  id: number;
  name: string;
  scientificName: string;
  category: string;
  severity: string;
  symptoms: string[];
  treatment: string;
  prevention: string;
  affectedPlants: string[];
  commonality: number;
}

interface DiseaseDetectionResult {
  id: number;
  detectedDisease: string;
  confidenceScore: number;
  severity: string;
  symptoms: string;
  recommendedTreatment: string;
  status: string;
  isConfirmed: boolean;
  expertNotes?: string;
  detectedAt: number;
  treatedAt?: number;
  treatmentResult?: string;
  detectionMethod: 'IMAGE' | 'SYMPTOMS';
  aiModelVersion: string;
}

interface DiseaseDetectionHistory {
  id: number;
  detectedDisease: string;
  confidenceScore: number;
  severity: string;
  symptoms: string;
  recommendedTreatment: string;
  status: string;
  isConfirmed: boolean;
  expertNotes?: string;
  detectedAt: number;
  treatedAt?: number;
  treatmentResult?: string;
  detectionMethod: 'IMAGE' | 'SYMPTOMS';
  aiModelVersion: string;
}

interface TreatmentGuide {
  diseaseName: string;
  severity: string;
  steps: string[];
  requiredProducts: string[];
  estimatedDuration: string;
  successRate: string;
  precautions: string[];
  followUpSchedule: string;
  expertNotes: string;
}

interface DiseaseFilter {
  searchKeyword: string;
  selectedCategory: string;
  selectedSeverity: string;
  showOnlyCommon: boolean;
  sortBy: 'name' | 'category' | 'severity' | 'common';
  sortOrder: 'asc' | 'desc';
}

@Component({
  selector: 'app-disease-detection',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    TopNavigatorComponent
  ],
  templateUrl: './disease-detection.component.html',
  styleUrl: './disease-detection.component.scss'
})
export class DiseaseDetectionComponent implements OnInit, OnDestroy {
  @ViewChild('imageInput') imageInput!: ElementRef<HTMLInputElement>;
  @ViewChild('imagePreview') imagePreview!: ElementRef<HTMLImageElement>;
  
  private destroy$ = new Subject<void>();
  
  // Active tab
  activeTab: 'image' | 'symptoms' | 'history' | 'library' = 'image';
  
  // Image detection
  selectedImage: File | null = null;
  imagePreviewUrl: string | null = null;
  isDetectingFromImage = false;
  imageDetectionResult: DiseaseDetectionResult | null = null;
  
  // Symptoms detection
  symptomsForm: FormGroup;
  isDetectingFromSymptoms = false;
  symptomsDetectionResult: DiseaseDetectionResult | null = null;
  
  // Disease library
  allDiseases: PlantDisease[] = [];
  filteredDiseases: PlantDisease[] = [];
  categories: string[] = [];
  filterForm: FormGroup;
  isLoadingLibrary = false;
  
  // History
  detectionHistory: DiseaseDetectionHistory[] = [];
  isLoadingHistory = false;
  totalHistoryItems: number = 0;
  
  // Pagination
  currentPage = 0;
  pageSize = 12;
  totalItems = 0;
  pagedDiseases: PlantDisease[] = [];
  
  // Selected disease for detail view
  selectedDisease: PlantDisease | null = null;
  selectedTreatmentGuide: TreatmentGuide | null = null;
  
  // UI states
  isLoading = false;
  errorMessage = '';
  successMessage = '';

  constructor(
    private http: HttpClient,
    private fb: FormBuilder,
    private cdr: ChangeDetectorRef
  ) {
    this.symptomsForm = this.fb.group({
      symptoms: ['', Validators.required]
    });

    this.filterForm = this.fb.group({
      selectedCategory: [this.categories.length > 0 ? this.categories[0] : 'Nấm']
    });
    this.pagedDiseases = [];
  }

  // Force change detection to update UI
  private forceChangeDetection(): void {
    this.cdr.detectChanges();
    console.log('Change detection forced');
  }

  ngOnInit(): void {
    this.initializeFilters();
    this.setupFilterListeners();
    
    // Load data immediately and ensure it's displayed
    this.loadInitialData();
  }

  private async loadInitialData(): Promise<void> {
    try {
  // Load diseases library theo category mặc định
  await this.loadDiseasesByCategory(this.filterForm.value.selectedCategory);
      
      // Force change detection after loading diseases
      this.cdr.detectChanges();
      
      // Load detection history
      await this.loadDetectionHistory();
      
      // Force change detection after loading history
      this.cdr.detectChanges();
      
      // Final force change detection
      setTimeout(() => {
        this.cdr.detectChanges();
      }, 200);
      
    } catch (error) {
      console.error('Error in loadInitialData:', error);
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // ==================== TAB MANAGEMENT ====================
  setActiveTab(tab: 'image' | 'symptoms' | 'history' | 'library'): void {
    this.activeTab = tab;
    
    // Force change detection when switching tabs
    this.cdr.detectChanges();
    
    // Load specific data for each tab
    if (tab === 'history') {
      this.loadDetectionHistory();
    } else if (tab === 'library') {
      if (this.allDiseases.length === 0) {
        this.loadDiseasesByCategory(this.filterForm.value.selectedCategory);
      }
    }
    
    // Force change detection again after loading data
    setTimeout(() => {
      this.cdr.detectChanges();
    }, 100);
  }

  // ==================== IMAGE DETECTION ====================
  onImageSelected(event: any): void {
    const file = event.target.files[0];
    if (file && file.type.startsWith('image/')) {
      this.selectedImage = file;
      this.createImagePreview(file);
      this.clearMessages();
    } else {
      this.showError('Vui lòng chọn file ảnh hợp lệ');
    }
  }

  private createImagePreview(file: File): void {
    const reader = new FileReader();
    reader.onload = (e: any) => {
      this.imagePreviewUrl = e.target.result;
    };
    reader.readAsDataURL(file);
  }

  async detectDiseaseFromImage(): Promise<void> {
    if (!this.selectedImage) {
      this.showError('Vui lòng chọn ảnh trước khi phát hiện bệnh');
      return;
    }

    this.isDetectingFromImage = true;
    this.clearMessages();

    try {
      const formData = new FormData();
      formData.append('image', this.selectedImage);

      const result = await firstValueFrom(
        this.http.post<DiseaseDetectionResult>(
          `/api/vip/disease-detection/detect-from-image`,
          formData
        )
      );

      if (result) {
        this.imageDetectionResult = {
          ...result,
          detectedAt: Date.now()
        };
        this.showSuccess('Phát hiện bệnh thành công!');
        this.loadDetectionHistory(); // Refresh history
      }
    } catch (error: any) {
      console.error('Error detecting disease from image:', error);
      this.showError('Có lỗi xảy ra khi phát hiện bệnh. Vui lòng thử lại.');
    } finally {
      this.isDetectingFromImage = false;
    }
  }

  clearImageDetection(): void {
    this.selectedImage = null;
    this.imagePreviewUrl = null;
    this.imageDetectionResult = null;
    if (this.imageInput) {
      this.imageInput.nativeElement.value = '';
    }
  }

  // ==================== SYMPTOMS DETECTION ====================
  async detectDiseaseFromSymptoms(): Promise<void> {
    if (this.symptomsForm.invalid) {
      this.showError('Vui lòng điền đầy đủ thông tin bắt buộc');
      return;
    }

    this.isDetectingFromSymptoms = true;
    this.clearMessages();

    try {
      // Prepare request with correct format
      const symptomsText = this.symptomsForm.get('symptoms')?.value;
      const request = {
        description: symptomsText,
        detectionMethod: 'SYMPTOMS' as const
      };

      console.log('Sending symptoms detection request:', request);

      const result = await firstValueFrom(
        this.http.post<DiseaseDetectionResult>(
          `/api/vip/disease-detection/detect-from-symptoms`,
          request
        )
      );

      if (result) {
        this.symptomsDetectionResult = {
          ...result,
          detectedAt: Date.now()
        };
        this.showSuccess('Phân tích triệu chứng thành công!');
        this.loadDetectionHistory(); // Refresh history
      }
    } catch (error: any) {
      console.error('Error detecting disease from symptoms:', error);
      this.showError('Có lỗi xảy ra khi phân tích triệu chứng. Vui lòng thử lại.');
    } finally {
      this.isDetectingFromSymptoms = false;
    }
  }

  clearSymptomsDetection(): void {
    this.symptomsForm.reset();
    this.symptomsDetectionResult = null;
  }

  // ==================== DETECTION HISTORY ====================
  async loadDetectionHistory(): Promise<void> {
    this.isLoadingHistory = true;
    
    try {
      const response = await firstValueFrom(
        this.http.get<any>(`/api/vip/disease-detection/history`)
      );

      // Handle paginated response from API
      if (response && response.content) {
        this.detectionHistory = [...response.content];
        this.totalHistoryItems = response.totalElements;
      } else {
        this.detectionHistory = response ? [...response] : [];
        this.totalHistoryItems = this.detectionHistory.length;
      }
      
      // Force change detection immediately
      this.cdr.detectChanges();
      
    } catch (error: any) {
      console.error('Error loading detection history:', error);
      this.detectionHistory = [];
      this.totalHistoryItems = 0;
    } finally {
      this.isLoadingHistory = false;
      
      // Force change detection again after completion
      this.cdr.detectChanges();
    }
  }

  clearHistory(): void {
    this.detectionHistory = [];
  }

  // ==================== DISEASE LIBRARY ====================
  private initializeFilters(): void {
    this.categories = ['Nấm', 'Côn trùng', 'Sinh lý', 'Vi khuẩn', 'Virus'];
  }

  private setupFilterListeners(): void {
    this.filterForm.get('selectedCategory')?.valueChanges
      .pipe(distinctUntilChanged(), takeUntil(this.destroy$))
      .subscribe((category) => this.loadDiseasesByCategory(category));
  }

  private async loadDiseasesByCategory(category: string): Promise<void> {
    this.isLoadingLibrary = true;
    try {
      const apiDiseases = await firstValueFrom(
        this.http.get<any[]>(
          `/api/vip/disease-detection/by-category?category=${encodeURIComponent(category)}`,
          { headers: { Authorization: `Bearer ${this.getAuthToken()}` } }
        )
      );
      // Map API fields to PlantDisease model
      this.allDiseases = (apiDiseases || []).map(d => ({
        id: d.id,
        name: d.diseaseName || d.name || '',
        scientificName: d.scientificName || '',
        category: d.category || '',
        severity: d.severity || '',
        symptoms: Array.isArray(d.symptoms) ? d.symptoms : (typeof d.symptoms === 'string' && d.symptoms ? d.symptoms.split(';').map((s: string) => s.trim()) : []),
        treatment: d.treatment || '',
        prevention: d.prevention || '',
        affectedPlants: Array.isArray(d.affectedPlants) ? d.affectedPlants : (d.affectedPlantTypes ? d.affectedPlantTypes.split(',').map((s: string) => s.trim()) : []),
        commonality: typeof d.commonality === 'number' ? d.commonality : 0
      }));
      this.filteredDiseases = [...this.allDiseases];
      this.totalItems = this.filteredDiseases.length;
      this.currentPage = 0;
      this.updatePagedDiseases();
      this.cdr.markForCheck();
    } catch (error) {
      console.error('Error loading diseases by category:', error);
      this.allDiseases = [];
      this.filteredDiseases = [];
      this.totalItems = 0;
      this.updatePagedDiseases();
      this.showError('Không thể tải dữ liệu bệnh từ hệ thống.');
      this.cdr.markForCheck();
    } finally {
      this.isLoadingLibrary = false;
    }
  }

  private getAuthToken(): string {
    // Lấy token từ cookie hoặc localStorage tuỳ dự án
    return (document.cookie.match(/auth_token=([^;]+)/)?.[1]) || '';
  }

  private async fetchAllDiseases(): Promise<PlantDisease[]> {
    try {
      // Try to get common diseases first
      const commonDiseases = await firstValueFrom(
        this.http.get<PlantDisease[]>(
          `/api/vip/disease-detection/common-diseases?plantType=general`
        )
      );

      // If we have common diseases, use them as base
      if (commonDiseases && commonDiseases.length > 0) {
        return commonDiseases;
      }

      // Fallback: try to get diseases by category
      const fungalDiseases = await firstValueFrom(
        this.http.get<PlantDisease[]>(
          `/api/vip/disease-detection/by-category?category=Fungal`
        )
      );

      const bacterialDiseases = await firstValueFrom(
        this.http.get<PlantDisease[]>(
          `/api/vip/disease-detection/by-category?category=Bacterial`
        )
      );

      return [...(fungalDiseases || []), ...(bacterialDiseases || [])];
    } catch (error) {
      console.error('Error fetching diseases:', error);
      // Return mock data as fallback
  return [];
    }
  }



  // Đã loại bỏ sort/filter nâng cao, chỉ lọc theo category qua API

  private updatePagedDiseases(): void {
    const startIndex = this.currentPage * this.pageSize;
    const endIndex = startIndex + this.pageSize;
    
    // Create new array to trigger change detection
    this.pagedDiseases = [...this.filteredDiseases.slice(startIndex, endIndex)];
    
    // Force change detection after updating
    this.cdr.detectChanges();
  }

  // ==================== PAGINATION ====================
  get paginatedDiseases(): PlantDisease[] {
    return this.pagedDiseases;
  }

  get totalPages(): number {
    return Math.ceil(this.totalItems / this.pageSize);
  }

  get hasNextPage(): boolean {
    return this.currentPage < this.totalPages - 1;
  }

  get hasPrevPage(): boolean {
    return this.currentPage > 0;
  }

  get pageNumbers(): number[] {
    const pages: number[] = [];
    const maxVisiblePages = 5;
    const startPage = Math.max(0, Math.min(this.currentPage - 2, this.totalPages - maxVisiblePages));
    const endPage = Math.min(startPage + maxVisiblePages, this.totalPages);
    
    for (let i = startPage; i < endPage; i++) {
      pages.push(i);
    }
    return pages;
  }

  goToPage(page: number): void {
    if (page >= 0 && page < this.totalPages) {
      this.currentPage = page;
      this.updatePagedDiseases();
    }
  }

  nextPage(): void {
    if (this.hasNextPage) {
      this.currentPage++;
      this.updatePagedDiseases();
    }
  }

  prevPage(): void {
    if (this.hasPrevPage) {
      this.currentPage--;
      this.updatePagedDiseases();
    }
  }

  // ==================== TREATMENT GUIDE ====================
  async loadTreatmentGuide(diseaseName: string): Promise<void> {
    try {
      const guide = await firstValueFrom(
        this.http.get<TreatmentGuide>(
          `/api/vip/disease-detection/treatment-guide?diseaseName=${encodeURIComponent(diseaseName)}`
        )
      );

      if (guide) {
        this.selectedTreatmentGuide = guide;
      }
    } catch (error: any) {
      console.error('Error loading treatment guide:', error);
      this.showError('Không thể tải hướng dẫn điều trị');
    }
  }

  closeTreatmentGuide(): void {
    this.selectedTreatmentGuide = null;
  }


  // ==================== FILTER METHODS ====================
  // clearFilters and toggleAdvancedFilters removed

  // ==================== DISEASE DETAIL METHODS ====================
  selectDisease(disease: PlantDisease): void {
    this.selectedDisease = disease;
  }

  closeDiseaseDetail(): void {
    this.selectedDisease = null;
  }


  // ==================== EXPORT METHODS ====================
  // exportToCSV removed

  // ==================== UTILITY METHODS ====================
  getSeverityColor(severity: string): string {
    const colors: { [key: string]: string } = {
      'Low': '#28a745',
      'Medium': '#ffc107',
      'High': '#fd7e14',
      'Critical': '#dc3545'
    };
    return colors[severity] || '#6c757d';
  }

  getCategoryIcon(category: string): string {
    const icons: { [key: string]: string } = {
      'Fungal': '🍄',
      'Bacterial': '��',
      'Viral': '🦠',
      'Nematode': '🐛',
      'Environmental': '🌡️',
      'Nutritional': '🌱'
    };
    return icons[category] || '🌿';
  }

  getDetectionMethodIcon(method: 'IMAGE' | 'SYMPTOMS'): string {
    return method === 'IMAGE' ? '📷' : '🔍';
  }

  // ==================== MESSAGE MANAGEMENT ====================
  private showSuccess(message: string): void {
    this.successMessage = message;
    this.errorMessage = '';
    setTimeout(() => this.successMessage = '', 5000);
  }

  private showError(message: string): void {
    this.errorMessage = message;
    this.successMessage = '';
    setTimeout(() => this.errorMessage = '', 5000);
  }

  private clearMessages(): void {
    this.successMessage = '';
    this.errorMessage = '';
  }

  // ==================== FORM VALIDATION ====================
  isFieldInvalid(fieldName: string): boolean {
    const field = this.symptomsForm.get(fieldName);
    return field ? field.invalid && (field.dirty || field.touched) : false;
  }

  getFieldError(fieldName: string): string {
    const field = this.symptomsForm.get(fieldName);
    if (field && field.errors) {
      if (field.errors['required']) return 'Trường này là bắt buộc';
      if (field.errors['minlength']) return `Tối thiểu ${field.errors['minlength'].requiredLength} ký tự`;
    }
    return '';
  }

  // Method to force refresh current tab
  refreshCurrentTab(): void {
    if (this.activeTab === 'history') {
      this.loadDetectionHistory();
    } else if (this.activeTab === 'library') {
  this.loadDiseasesByCategory(this.filterForm.value.selectedCategory);
    }
    
    // Force change detection
    this.cdr.detectChanges();
  }
}
