export interface PlantDisease {
  id: number;
  diseaseName: string;
  scientificName?: string;
  description?: string; // Add this field
  symptoms: string;
  causes: string;
  treatment?: string;
  prevention?: string;
  preventionMethods?: string; // Add this field
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  category: 'Nấm' | 'Vi khuẩn' | 'Virus' | 'Sinh lý' | 'Côn trùng';
  affectedPlantTypes?: string;
  imageUrl?: string;
  images?: string[]; // Add this field
  plants?: any[]; // Add this field
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
  content?: string; // Add this field for edit component
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
  content?: string; // Add this field
  duration: string;
  frequency: string;
  materials: string[];
  notes?: string;
}

export interface UpdateTreatmentGuideRequest extends CreateTreatmentGuideRequest {}
