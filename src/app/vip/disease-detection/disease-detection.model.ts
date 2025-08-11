export interface DiseaseDetectionHistoryItem {
  id: number;
  detectedDisease: string;
  confidenceScore: number;
  severity: string;
  symptoms: string;
  recommendedTreatment?: string | null;
  status: string;
  isConfirmed: boolean;
  expertNotes?: string | null;
  detectedAt: number;
  treatedAt?: number | null;
  treatmentResult?: string | null;
  detectionMethod: string;
  aiModelVersion: string;
}
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
  diseaseName: string;
  severity: string;
  steps: TreatmentStep[];
  requiredProducts: string[];
  estimatedDuration: string;
  successRate: string;
  precautions: string[];
  followUpSchedule: string;
  expertNotes: string;
}

export interface TreatmentStep {
  stepNumber: number;
  title: string;
  description: string;
  duration: string;
  frequency: string;
  materials: string[];
  notes: string | null;
  isCompleted: boolean;
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
