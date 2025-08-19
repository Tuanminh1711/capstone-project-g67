import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

@Injectable({
  providedIn: 'root'
})
export class ResponseHandlerService {

  constructor(private http: HttpClient) {}

  /**
   * Gửi POST request và xử lý response có thể là text hoặc JSON
   */
  postWithFlexibleResponse<T = any>(
    url: string, 
    body: any, 
    options: any = {}
  ): Observable<ApiResponse<T>> {
    
    // Thử với responseType: 'text' trước
    return this.http.post(url, body, { ...options, responseType: 'text' }).pipe(
      map((response: string | ArrayBuffer) => {
        // Convert ArrayBuffer to string if needed
        let responseText: string;
        if (response instanceof ArrayBuffer) {
          responseText = new TextDecoder().decode(response);
        } else {
          responseText = response;
        }
        
        try {
          // Cố gắng parse thành JSON
          const jsonResponse = JSON.parse(responseText);
          return {
            success: true,
            data: jsonResponse,
            message: responseText
          };
        } catch (e) {
          // Nếu không parse được JSON, trả về text
          return {
            success: true,
            data: responseText as any,
            message: responseText
          };
        }
      }),
      catchError(error => {
        console.warn('POST request failed, returning error response:', error);
        return of({
          success: false,
          error: error.message || 'Request failed',
          message: error.message || 'Request failed'
        });
      })
    );
  }

  /**
   * Gửi GET request và xử lý response có thể là text hoặc JSON
   */
  getWithFlexibleResponse<T = any>(
    url: string, 
    options: any = {}
  ): Observable<ApiResponse<T>> {
    
    return this.http.get(url, { ...options, responseType: 'text' }).pipe(
      map((response: string | ArrayBuffer) => {
        // Convert ArrayBuffer to string if needed
        let responseText: string;
        if (response instanceof ArrayBuffer) {
          responseText = new TextDecoder().decode(response);
        } else {
          responseText = response;
        }
        
        try {
          // Cố gắng parse thành JSON
          const jsonResponse = JSON.parse(responseText);
          return {
            success: true,
            data: jsonResponse,
            message: responseText
          };
        } catch (e) {
          // Nếu không parse được JSON, trả về text
          return {
            success: true,
            data: responseText as any,
            message: responseText
          };
        }
      }),
      catchError(error => {
        console.warn('GET request failed, returning error response:', error);
        return of({
          success: false,
          error: error.message || 'Request failed',
          message: error.message || 'Request failed'
        });
      })
    );
  }

  /**
   * Xử lý response text thành object có cấu trúc
   */
  parseTextResponse(text: string): ApiResponse {
    // Kiểm tra nếu text chứa thông tin thành công
    if (text.toLowerCase().includes('success') || 
        text.toLowerCase().includes('marked') || 
        text.toLowerCase().includes('read')) {
      return {
        success: true,
        message: text,
        data: { message: text }
      };
    }
    
    // Kiểm tra nếu text chứa thông tin lỗi
    if (text.toLowerCase().includes('error') || 
        text.toLowerCase().includes('failed') || 
        text.toLowerCase().includes('invalid')) {
      return {
        success: false,
        error: text,
        message: text
      };
    }
    
    // Mặc định coi như thành công
    return {
      success: true,
      message: text,
      data: { message: text }
    };
  }
}
