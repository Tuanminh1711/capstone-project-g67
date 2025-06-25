import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class JwtDebugService {

  constructor() { }

  /**
   * Debug JWT token - parse and log token information
   */
  debugToken(): void {
    if (typeof window === 'undefined' || typeof localStorage === 'undefined') {
      console.warn('🔒 debugToken: localStorage not available (running on server)');
      return;
    }
    
    const token = localStorage.getItem('token');
    
    if (!token) {
      console.warn('🔒 No token found in localStorage');
      return;
    }

    try {
      // Parse JWT token
      const parts = token.split('.');
      if (parts.length !== 3) {
        console.error('🔒 Invalid JWT format');
        return;
      }

      // Decode header and payload
      const header = JSON.parse(atob(parts[0]));
      const payload = JSON.parse(atob(parts[1]));

      console.group('🔒 JWT Token Debug');
      console.log('📝 Raw token:', `${token.substring(0, 50)}...`);
      console.log('📋 Header:', header);
      console.log('📋 Payload:', payload);
      
      // Check expiration
      if (payload.exp) {
        const expirationDate = new Date(payload.exp * 1000);
        const now = new Date();
        const isExpired = now > expirationDate;
        
        console.log('⏰ Expires at:', expirationDate.toLocaleString());
        console.log('⏰ Current time:', now.toLocaleString());
        console.log('⏰ Is expired:', isExpired ? '❌ YES' : '✅ NO');
        
        if (isExpired) {
          console.warn('⚠️ Token is expired!');
        }
      }
      
      // Check user info
      if (payload.sub || payload.userId || payload.id) {
        console.log('👤 User ID:', payload.sub || payload.userId || payload.id);
      }
      
      if (payload.username || payload.email) {
        console.log('👤 Username/Email:', payload.username || payload.email);
      }

      console.groupEnd();

    } catch (error) {
      console.error('🔒 Error parsing JWT token:', error);
    }
  }

  /**
   * Check if token is expired
   */
  isTokenExpired(): boolean {
    if (typeof window === 'undefined' || typeof localStorage === 'undefined') {
      return true; // Assume expired on server side
    }
    
    const token = localStorage.getItem('token');
    
    if (!token) {
      return true;
    }

    try {
      const parts = token.split('.');
      if (parts.length !== 3) {
        return true;
      }

      const payload = JSON.parse(atob(parts[1]));
      
      if (!payload.exp) {
        return false; // No expiration claim
      }

      const expirationDate = new Date(payload.exp * 1000);
      const now = new Date();
      
      return now > expirationDate;
    } catch (error) {
      return true;
    }
  }
}
