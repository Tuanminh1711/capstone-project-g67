import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable, of, throwError } from 'rxjs';
import { catchError, retry, timeout } from 'rxjs/operators';
import { 
  DiseaseDetectionRequest,
  DiseaseDetectionResult,
  TreatmentGuide,
  TreatmentProgress,
  DiseaseStats,
  PlantDisease,
  DiseaseDetectionHistory
} from './disease-detection.model';
import { environment } from '../../../environments/environment';
import { CookieService } from '../../auth/cookie.service';

@Injectable({
  providedIn: 'root'
})
export class DiseaseDetectionService {
  private apiUrl = `${environment.apiUrl}/vip/disease-detection`; // Removed duplicate /api
  private isApiEnabled = true; // Enable API calls now that backend is configured

  constructor(private http: HttpClient, private cookieService: CookieService) { }

  /**
   * Get authentication headers
   */
  private getAuthHeaders(): HttpHeaders {
    const token = this.cookieService.getCookie('auth_token');
    return new HttpHeaders({
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    });
  }

  /**
   * Get authentication headers for FormData
   */
  private getAuthHeadersForFormData(): HttpHeaders {
    const token = this.cookieService.getCookie('auth_token');
    return new HttpHeaders({
      'Authorization': `Bearer ${token}`
      // Don't set Content-Type for FormData
    });
  }

  /**
   * Enable API calls when backend is ready
   */
  enableApi(): void {
    this.isApiEnabled = true;
  }

  /**
   * Disable API calls for testing/demo mode
   */
  disableApi(): void {
    this.isApiEnabled = false;
  }

  /**
   * Upload image for AI disease detection
   * @param image Image file
   * @param plantId Plant ID
   */
  detectDiseaseFromImage(image: File): Observable<DiseaseDetectionResult> {
    if (!this.isApiEnabled) {
      return throwError(() => new Error('API not available - using mock data'));
    }
    const formData = new FormData();
    formData.append('image', image);
    return this.http.post<DiseaseDetectionResult>(`${this.apiUrl}/detect-from-image`, formData, {
      headers: this.getAuthHeadersForFormData()
    })
      .pipe(
        timeout(30000), // 30 second timeout for image upload
        retry(1), // Retry once on failure
        catchError(this.handleError<DiseaseDetectionResult>('detectDiseaseFromImage'))
      );
  }

  /**
   * Analyze symptoms for disease detection
   * @param request Symptoms data
   */
  detectDiseaseFromSymptoms(request: DiseaseDetectionRequest): Observable<DiseaseDetectionResult> {
    if (!this.isApiEnabled) {
      return throwError(() => new Error('API not available - using mock data'));
    }
    
    return this.http.post<DiseaseDetectionResult>(`${this.apiUrl}/detect-from-symptoms`, request, {
      headers: this.getAuthHeaders()
    })
      .pipe(
        timeout(15000), // 15 second timeout
        retry(1), // Retry once on failure
        catchError(this.handleError<DiseaseDetectionResult>('detectDiseaseFromSymptoms'))
      );
  }

  /**
   * Get common diseases for plant type
   * @param plantType Type of plant
   */
  getCommonDiseases(plantType: string): Observable<PlantDisease[]> {
    if (!this.isApiEnabled) {
      return throwError(() => new Error('API not available - using mock data'));
    }
    
    const params = new HttpParams().set('plantType', plantType);
    return this.http.get<PlantDisease[]>(`${this.apiUrl}/common-diseases`, { 
      params,
      headers: this.getAuthHeaders()
    })
      .pipe(
        timeout(10000), // 10 second timeout
        retry(1), // Retry once on failure
        catchError(this.handleError<PlantDisease[]>('getCommonDiseases'))
      );
  }

  /**
   * Get treatment guide for specific disease
   * @param diseaseName Name of disease
   */
  getTreatmentGuide(diseaseName: string): Observable<TreatmentGuide> {
    if (!this.isApiEnabled) {
      return throwError(() => new Error('API not available - using mock data'));
    }
    
    const params = new HttpParams().set('diseaseName', diseaseName);
    const url = `${this.apiUrl}/treatment-guide`;
    
    console.log(`[DiseaseDetectionService] Calling treatment guide API:`, {
      url,
      diseaseName,
      fullUrl: `${this.apiUrl}/treatment-guide?diseaseName=${encodeURIComponent(diseaseName)}`
    });
    
    return this.http.get<TreatmentGuide>(url, { 
      params,
      headers: this.getAuthHeaders()
    })
      .pipe(
        timeout(15000), // 15 second timeout
        retry(1), // Retry once on failure
        catchError(this.handleError<TreatmentGuide>('getTreatmentGuide'))
      );
  }

  /**
   * Start tracking treatment progress
   * @param detectionId Detection ID
   */
  trackTreatmentProgress(detectionId: number): Observable<TreatmentProgress> {
    return this.http.post<TreatmentProgress>(`${this.apiUrl}/track-treatment/${detectionId}`, {});
  }

  /**
   * Update treatment progress
   * @param detectionId Detection ID
   * @param update Update data
   */
  updateTreatmentProgress(detectionId: number, update: any): Observable<TreatmentProgress> {
    return this.http.put<TreatmentProgress>(`${this.apiUrl}/update-treatment/${detectionId}`, update);
  }

  /**
   * Complete treatment
   * @param detectionId Detection ID
   * @param result Treatment result
   * @param successRate Success rate
   */
  completeTreatment(detectionId: number, result: string, successRate: number): Observable<TreatmentProgress> {
    const params = new HttpParams()
      .set('result', result)
      .set('successRate', successRate.toString());
    
    return this.http.post<TreatmentProgress>(
      `${this.apiUrl}/complete-treatment/${detectionId}`, 
      null, 
      { params }
    );
  }

  /**
   * Get disease detection history
   * @param page Page number
   * @param size Page size
   */
  getDetectionHistory(page: number = 0, size: number = 10): Observable<DiseaseDetectionHistory> {
    if (!this.isApiEnabled) {
      return throwError(() => new Error('API not available - using mock data'));
    }
    
    const params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString());
    
    return this.http.get<DiseaseDetectionHistory>(`${this.apiUrl}/history`, { 
      params,
      headers: this.getAuthHeaders()
    })
      .pipe(
        timeout(10000), // 10 second timeout
        retry(1), // Retry once on failure
        catchError(this.handleError<DiseaseDetectionHistory>('getDetectionHistory'))
      );
  }

  /**
   * Get disease statistics
   */
  getDiseaseStats(): Observable<DiseaseStats> {
    return this.http.get<DiseaseStats>(`${this.apiUrl}/stats`);
  }

  /**
   * Confirm or reject detection result
   * @param detectionId Detection ID
   * @param isConfirmed Confirmation status
   * @param expertNotes Expert notes
   */
  confirmDetection(detectionId: number, isConfirmed: boolean, expertNotes?: string): Observable<any> {
    let params = new HttpParams().set('isConfirmed', isConfirmed.toString());
    
    if (expertNotes) {
      params = params.set('expertNotes', expertNotes);
    }
    
    return this.http.post<any>(`${this.apiUrl}/confirm/${detectionId}`, null, { params });
  }

  /**
   * Search diseases by keyword
   * @param keyword Search keyword
   */
  searchDiseases(keyword: string): Observable<PlantDisease[]> {
    const params = new HttpParams().set('keyword', keyword);
    return this.http.get<PlantDisease[]>(`${this.apiUrl}/search`, { 
      params,
      headers: this.getAuthHeaders()
    });
  }

  /**
   * Get diseases by category
   * @param category Disease category
   */
  getDiseasesByCategory(category: string): Observable<PlantDisease[]> {
    const params = new HttpParams().set('category', category);
    return this.http.get<PlantDisease[]>(`${this.apiUrl}/by-category`, { 
      params,
      headers: this.getAuthHeaders()
    });
  }

  /**
   * Get diseases by severity
   * @param severity Disease severity
   */
  getDiseasesBySeverity(severity: string): Observable<PlantDisease[]> {
    const params = new HttpParams().set('severity', severity);
    return this.http.get<PlantDisease[]>(`${this.apiUrl}/by-severity`, { 
      params,
      headers: this.getAuthHeaders()
    });
  }

  /**
   * Get disease by ID
   * @param diseaseId Disease ID
   */
  getDiseaseById(diseaseId: number): Observable<PlantDisease> {
    return this.http.get<PlantDisease>(`${this.apiUrl}/${diseaseId}`, {
      headers: this.getAuthHeaders()
    });
  }

  /**
   * Format severity for display
   * @param severity Severity level
   */
  formatSeverity(severity: string): string {
    switch(severity.toUpperCase()) {
      case 'LOW': return 'Thấp';
      case 'MEDIUM': return 'Trung bình';
      case 'HIGH': return 'Cao';
      default: return severity;
    }
  }

  /**
   * Handle HTTP errors and JSON parsing issues
   * @param operation Name of the operation
   */
  private handleError<T>(operation = 'operation') {
    return (error: any): Observable<T> => {
      console.error(`${operation} failed:`, error);
      
      // Check if this is a JSON parsing error
      if (error.message && error.message.includes('JSON')) {
        console.log(`JSON parsing error in ${operation}, returning fallback error`);
        return throwError(() => new Error(`JSON parsing error in ${operation}`));
      }
      
      // Check for network errors
      if (error.status === 0 || error.status === 404) {
        console.log(`Network error in ${operation}, returning fallback error`);
        return throwError(() => new Error(`Network error in ${operation}`));
      }
      
      // Check for server errors
      if (error.status >= 500) {
        console.log(`Server error in ${operation}, returning fallback error`);
        return throwError(() => new Error(`Server error in ${operation}`));
      }
      
      // Check for timeout errors
      if (error.name === 'TimeoutError' || error.message?.includes('timeout')) {
        console.log(`Timeout error in ${operation}, returning fallback error`);
        return throwError(() => new Error(`Timeout error in ${operation}`));
      }
      
      // For other HTTP errors, pass them through
      return throwError(() => error);
    };
  }

  /**
   * Get severity class for UI
   * @param severity Severity level
   */
  getSeverityClass(severity: string): string {
    switch(severity.toUpperCase()) {
      case 'LOW': return 'severity-low';
      case 'MEDIUM': return 'severity-medium';
      case 'HIGH': return 'severity-high';
      default: return '';
    }
  }

  /**
   * Format date for display
   * @param timestamp Unix timestamp
   */
  formatDate(timestamp: number): string {
    if (!timestamp) return 'N/A';
    const date = new Date(timestamp);
    return `${date.getDate()}/${date.getMonth() + 1}/${date.getFullYear()} ${date.getHours()}:${date.getMinutes().toString().padStart(2, '0')}`;
  }

  /**
   * Search diseases by description (GET)
   * @param keyword Description or keyword to search
   */
  searchDiseasesByDescription(keyword: string): Observable<PlantDisease[]> {
    return this.http.get<PlantDisease[]>(`${this.apiUrl}/search`, { 
      params: { keyword },
      headers: this.getAuthHeaders()
    })
      .pipe(
        timeout(10000),
        catchError(this.handleError<PlantDisease[]>('searchDiseasesByDescription'))
      );
  }
}
