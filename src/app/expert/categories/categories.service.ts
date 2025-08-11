import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class ExpertService {
  constructor(private http: HttpClient) {}

  createCategory(data: { name: string; description: string }): Observable<any> {
    return this.http.post('/api/expert/create-category', data);
  }

  listCategories(pageNo: number, pageSize: number): Observable<any> {
    return this.http.post('/api/expert/list_category', {}, {
      params: { pageNo, pageSize }
    });
  }

  updateCategory(categoryId: number, data: { name: string; description: string }): Observable<any> {
    return this.http.put(`/api/expert/update-category/${categoryId}`, data);
  }

  deleteCategory(categoryId: number): Observable<any> {
    return this.http.post(`/api/expert/delete-category/${categoryId}`, {});
  }
}
