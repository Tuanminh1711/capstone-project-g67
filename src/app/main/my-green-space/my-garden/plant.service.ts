import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';

export interface Plant {
  id: string;
  name: string;
  image: string;
  description?: string;
  tags?: string[];
  [key: string]: any;
}

@Injectable({ providedIn: 'root' })
export class PlantService {
  constructor(private http: HttpClient) {}

  getMyPlants(): Observable<Plant[]> {
    return this.http.get<Plant[]>(`${environment.apiUrl}/my-plants`);
  }
}
