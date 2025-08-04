export interface UserReport {
  reportId: number;
  plantId: number;
  plantName: string;
  scientificName: string;
  reason: string;
  status: ReportStatus;
  adminNotes?: string;
  createdAt: number;
  handledAt?: number;
  handledBy?: string;
}

export interface UserReportListResponse {
  reports: UserReport[];
  totalElements: number;
  totalPages: number;
  currentPage: number;
  pageSize: number;
}

export enum ReportStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED', 
  REJECTED = 'REJECTED',
  IN_PROGRESS = 'IN_PROGRESS',
  CLAIMED = 'CLAIMED'
}

export interface ReportFilter {
  status?: string;
  page: number;
  size: number;
}
