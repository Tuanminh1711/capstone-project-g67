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
  categoryId?: number; // Optional since some APIs might not return it
  categoryName: string;
  status: string;
  createdAt: string;
  imageUrl?: string;
}

export interface CreateArticleRequest {
  title: string;
  content: string;
  categoryId: number;
}

export interface ImageUpdate {
  imageUrl: string;  // Đổi từ url thành imageUrl cho khớp với backend
  action: 'ADD' | 'REMOVE' | 'KEEP';
}

export interface UpdateArticleRequest {
  title: string;
  content: string;
  categoryId: number;
  status: string;
  imageUpdates?: ImageUpdate[];
  imageUrls?: string[];
}

export interface ChangeArticleStatusRequest {
  status: string;
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

  // Lấy danh sách chuyên mục
  listCategories(pageNo: number, pageSize: number): Observable<any> {
    return this.http.post(`${this.apiUrl}/list_category`, {}, {
      params: { pageNo, pageSize }
    });
  }

  // Tạo bài viết mới
  createArticle(data: CreateArticleRequest): Observable<any> {
    return this.http.post(`${this.apiUrl}/create-article`, data);
  }

  // Cập nhật bài viết
  updateArticle(articleId: number, data: UpdateArticleRequest): Observable<any> {
    return this.http.put(`${this.apiUrl}/update-article/${articleId}`, data);
  }

  // Thay đổi trạng thái bài viết
  changeArticleStatus(articleId: number, status: string): Observable<any> {
    const data: ChangeArticleStatusRequest = { status };
    const url = `${this.apiUrl}/change-article-status/${articleId}`;
    console.log('ChangeArticleStatus API call:', {
      url: url,
      method: 'PATCH',
      data: data,
      articleId: articleId,
      status: status
    });
    return this.http.patch(url, data);
  }

  // Upload ảnh bài viết
  uploadArticleImage(file: File): Observable<any> {
    const formData = new FormData();
    formData.append('image', file);
    return this.http.post(`${this.apiUrl}/upload-article-image`, formData);
  }
}
