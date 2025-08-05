import { Injectable } from '@angular/core';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class UrlService {
  
  /**
   * Get the base API URL based on current environment
   */
  getApiBaseUrl(): string {
    const hostname = window.location.hostname;
    
    if (hostname.includes('plantcare.id.vn')) {
      // Production domain
      return 'https://plantcare.id.vn';
    } else {
      // Local development - uses proxy
      return '';
    }
  }

  /**
   * Get full API URL for a given endpoint
   */
  getApiUrl(endpoint: string): string {
    const baseUrl = this.getApiBaseUrl();
    // Remove leading slash if present to avoid double slashes
    const cleanEndpoint = endpoint.startsWith('/') ? endpoint.substring(1) : endpoint;
    
    if (baseUrl) {
      return `${baseUrl}/${cleanEndpoint}`;
    } else {
      // For development, keep the original endpoint (proxy will handle)
      return `/${cleanEndpoint}`;
    }
  }

  /**
   * Get WebSocket URL
   */
  getWebSocketUrl(): string {
    const hostname = window.location.hostname;
    
    if (hostname.includes('plantcare.id.vn')) {
      // Production domain
      return 'https://plantcare.id.vn/ws-chat';
    } else {
      // Local development
      return '/ws-chat';
    }
  }

  /**
   * Check if running on production domain
   */
  isProductionDomain(): boolean {
    return window.location.hostname.includes('plantcare.id.vn');
  }

  /**
   * Check if in production mode (build config OR domain)
   */
  isProduction(): boolean {
    return environment.production || this.isProductionDomain();
  }
}
