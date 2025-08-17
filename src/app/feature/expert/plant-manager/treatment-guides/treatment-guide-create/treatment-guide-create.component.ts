import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, ActivatedRoute, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { TreatmentGuideService, CreateTreatmentGuideRequest } from '../treatment-guide.service';
import { DiseaseService } from '../../diseases/shared/disease.service';
import { ToastService } from '../../../../../shared/toast/toast.service';
import { Observable } from 'rxjs';

@Component({
  selector: 'app-treatment-guide-create',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    FormsModule
  ],
  templateUrl: './treatment-guide-create.component.html',
  styleUrls: ['./treatment-guide-create.component.scss']
})
export class TreatmentGuideCreateComponent implements OnInit {
  diseaseId: number | null = null;
  diseases: any[] = [];
  selectedDiseaseId: number | null = null;
  existingTreatmentGuides: any[] = [];
  isLoadingDiseases = false;
  isLoadingGuides = false;
  
  treatmentGuide = {
    stepNumber: 1,
    title: '',
    description: '',
    duration: '',
    frequency: '',
    materials: [''],
    notes: ''
  };

  constructor(
    private treatmentGuideService: TreatmentGuideService,
    private diseaseService: DiseaseService,
    private router: Router,
    private route: ActivatedRoute,
    private toastService: ToastService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit() {
    // Load danh sách diseases trước
    this.loadDiseases();
    
    // Lấy diseaseId từ route parameter nếu có
    this.route.params.subscribe(params => {
      if (params['diseaseId']) {
        this.diseaseId = +params['diseaseId'];
        this.selectedDiseaseId = this.diseaseId;
        // Load existing guides ngay lập tức nếu có diseaseId từ route
        setTimeout(() => {
          this.loadExistingGuides();
        }, 100);
      }
    });
  }

  loadDiseases() {
    this.isLoadingDiseases = true;
    this.diseaseService.getAllPlantDiseases(0, 100).subscribe({
      next: (response) => {
        // Handle different response structures - Updated for new API format
        let diseaseArray: any[] = [];
        
        if (response && response.data && response.data.content && Array.isArray(response.data.content)) {
          diseaseArray = response.data.content;
        } else if (response && response.content && Array.isArray(response.content)) {
          diseaseArray = response.content;
        } else if (response && response.data && Array.isArray(response.data)) {
          diseaseArray = response.data;
        } else if (Array.isArray(response)) {
          diseaseArray = response;
        } else {
          diseaseArray = [];
        }
        
        this.diseases = diseaseArray;
        this.isLoadingDiseases = false;
        this.cdr.detectChanges();
        
        console.log('🌿 Loaded diseases:', this.diseases.length);
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

  // Method để load hướng dẫn đã có
  loadExistingGuides() {
    if (!this.selectedDiseaseId) {
      this.existingTreatmentGuides = [];
      return;
    }

    this.isLoadingGuides = true;
    console.log('🔄 Loading guides for disease:', this.selectedDiseaseId);
    
    // Tìm tên bệnh đã chọn
    const selectedDisease = this.diseases.find(d => d.id === Number(this.selectedDiseaseId));
    if (selectedDisease) {
      console.log('🦠 Selected disease:', selectedDisease.diseaseName);
    }

    // Load existing treatment guides cho bệnh này
    this.treatmentGuideService.getTreatmentGuidesByDisease(this.selectedDiseaseId).subscribe({
      next: (response) => {
        console.log('📋 Existing treatment guides response:', response);
        
        // Parse response data
        if (response && response.data && Array.isArray(response.data)) {
          this.existingTreatmentGuides = response.data;
        } else if (response && Array.isArray(response)) {
          this.existingTreatmentGuides = response;
        } else {
          this.existingTreatmentGuides = [];
        }

        this.isLoadingGuides = false;
        console.log('📝 Found existing treatment guides:', this.existingTreatmentGuides.length);
        
        // Auto-suggest next step number
        this.suggestNextStepNumber();
        
        if (this.existingTreatmentGuides.length > 0) {
          console.log('⚠️ Existing guides to avoid duplication:');
          this.existingTreatmentGuides.forEach((guide, index) => {
            console.log(`   ${index + 1}. Step ${guide.stepNumber}: ${guide.title}`);
          });
          
          setTimeout(() => {
            this.toastService.info(`📋 Đã có ${this.existingTreatmentGuides.length} hướng dẫn cho bệnh này. Hãy kiểm tra để tránh trùng lặp!`);
          }, 300);
        } else {
          console.log('✅ No existing treatment guides found');
          setTimeout(() => {
            this.toastService.success('✅ Chưa có hướng dẫn nào cho bệnh này');
          }, 300);
        }
        
        // Trigger change detection
        this.cdr.detectChanges();
      },
      error: (error) => {
        console.error('❌ Error loading existing treatment guides:', error);
        this.existingTreatmentGuides = [];
        this.isLoadingGuides = false;
        this.cdr.detectChanges();
      }
    });
  }

  // Method để suggest step number tiếp theo
  suggestNextStepNumber() {
    if (this.existingTreatmentGuides.length === 0) {
      this.treatmentGuide.stepNumber = 1;
      return;
    }

    // Tìm step number cao nhất đã có
    const existingSteps = this.existingTreatmentGuides.map(guide => guide.stepNumber || 0);
    const maxStep = Math.max(...existingSteps);
    
    // Suggest step tiếp theo
    this.treatmentGuide.stepNumber = maxStep + 1;
    
    console.log(`💡 Suggested next step: ${this.treatmentGuide.stepNumber} (existing steps: ${existingSteps.join(', ')})`);
  }

  // Method để check xem step number có hợp lệ không
  isStepNumberValid(): boolean {
    const stepNum = Number(this.treatmentGuide.stepNumber);
    if (!stepNum || stepNum < 1) {
      return false;
    }

    // Check xem step này đã tồn tại chưa
    const existingSteps = this.existingTreatmentGuides.map(guide => guide.stepNumber || 0);
    return !existingSteps.includes(stepNum);
  }

  // Method để lấy danh sách step numbers đã có
  getExistingStepNumbers(): number[] {
    return this.existingTreatmentGuides.map(guide => guide.stepNumber || 0).sort((a, b) => a - b);
  }

  // Method để lấy step number tiếp theo được suggest
  getSuggestedNextStep(): number {
    const existingSteps = this.getExistingStepNumbers();
    return existingSteps.length > 0 ? Math.max(...existingSteps) + 1 : 1;
  }

  // Method được gọi khi user thay đổi dropdown
  onDiseaseChange() {
    console.log('� Disease dropdown changed:', this.selectedDiseaseId);
    this.loadExistingGuides();
  }

  addMaterial() {
    this.treatmentGuide.materials.push('');
  }

  removeMaterial(index: number) {
    if (this.treatmentGuide.materials.length > 1) {
      this.treatmentGuide.materials.splice(index, 1);
    }
  }

  trackByIndex(index: number): number {
    return index;
  }

  trackByDiseaseId(index: number, disease: any): number {
    return disease ? disease.id : index;
  }

  // Helper method for debugging
  debugObject(obj: any): string {
    return JSON.stringify(obj, null, 2);
  }

  onSubmit() {
    if (!this.selectedDiseaseId) {
      this.toastService.error('❌ Vui lòng chọn bệnh cây');
      return;
    }

    if (!this.treatmentGuide.title || !this.treatmentGuide.description || !this.treatmentGuide.duration || !this.treatmentGuide.frequency) {
      this.toastService.error('❌ Vui lòng điền đầy đủ thông tin bắt buộc');
      return;
    }

    // Validate step number
    const stepNum = Number(this.treatmentGuide.stepNumber);
    if (!stepNum || stepNum < 1) {
      this.toastService.error('❌ Vui lòng nhập số bước hợp lệ (>= 1)');
      return;
    }

    // Check step number validity
    if (!this.isStepNumberValid()) {
      const existingSteps = this.getExistingStepNumbers();
      this.toastService.error(`❌ Bước ${this.treatmentGuide.stepNumber} đã tồn tại! Các bước đã có: ${existingSteps.join(', ')}. Vui lòng chọn bước ${this.getSuggestedNextStep()}`);
      return;
    }

    // Filter out empty materials
    const materials = this.treatmentGuide.materials.filter(m => m.trim() !== '');
    
    // Tạo description chi tiết bao gồm thông tin step
    const detailedDescription = `Bước ${this.treatmentGuide.stepNumber}: ${this.treatmentGuide.title}

${this.treatmentGuide.description}

⏰ Thời gian thực hiện: ${this.treatmentGuide.duration}
🔁 Tần suất: ${this.treatmentGuide.frequency}
${materials.length > 0 ? `🧰 Vật liệu cần thiết: ${materials.join(', ')}` : ''}`;
    
    const treatmentGuideData = {
      title: this.treatmentGuide.title,
      description: detailedDescription,
      stepNumber: Number(this.treatmentGuide.stepNumber), // Đảm bảo là number
      notes: this.treatmentGuide.notes || `Hướng dẫn bước ${this.treatmentGuide.stepNumber} cho bệnh ID: ${this.selectedDiseaseId}`
    };

    console.log('🚀 Creating treatment guide for disease:', this.selectedDiseaseId);
    console.log('📋 Treatment guide data:', treatmentGuideData);
    console.log('🔢 Step number value:', this.treatmentGuide.stepNumber, 'Type:', typeof this.treatmentGuide.stepNumber);

    this.toastService.info('⏳ Đang tạo hướng dẫn điều trị...');

    this.treatmentGuideService.createTreatmentGuide(this.selectedDiseaseId, treatmentGuideData).subscribe({
      next: (response) => {
        console.log('✅ Treatment guide created:', response);
        this.toastService.success('✅ Tạo hướng dẫn điều trị thành công!');
        setTimeout(() => {
          this.router.navigate(['/expert/plant-manager/treatment-guides/list']);
        }, 1500);
      },
      error: (error) => {
        console.error('❌ Error creating treatment guide:', error);
        this.toastService.error('❌ Lỗi khi tạo hướng dẫn điều trị');
      }
    });
  }

  onCancel() {
    this.router.navigate(['/expert/plant-manager/treatment-guides/list']);
  }
}
