export interface DiseaseDetectionRequest {
  plantId?: number;
  symptoms?: string[];
  description?: string;
}

export interface DiseaseDetectionResult {
  detectionId: number;
  detectedDisease: string;
  confidenceScore: number;
  severity: string;
  description: string;
  recommendations: string[];
  imageUrl?: string;
  createdAt: number;
  plantName: string;
  plantId: number;
}

export interface TreatmentGuide {
  diseaseId: number;
  diseaseName: string;
  organicTreatments: string[];
  chemicalTreatments: string[];
  preventiveMeasures: string[];
  estimatedRecoveryTime: string;
  severity: string;
  description: string;
}

export interface TreatmentProgress {
  id: number;
  detectionId: number;
  currentStatus: 'STARTED' | 'IN_PROGRESS' | 'COMPLETED';
  successRate?: number;
  startDate: number;
  completionDate?: number;
  notes?: string;
  treatments: string[];
}

export interface DiseaseStats {
  totalDetections: number;
  commonDiseases: {
    diseaseName: string;
    count: number;
    percentage: number;
  }[];
  severityDistribution: {
    low: number;
    medium: number;
    high: number;
  };
  successfulTreatments: number;
  pendingTreatments: number;
}

export interface PlantDisease {
  id: number;
  name: string;
  scientificName: string;
  description: string;
  symptoms: string[];
  causes: string[];
  category: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH';
  imageUrl?: string;
}

export interface DiseaseDetectionHistory {
  content: DiseaseDetectionResult[];
  totalElements: number;
  totalPages: number;
  currentPage: number;
}
