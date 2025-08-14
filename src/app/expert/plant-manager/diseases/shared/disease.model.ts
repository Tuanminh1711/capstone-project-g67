export interface PlantDisease {
  id: number;
  diseaseName: string;
  scientificName?: string;
  symptoms: string;
  causes: string;
  treatment?: string;
  prevention?: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  category: 'Nấm' | 'Vi khuẩn' | 'Virus' | 'Sinh lý' | 'Côn trùng';
  affectedPlantTypes?: string;
  imageUrl?: string;
  confidenceLevel?: string;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
  treatmentGuides?: TreatmentGuide[];
}

export interface TreatmentGuide {
  id?: number;
  stepNumber: number;
  title: string;
  description: string;
  duration: string;
  frequency: string;
  materials: string[];
  notes?: string;
}

export interface CreatePlantDiseaseRequest {
  diseaseName: string;
  scientificName?: string;
  symptoms: string;
  causes: string;
  treatment?: string;
  prevention?: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  category: 'Nấm' | 'Vi khuẩn' | 'Virus' | 'Sinh lý' | 'Côn trùng';
  affectedPlantTypes?: string;
  imageUrl?: string;
  confidenceLevel?: string;
}

export interface UpdatePlantDiseaseRequest extends CreatePlantDiseaseRequest {
  isActive: boolean;
}

export interface CreateTreatmentGuideRequest {
  stepNumber: number;
  title: string;
  description: string;
  duration: string;
  frequency: string;
  materials: string[];
  notes?: string;
}

export interface UpdateTreatmentGuideRequest extends CreateTreatmentGuideRequest {}
