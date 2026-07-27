import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { API_BASE_URL } from '../config';
import { Paginated, Product } from '../models/models';

export interface ProductListQuery {
  page: number;
  limit: number;
  sortBy?: 'price';
  order?: 'asc' | 'desc';
  search?: string;
  categoryId?: string;
}

@Injectable({ providedIn: 'root' })
export class ProductService {
  private http = inject(HttpClient);
  private base = `${API_BASE_URL}/products`;

  list(query: ProductListQuery): Observable<Paginated<Product>> {
    const params: Record<string, string> = {
      page: String(query.page),
      limit: String(query.limit),
      order: query.order ?? 'desc',
    };
    if (query.sortBy) params['sortBy'] = query.sortBy;
    if (query.search) params['search'] = query.search;
    if (query.categoryId) params['categoryId'] = query.categoryId;
    return this.http.get<Paginated<Product>>(this.base, { params });
  }

  get(id: string): Observable<Product> {
    return this.http.get<Product>(`${this.base}/${id}`);
  }

  create(formData: FormData): Observable<Product> {
    return this.http.post<Product>(this.base, formData);
  }

  update(id: string, formData: FormData): Observable<Product> {
    return this.http.put<Product>(`${this.base}/${id}`, formData);
  }

  remove(id: string): Observable<void> {
    return this.http.delete<void>(`${this.base}/${id}`);
  }

  bulkDelete(ids: string[]): Observable<{ deletedCount: number }> {
    return this.http.post<{ deletedCount: number }>(`${this.base}/bulk-delete`, { ids });
  }

  bulkDeleteAll(filter: { search?: string; categoryId?: string }): Observable<{ deletedCount: number }> {
    return this.http.post<{ deletedCount: number }>(`${this.base}/bulk-delete`, { all: true, ...filter });
  }

  bulkUpload(file: File): Observable<{ jobId: string; status: string }> {
    const formData = new FormData();
    formData.append('file', file);
    return this.http.post<{ jobId: string; status: string }>(`${this.base}/bulk-upload`, formData);
  }

  requestReport(params: {
    format: 'csv' | 'xlsx';
    categoryId?: string;
    search?: string;
  }): Observable<{ jobId: string; status: string }> {
    return this.http.post<{ jobId: string; status: string }>(`${this.base}/reports`, params);
  }
}
