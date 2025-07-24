import { Injectable } from '@angular/core';
import { environment } from '../../environments/environment';

@Injectable({ providedIn: 'root' })
export class ConfigService {
  // Use readonly for environment
  private readonly env = environment;

  get isProduction(): boolean {
    return this.env.production;
  }

  get isDevelopment(): boolean {
    return !this.env.production;
  }

  get apiUrl(): string {
    return this.env.apiUrl;
  }

  get baseUrl(): string {
    return this.env.baseUrl;
  }

  // DRY endpoint builder
  private buildUrl(endpoint: string, id?: number | string): string {
    const url = id ? `${endpoint}/${id}` : endpoint;
    return this.isProduction ? `${this.apiUrl}${url}` : url;
  }

  getUserProfileUrl(userId: number): string {
    return this.buildUrl(this.env.endpoints.user.profile, userId);
  }

  getUserProfileUpdateUrl(): string {
    return this.buildUrl(this.env.endpoints.user.updateProfile);
  }

  getChangePasswordUrl(): string {
    return this.buildUrl(this.env.endpoints.user.changePassword);
  }

  getFullUrl(endpoint: string): string {
    if (this.isProduction) {
      return endpoint.startsWith('http') ? endpoint : `${this.baseUrl}${endpoint}`;
    }
    return endpoint;
  }

  // Dev logging helpers
  logApiCall(method: string, url: string, data?: unknown): void {
    if (this.isDevelopment) {
      console.log(`[API] ${method} ${url}`, data);
    }
  }

  logError(error: unknown, context?: string): void {
    if (this.isDevelopment) {
      console.error(`[ERROR]${context ? ' [' + context + ']' : ''}:`, error);
    }
  }

  logSuccess(message: string, data?: unknown): void {
    if (this.isDevelopment) {
      console.log(`[SUCCESS] ${message}`, data);
    }
  }
}
