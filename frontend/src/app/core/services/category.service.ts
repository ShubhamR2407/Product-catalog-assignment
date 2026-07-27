import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { API_BASE_URL } from '../config';
import { Category } from '../models/models';

@Injectable({ providedIn: 'root' })
export class CategoryService {
  private http = inject(HttpClient);
  private base = `${API_BASE_URL}/categories`;

  list(search?: string): Observable<Category[]> {
    return this.http.get<Category[]>(this.base, { params: search ? { search } : {} });
  }

  get(id: string): Observable<Category> {
    return this.http.get<Category>(`${this.base}/${id}`);
  }

  create(data: { name: string }): Observable<Category> {
    return this.http.post<Category>(this.base, data);
  }

  update(id: string, data: { name?: string }): Observable<Category> {
    return this.http.put<Category>(`${this.base}/${id}`, data);
  }

  remove(id: string): Observable<void> {
    return this.http.delete<void>(`${this.base}/${id}`);
  }
}
