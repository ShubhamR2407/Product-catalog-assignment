import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { API_BASE_URL } from '../config';
import { User } from '../models/models';

@Injectable({ providedIn: 'root' })
export class UserService {
  private http = inject(HttpClient);
  private base = `${API_BASE_URL}/users`;

  list(): Observable<User[]> {
    return this.http.get<User[]>(this.base);
  }

  get(id: string): Observable<User> {
    return this.http.get<User>(`${this.base}/${id}`);
  }

  create(data: { email: string; password: string }): Observable<User> {
    return this.http.post<User>(this.base, data);
  }

  update(id: string, data: { email?: string; password?: string }): Observable<User> {
    return this.http.put<User>(`${this.base}/${id}`, data);
  }

  remove(id: string): Observable<void> {
    return this.http.delete<void>(`${this.base}/${id}`);
  }
}
