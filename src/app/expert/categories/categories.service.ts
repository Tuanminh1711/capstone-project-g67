import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class ExpertService {
  constructor(private http: HttpClient) {}

  createCategory(data: { name: string; description: string }): Observable<any> {
    // Gửi đúng trường backend yêu cầu
    return this.http.post('/api/expert/create-category', {
      name: data.name,
      description: data.description
    });
  }

  listCategories(pageNo: number, pageSize: number): Observable<any> {
    return this.http.post('/api/expert/list_category', {});
  }

  updateCategory(categoryId: number, data: { name: string; description: string }): Observable<any> {
    // Map component fields to API fields
    const apiData = {
      categoryName: data.name,
      categoryDescription: data.description
    };
    return this.http.put(`/api/expert/update-category/${categoryId}`, apiData);
  }

  deleteCategory(categoryId: number): Observable<any> {
    return this.http.post(`/api/expert/delete-category/${categoryId}`, {});
  }
}
