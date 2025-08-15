
// ...existing imports and decorator...


import { Component, OnInit, OnDestroy, ViewChild, ElementRef, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { Subject, takeUntil, debounceTime, distinctUntilChanged, firstValueFrom } from 'rxjs';
import { TopNavigatorComponent } from '../../shared/top-navigator/top-navigator.component';

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
  treatment: string;
  prevention: string;
  medications: string[];
  duration: string;
  notes: string;
  lastUpdated?: string;
  source?: string;
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
  severities: string[] = [];
  filterForm: FormGroup;
  isLoadingLibrary = false;
  isFiltering = false;
  showAdvancedFilters = false;
  
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
      searchKeyword: [''],
      selectedCategory: ['all'],
      selectedSeverity: ['all'],
      showOnlyCommon: [false],
      sortBy: ['name'],
      sortOrder: ['asc']
    });

    // Initialize UI states to prevent ExpressionChangedAfterItHasBeenCheckedError
    this.showAdvancedFilters = false;
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
      // Load diseases library first
      await this.loadDiseases();
      
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
      // Ensure diseases are loaded
      if (this.allDiseases.length === 0) {
        this.loadDiseases();
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
    // Initialize filter options based on actual data
    this.categories = ['all', 'Nấm', 'Vi khuẩn', 'Virus', 'Côn trùng', 'Sinh lý'];
    this.severities = ['all', 'LOW', 'MEDIUM', 'HIGH', 'CRITICAL'];
  }

  private setupFilterListeners(): void {
    // Search keyword with debounce
    this.filterForm.get('searchKeyword')?.valueChanges
      .pipe(
        takeUntil(this.destroy$),
        debounceTime(300),
        distinctUntilChanged()
      )
      .subscribe(() => this.applyFilters());

    // Other filters
    this.filterForm.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => this.applyFilters());
  }

  private async loadDiseases(): Promise<void> {
    this.isLoadingLibrary = true;
    
    try {
      // Try to load from API first
      const diseases = await this.fetchAllDiseases();
      
      if (diseases && diseases.length > 0) {
        this.allDiseases = [...diseases];
        this.totalItems = diseases.length;
      } else {
        // Fallback to mock data
        this.allDiseases = [...this.getMockDiseases()];
        this.totalItems = this.allDiseases.length;
      }
      
      // Initialize filtered diseases immediately
      this.filteredDiseases = [...this.allDiseases];
      
      // Apply initial filters and update pagination
      this.applyFilters();
      
    } catch (error) {
      console.error('Error loading diseases:', error);
      // Use mock data as fallback
      this.allDiseases = [...this.getMockDiseases()];
      this.filteredDiseases = [...this.allDiseases];
      this.totalItems = this.allDiseases.length;
      
      // Apply filters even with mock data
      this.applyFilters();
    } finally {
      this.isLoadingLibrary = false;
    }
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
      return this.getMockDiseases();
    }
  }

  private getMockDiseases(): PlantDisease[] {
    const mockDiseases = [
      {
        id: 1,
        name: 'Bệnh phấn trắng',
        scientificName: 'Erysiphe cichoracearum',
        category: 'Nấm',
        severity: 'MEDIUM',
        symptoms: ['Lá xuất hiện lớp phấn trắng', 'Lá vàng và rụng'],
        treatment: 'Phun thuốc trừ nấm, cắt tỉa lá bệnh',
        prevention: 'Tăng ánh sáng, giảm độ ẩm',
        affectedPlants: ['Hoa hồng', 'Cúc', 'Dạ yến thảo'],
        commonality: 1
      },
      {
        id: 2,
        name: 'Bệnh đốm đen',
        scientificName: 'Diplocarpon rosae',
        category: 'Nấm',
        severity: 'HIGH',
        symptoms: ['Đốm đen tròn trên lá', 'Lá vàng và rụng'],
        treatment: 'Phun thuốc trừ nấm, vệ sinh vườn',
        prevention: 'Tránh tưới nước lên lá',
        affectedPlants: ['Hoa hồng', 'Cúc', 'Dạ yến thảo'],
        commonality: 1
      },
      {
        id: 3,
        name: 'Rệp sáp',
        scientificName: 'Pseudococcidae',
        category: 'Côn trùng',
        severity: 'MEDIUM',
        symptoms: ['Côn trùng nhỏ màu trắng trên thân và lá'],
        treatment: 'Phun thuốc trừ sâu, lau sạch rệp',
        prevention: 'Tăng dinh dưỡng, kiểm tra thường xuyên',
        affectedPlants: ['Tất cả các loại cây'],
        commonality: 1
      },
      {
        id: 4,
        name: 'Thiếu dinh dưỡng',
        scientificName: 'Nutrient Deficiency',
        category: 'Sinh lý',
        severity: 'LOW',
        symptoms: ['Lá vàng', 'Cây còi cọc', 'Chậm phát triển'],
        treatment: 'Bón phân đầy đủ, cải tạo đất',
        prevention: 'Bón phân định kỳ',
        affectedPlants: ['Tất cả các loại cây'],
        commonality: 1
      },
      {
        id: 5,
        name: 'Bệnh gỉ sắt',
        scientificName: 'Puccinia graminis',
        category: 'Nấm',
        severity: 'MEDIUM',
        symptoms: ['Đốm nâu cam trên lá'],
        treatment: 'Phun thuốc trừ nấm, cắt tỉa',
        prevention: 'Tăng thông gió',
        affectedPlants: ['Hoa hồng', 'Cúc'],
        commonality: 1
      },
      {
        id: 6,
        name: 'Bệnh héo vi khuẩn',
        scientificName: 'Ralstonia solanacearum',
        category: 'Vi khuẩn',
        severity: 'CRITICAL',
        symptoms: ['Lá héo', 'Thân mềm', 'Rễ thối'],
        treatment: 'Nhổ bỏ cây bệnh, xử lý đất',
        prevention: 'Tưới nước vừa phải',
        affectedPlants: ['Cà chua', 'Ớt', 'Cà tím'],
        commonality: 1
      },
      {
        id: 7,
        name: 'Bệnh khảm lá',
        scientificName: 'Tobacco mosaic virus',
        category: 'Virus',
        severity: 'HIGH',
        symptoms: ['Lá có vệt xanh vàng', 'Biến dạng'],
        treatment: 'Nhổ bỏ cây bệnh, diệt côn trùng',
        prevention: 'Trồng cây kháng bệnh',
        affectedPlants: ['Cà chua', 'Dưa chuột'],
        commonality: 1
      },
      {
        id: 8,
        name: 'Thối rễ',
        scientificName: 'Phytophthora spp.',
        category: 'Nấm',
        severity: 'CRITICAL',
        symptoms: ['Rễ đen', 'Mềm', 'Cây héo'],
        treatment: 'Cải tạo đất, thoát nước',
        prevention: 'Tránh tưới quá nhiều',
        affectedPlants: ['Tất cả các loại cây'],
        commonality: 1
      },
      {
        id: 9,
        name: 'Cháy lá',
        scientificName: 'Alternaria spp.',
        category: 'Nấm',
        severity: 'MEDIUM',
        symptoms: ['Lá cháy từ mép vào trong'],
        treatment: 'Phun thuốc trừ nấm, cắt tỉa',
        prevention: 'Tăng ánh sáng, giảm độ ẩm',
        affectedPlants: ['Hoa hồng', 'Cúc'],
        commonality: 1
      },
      {
        id: 10,
        name: 'Thối thân',
        scientificName: 'Sclerotinia sclerotiorum',
        category: 'Nấm',
        severity: 'HIGH',
        symptoms: ['Thân mềm', 'Đen', 'Cây gãy'],
        treatment: 'Cắt tỉa, phun thuốc',
        prevention: 'Tăng thông gió',
        affectedPlants: ['Hoa hồng', 'Cúc'],
        commonality: 1
      },
      {
        id: 11,
        name: 'Bệnh thối ngọn xương rồng',
        scientificName: 'Fusarium oxysporum',
        category: 'Nấm',
        severity: 'HIGH',
        symptoms: ['Phần ngọn mềm nhũn', 'Đổi màu từ xanh sang nâu sẫm', 'Có thể chảy dịch nhầy'],
        treatment: 'Cắt bỏ phần bị thối, xử lý vết cắt bằng thuốc nấm',
        prevention: 'Sử dụng giá thể thoáng, thoát nước tốt, tránh tưới quá nhiều',
        affectedPlants: ['Cây mọng nước', 'Xương rồng cảnh'],
        commonality: 1
      }
    ];
    
    console.log('Generated mock diseases:', mockDiseases.length);
    return mockDiseases;
  }

  private applyFilters(): void {
    this.isFiltering = true;

    const filters = this.filterForm.value;
    let filtered = [...this.allDiseases];

    // Search keyword filter
    if (filters.searchKeyword && filters.searchKeyword.trim()) {
      const keyword = filters.searchKeyword.toLowerCase();
      filtered = filtered.filter(disease =>
        disease.name.toLowerCase().includes(keyword) ||
        disease.scientificName.toLowerCase().includes(keyword) ||
        disease.symptoms.some(symptom => symptom.toLowerCase().includes(keyword)) ||
        disease.treatment.toLowerCase().includes(keyword) ||
        disease.prevention.toLowerCase().includes(keyword) ||
        disease.affectedPlants.some(plant => plant.toLowerCase().includes(keyword))
      );
    }

    // Category filter
    if (filters.selectedCategory && filters.selectedCategory !== 'all') {
      filtered = filtered.filter(disease => disease.category === filters.selectedCategory);
    }

    // Severity filter
    if (filters.selectedSeverity && filters.selectedSeverity !== 'all') {
      filtered = filtered.filter(disease => disease.severity === filters.selectedSeverity);
    }

    // Common diseases filter
    if (filters.showOnlyCommon) {
      filtered = filtered.filter(disease => disease.commonality === 1);
    }

    // Sorting
    this.sortDiseases(filtered, filters.sortBy, filters.sortOrder);

    // Update filtered diseases
    this.filteredDiseases = [...filtered];
    this.totalItems = filtered.length;
    this.currentPage = 0;
    
    // Update paged diseases immediately
    this.updatePagedDiseases();
    
    // Force change detection
    this.cdr.detectChanges();
    
    this.isFiltering = false;
  }

  private sortDiseases(diseases: PlantDisease[], sortBy: string, sortOrder: string): void {
    diseases.sort((a, b) => {
      let aValue: any, bValue: any;

      switch (sortBy) {
        case 'name':
          aValue = a.name.toLowerCase();
          bValue = b.name.toLowerCase();
          break;
        case 'category':
          aValue = a.category.toLowerCase();
          bValue = b.category.toLowerCase();
          break;
        case 'severity':
          aValue = this.getSeverityWeight(a.severity);
          bValue = this.getSeverityWeight(b.severity);
          break;
        case 'common':
          aValue = a.commonality;
          bValue = b.commonality;
          break;
        default:
          aValue = a.name.toLowerCase();
          bValue = b.name.toLowerCase();
      }

      if (sortOrder === 'asc') {
        return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
      } else {
        return aValue > bValue ? -1 : aValue < bValue ? 1 : 0;
      }
    });
  }

  private getSeverityWeight(severity: string): number {
    const weights: { [key: string]: number } = {
      'LOW': 1,
      'MEDIUM': 2,
      'HIGH': 3,
      'CRITICAL': 4
    };
    return weights[severity] || 0;
  }

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
  clearFilters(): void {
    this.filterForm.patchValue({
      searchKeyword: '',
      selectedCategory: 'all',
      selectedSeverity: 'all',
      showOnlyCommon: false,
      sortBy: 'name',
      sortOrder: 'asc'
    });
    
    // Reset to show all diseases
    this.filteredDiseases = [...this.allDiseases];
    this.totalItems = this.allDiseases.length;
    this.currentPage = 0;
    
    // Update paged diseases immediately
    this.updatePagedDiseases();
    
    // Force change detection
    this.cdr.detectChanges();
  }

  toggleAdvancedFilters(): void {
    this.showAdvancedFilters = !this.showAdvancedFilters;
  }

  // ==================== DISEASE DETAIL METHODS ====================
  selectDisease(disease: PlantDisease): void {
    this.selectedDisease = disease;
  }

  closeDiseaseDetail(): void {
    this.selectedDisease = null;
  }

  // ==================== EXPORT METHODS ====================
  exportToCSV(): void {
    if (this.filteredDiseases.length === 0) return;

    const headers = ['Tên bệnh', 'Tên khoa học', 'Loại bệnh', 'Mức độ', 'Triệu chứng', 'Điều trị', 'Phòng ngừa', 'Cây bị ảnh hưởng'];
    const csvContent = [
      headers.join(','),
      ...this.filteredDiseases.map(disease => [
        `"${disease.name}"`,
        `"${disease.scientificName}"`,
        `"${disease.category}"`,
        `"${disease.severity}"`,
        `"${disease.symptoms.join('; ')}"`,
        `"${disease.treatment}"`,
        `"${disease.prevention}"`,
        `"${disease.affectedPlants.join('; ')}"`
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `benh_cay_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

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
      this.loadDiseases();
    }
    
    // Force change detection
    this.cdr.detectChanges();
  }
}
