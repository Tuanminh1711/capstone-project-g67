import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { Plant } from './plant-data.service';
import { CookieService } from '../../auth/cookie.service';

@Injectable({ providedIn: 'root' })
export class PlantDetailLoaderService {
  constructor(private http: HttpClient, private cookieService: CookieService) {}

  loadPlantDetail(plantId: string): Observable<Plant> {
    const token = this.cookieService.getAuthToken();
    const url = token ? `/api/plants/detail/${plantId}` : `/api/plants/${plantId}`;
    return this.http.get<any>(url).pipe(
      map(response => {
        const rawData = response?.data || response;
        if (!rawData?.id) throw new Error('Not found');
        return this.mapApiResponseToPlant(rawData);
      }),
      catchError(err => throwError(() => err))
    );
  }

  private mapApiResponseToPlant(apiData: any): Plant {
    return {
      id: apiData.id,
      scientificName: apiData.scientificName || '',
      commonName: apiData.commonName || '',
      categoryName: apiData.categoryName || apiData.category || '',
      description: apiData.description || '',
      careInstructions: apiData.careInstructions || '',
      lightRequirement: apiData.lightRequirement || '',
      waterRequirement: apiData.waterRequirement || '',
      careDifficulty: apiData.careDifficulty || '',
      suitableLocation: apiData.suitableLocation || '',
      commonDiseases: apiData.commonDiseases || '',
      status: apiData.status || 'ACTIVE',
      imageUrls: apiData.imageUrls || apiData.images || [],
      createdAt: apiData.createdAt || null
    };
  }
}
