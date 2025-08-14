import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, FormArray, Validators } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatSelectModule } from '@angular/material/select';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { DiseaseService } from '../shared/disease.service';
import { MatCardModule } from '@angular/material/card';
import { ToastService } from '../../../../shared/toast/toast.service';
import { MatChipsModule } from '@angular/material/chips';
import { COMMA, ENTER } from '@angular/cdk/keycodes';
import { MatChipInputEvent } from '@angular/material/chips';
import { PlantDisease, UpdatePlantDiseaseRequest, TreatmentGuide } from '../shared/disease.model';

@Component({
  selector: 'app-edit-disease',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatProgressBarModule,
    MatCardModule,
    MatSelectModule,
    MatChipsModule
  ],
  templateUrl: './edit-disease.component.html',
  styleUrls: ['./edit-disease.component.scss']
})
export class EditDiseaseComponent implements OnInit {
  diseaseForm: FormGroup;
  disease?: PlantDisease;
  loading = false;
  readonly separatorKeysCodes = [ENTER, COMMA];

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    private diseaseService: DiseaseService,
    private toastService: ToastService
  ) {
    this.diseaseForm = this.fb.group({
      diseaseName: ['', Validators.required],
      scientificName: [''],
      category: ['', Validators.required],
      symptoms: ['', Validators.required],
      causes: ['', Validators.required],
      treatment: ['', Validators.required],
      prevention: ['', Validators.required],
      severity: ['MEDIUM', Validators.required],
      affectedPlantTypes: [''],
      treatmentGuides: this.fb.array([])
    });
  }

  private initializeForm(): void {
    this.diseaseForm = this.fb.group({
      diseaseName: ['', Validators.required],
      scientificName: [''],
      category: ['', Validators.required],
      symptoms: ['', Validators.required],
      causes: ['', Validators.required],
      treatment: ['', Validators.required],
      prevention: ['', Validators.required],
      severity: ['MEDIUM', Validators.required],
      affectedPlantTypes: [''],
      treatmentGuides: this.fb.array([])
    });
  }

  ngOnInit(): void {
    const id = this.route.snapshot.params['id'];
    if (id) {
      this.loadDisease(id);
    }
  }

  get treatmentGuides(): FormArray {
    return this.diseaseForm.get('treatmentGuides') as FormArray;
  }

  private createTreatmentGuide(guide?: TreatmentGuide): FormGroup {
    return this.fb.group({
      stepNumber: [guide?.stepNumber || this.treatmentGuides.length + 1],
      title: [guide?.title || '', Validators.required],
      description: [guide?.description || '', Validators.required],
      duration: [guide?.duration || ''],
      frequency: [guide?.frequency || ''],
      materials: [guide?.materials || []],
      notes: [guide?.notes || '']
    });
  }

  loadDisease(id: string): void {
    this.loading = true;
    this.diseaseService.getPlantDiseaseById(parseInt(id, 10)).subscribe({
      next: (response: { data: PlantDisease }) => {
        this.disease = response.data;
        this.diseaseForm.patchValue({
          diseaseName: response.data.diseaseName,
          scientificName: response.data.scientificName,
          category: response.data.category,
          symptoms: response.data.symptoms,
          causes: response.data.causes,
          treatment: response.data.treatment,
          prevention: response.data.prevention,
          severity: response.data.severity || 'MEDIUM',
          affectedPlantTypes: response.data.affectedPlantTypes
        });

        // Khởi tạo treatment guides
        if (response.data.treatmentGuides?.length) {
          const guidesArray = this.diseaseForm.get('treatmentGuides') as FormArray;
          response.data.treatmentGuides.forEach(guide => {
            guidesArray.push(this.createTreatmentGuide(guide));
          });
        }

        this.loading = false;
      },
      error: (error: Error) => {
        console.error('Error loading disease:', error);
        this.toastService.error('Lỗi khi tải thông tin bệnh cây');
        this.loading = false;
      }
    });
  }

  addTreatmentGuide(): void {
    this.treatmentGuides.push(this.createTreatmentGuide());
  }

  removeTreatmentGuide(index: number): void {
    this.treatmentGuides.removeAt(index);
    // Cập nhật lại số thứ tự
    this.treatmentGuides.controls.forEach((control, idx) => {
      control.patchValue({ stepNumber: idx + 1 });
    });
  }

  addMaterial(guideIndex: number, event: MatChipInputEvent): void {
    const value = (event.value || '').trim();
    if (value) {
      const guide = this.treatmentGuides.at(guideIndex);
      const materials = [...guide.get('materials')?.value || []];
      materials.push(value);
      guide.patchValue({ materials });
    }
    event.chipInput!.clear();
  }

  removeMaterial(guideIndex: number, material: string): void {
    const guide = this.treatmentGuides.at(guideIndex);
    const materials = guide.get('materials')?.value.filter((m: string) => m !== material);
    guide.patchValue({ materials });
  }

  onSubmit(): void {
    if (this.diseaseForm.valid && this.disease) {
      this.loading = true;
      const formValue = this.diseaseForm.value;

      // 1. Cập nhật thông tin bệnh
      const updateRequest: UpdatePlantDiseaseRequest = {
        diseaseName: formValue.diseaseName,
        scientificName: formValue.scientificName,
        category: formValue.category,
        symptoms: formValue.symptoms,
        causes: formValue.causes,
        treatment: formValue.treatment,
        prevention: formValue.prevention,
        severity: formValue.severity,
        affectedPlantTypes: formValue.affectedPlantTypes,
        imageUrl: this.disease.imageUrl,
        confidenceLevel: this.disease.confidenceLevel,
        isActive: true // Đảm bảo luôn có giá trị cho isActive
      };

      // 2. Gọi API cập nhật bệnh
      this.diseaseService.updatePlantDisease(this.disease.id, updateRequest).subscribe({
        next: (response) => {
          // 3. Nếu có treatment guides, cập nhật chúng
          const guides = this.treatmentGuides.value.map((guide: any, index: number) => ({
            stepNumber: index + 1,
            title: guide.title,
            description: guide.description,
            duration: guide.duration,
            frequency: guide.frequency,
            materials: guide.materials || [],
            notes: guide.notes
          }));

          // TODO: Khi có API endpoint cho treatment guides, uncomment đoạn code sau
          // if (guides.length > 0) {
          //   this.diseaseService.updateTreatmentGuides(this.disease.id, guides).subscribe();
          // }

          // Hiển thị thông báo thành công
          this.showToastAndNavigate('Cập nhật thành công', true);
        },
        error: (error: any) => {
          console.error('Error updating disease:', error);
          
          // Lấy message từ API nếu có, nếu không dùng message mặc định
          const errorMessage = error.error?.message || 'Lỗi khi cập nhật bệnh cây';
          this.showToastAndNavigate(errorMessage, false);
        },
        complete: () => {
          setTimeout(() => {
            this.loading = false;
          });
        }
      });
    }
  }

  /**
   * Hiển thị thông báo và điều hướng về trang danh sách
   * @param message Nội dung thông báo
   * @param success True nếu thành công, False nếu thất bại
   */
  private showToastAndNavigate(message: string, success: boolean): void {
    // Hiển thị toast với style tương ứng
    if (success) {
      this.toastService.success(message);
    } else {
      this.toastService.error(message);
    }

    // Điều hướng về trang danh sách sau khi hiển thị thông báo
    setTimeout(() => {
      this.router.navigate(['list'], { relativeTo: this.route.parent });
    }, 1000); // Đợi 1 giây để người dùng kịp đọc thông báo
  }
}
