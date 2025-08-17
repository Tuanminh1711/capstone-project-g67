import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ConfigService } from '../../../shared/services/config.service';

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
  private readonly API_PATH = '/api/user_articles';

  constructor(
    private http: HttpClient,
    private configService: ConfigService
  ) {}

  getAllArticles(page = 0, size = 10): Observable<any> {
    const url = this.configService.getFullUrl(`${this.API_PATH}/get_list_articles?page=${page}&size=${size}`);
    return this.http.get<any>(url, { withCredentials: true });
  }

  getArticleDetail(articleId: number): Observable<any> {
    const url = this.configService.getFullUrl(`${this.API_PATH}/detail/${articleId}`);
    return this.http.get<any>(url);
  }
}
