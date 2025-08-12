import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface Article {
  id: number;
  title: string;
  categoryName: string;
  status: string;
  createdAt: string;
  imageUrl?: string;
  imageUrls?: string[];
}

export interface ArticleDetail {
  id: number;
  title: string;
  content: string;
  categoryId?: number;
  categoryName: string;
  status: string;
  createdAt: string;
  authorUsername?: string;
  imageUrl?: string;
  imageUrls?: string[];
}

@Injectable({ providedIn: 'root' })
export class UserViewArticleService {
  private apiUrl = '/api/user';

  constructor(private http: HttpClient) {}

  getAllArticles(page = 0, size = 10): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/get_list_articles?page=${page}&size=${size}`);
  }

  getArticleDetail(articleId: number): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/detail/${articleId}`);
  }
}
