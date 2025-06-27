import { Injectable } from '@angular/core';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class ConfigService {
  
  get isProduction(): boolean {
    return environment.production;
  }

  get isDevelopment(): boolean {
    return !environment.production;
  }

  get apiUrl(): string {
    return environment.apiUrl;
  }

  get baseUrl(): string {
    return environment.baseUrl;
  }

  // API Endpoints
  getUserProfileUrl(userId: number): string {
    if (environment.production) {
      return `${environment.apiUrl}${environment.endpoints.user.profile}/${userId}`;
    }
    return `${environment.endpoints.user.profile}/${userId}`;
  }

  getUserProfileUpdateUrl(): string {
    if (environment.production) {
      return `${environment.apiUrl}${environment.endpoints.user.updateProfile}`;
    }
    return environment.endpoints.user.updateProfile;
  }

  getChangePasswordUrl(): string {
    if (environment.production) {
      return `${environment.apiUrl}${environment.endpoints.user.changePassword}`;
    }
    return environment.endpoints.user.changePassword;
  }

  // Helper methods
  getFullUrl(endpoint: string): string {
    if (environment.production) {
      return endpoint.startsWith('http') ? endpoint : `${environment.baseUrl}${endpoint}`;
    }
    return endpoint;
  }

  logApiCall(method: string, url: string, data?: any): void {
    // API logging disabled for production
  }

  logError(error: any, context?: string): void {
    // Error logging disabled for production
  }

  logSuccess(message: string, data?: any): void {
    // Success logging disabled for production
  }
}
