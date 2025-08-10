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
}

export interface ArticleDetail {
  id: number;
  title: string;
  content: string;
  categoryName: string;
  status: string;
  createdAt: string;
  imageUrl?: string;
}

@Injectable({ providedIn: 'root' })
export class ArticlesService {
  private apiUrl = '/api/expert';

  constructor(private http: HttpClient) {}

  getArticles(page = 0, size = 10): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/get_list_articles?page=${page}&size=${size}`);
  }

  getArticleDetail(articleId: number): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/get_article_detail/${articleId}`);
  }

  // TODO: add create, update, delete, change status, upload image methods
}
