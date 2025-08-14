import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../../environments/environment';
import { 
  PlantDisease, 
  CreatePlantDiseaseRequest, 
  UpdatePlantDiseaseRequest,
  TreatmentGuide,
  CreateTreatmentGuideRequest,
  UpdateTreatmentGuideRequest 
} from './disease.model';

@Injectable({
  providedIn: 'root'
})
export class DiseaseService {
  private baseUrl = `${environment.apiUrl}/expert/disease-management`;

  constructor(private http: HttpClient) { }

  // Disease Management
  getAllPlantDiseases(page: number = 0, size: number = 10): Observable<any> {
    const params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString());
    return this.http.get(`${this.baseUrl}/diseases`, { params });
  }

  getPlantDiseaseById(id: number): Observable<any> {
    return this.http.get(`${this.baseUrl}/diseases/${id}`);
  }

  createPlantDisease(request: CreatePlantDiseaseRequest): Observable<any> {
    return this.http.post(`${this.baseUrl}/diseases`, request);
  }

  updatePlantDisease(id: number, request: UpdatePlantDiseaseRequest): Observable<any> {
    return this.http.put(`${this.baseUrl}/diseases/${id}`, request);
  }

  deletePlantDisease(id: number): Observable<any> {
    return this.http.delete(`${this.baseUrl}/diseases/${id}`);
  }

  // Treatment Guide Management
  getTreatmentGuidesByDisease(diseaseId: number): Observable<any> {
    return this.http.get(`${this.baseUrl}/diseases/${diseaseId}/treatment-guides`);
  }

  createTreatmentGuide(diseaseId: number, request: CreateTreatmentGuideRequest): Observable<any> {
    return this.http.post(`${this.baseUrl}/diseases/${diseaseId}/treatment-guides`, request);
  }

  updateTreatmentGuide(id: number, request: UpdateTreatmentGuideRequest): Observable<any> {
    return this.http.put(`${this.baseUrl}/treatment-guides/${id}`, request);
  }

  deleteTreatmentGuide(id: number): Observable<any> {
    return this.http.delete(`${this.baseUrl}/treatment-guides/${id}`);
  }
}
