import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, timer } from 'rxjs';
import { switchMap, takeWhile } from 'rxjs/operators';
import { API_BASE_URL } from '../config';
import { Job } from '../models/models';

@Injectable({ providedIn: 'root' })
export class JobService {
  private http = inject(HttpClient);
  private base = `${API_BASE_URL}/jobs`;

  get(id: string): Observable<Job> {
    return this.http.get<Job>(`${this.base}/${id}`);
  }

  downloadUrl(id: string): string {
    return `${this.base}/${id}/download`;
  }

  /** Emits the job every 1.5s (plus an immediate first check) until it reaches a terminal status. */
  poll(id: string): Observable<Job> {
    return timer(0, 1500).pipe(
      switchMap(() => this.get(id)),
      takeWhile((job) => job.status === 'pending' || job.status === 'processing', true)
    );
  }
}
