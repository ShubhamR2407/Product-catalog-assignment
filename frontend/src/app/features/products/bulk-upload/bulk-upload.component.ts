import { Component, OnDestroy, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Subscription } from 'rxjs';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatIconModule } from '@angular/material/icon';
import { ProductService } from '../../../core/services/product.service';
import { JobService } from '../../../core/services/job.service';
import { Job } from '../../../core/models/models';

@Component({
  selector: 'app-bulk-upload',
  standalone: true,
  imports: [RouterLink, MatButtonModule, MatProgressBarModule, MatIconModule],
  template: `
    <h1>Bulk Upload Products</h1>
    <p class="hint">
      Upload a CSV file with columns <code>name,price,category</code>. The category must already exist —
      unknown categories are reported as row errors. Large files are processed in the background, so this
      page will keep polling for progress without timing out.
    </p>

    <div class="picker">
      <input type="file" accept=".csv" (change)="onFileSelected($event)" [disabled]="uploading()" />
      <button mat-raised-button color="primary" (click)="upload()" [disabled]="!selectedFile || uploading()">
        Upload
      </button>
    </div>

    @if (job(); as j) {
      <div class="status">
        <p>
          Status: <strong>{{ j.status }}</strong>
          @if (j.totalRows !== null) {
            ({{ j.processedRows }} / {{ j.totalRows }} rows processed)
          }
        </p>

        @if (j.status === 'pending' || j.status === 'processing') {
          <mat-progress-bar
            [mode]="j.totalRows ? 'determinate' : 'indeterminate'"
            [value]="progressPercent(j)"
          ></mat-progress-bar>
        }

        @if (j.status === 'completed') {
          <p class="summary success">
            <mat-icon>check_circle</mat-icon>
            {{ j.successRows }} row(s) imported successfully, {{ j.failedRows }} failed.
          </p>
        }

        @if (j.status === 'failed') {
          <p class="summary error"><mat-icon>error</mat-icon> Bulk upload failed.</p>
        }

        @if (j.errors.length > 0) {
          <table class="errors">
            <thead>
              <tr>
                <th>Row</th>
                <th>Error</th>
              </tr>
            </thead>
            <tbody>
              @for (e of j.errors; track $index) {
                <tr>
                  <td>{{ e.row }}</td>
                  <td>{{ e.message }}</td>
                </tr>
              }
            </tbody>
          </table>
        }

        @if (j.status === 'completed') {
          <a mat-button routerLink="/products">View products</a>
        }
      </div>
    }
  `,
  styles: [
    `
      .hint {
        max-width: 640px;
        opacity: 0.8;
      }
      .picker {
        display: flex;
        gap: 1rem;
        align-items: center;
        margin: 1rem 0;
      }
      .status {
        margin-top: 1.5rem;
        max-width: 640px;
      }
      .summary {
        display: flex;
        align-items: center;
        gap: 0.5rem;
      }
      .summary.success {
        color: #1e7d32;
      }
      .summary.error {
        color: #b3261e;
      }
      .errors {
        width: 100%;
        border-collapse: collapse;
        margin-top: 1rem;
      }
      .errors th,
      .errors td {
        text-align: left;
        padding: 0.4rem;
        border-bottom: 1px solid #e0e0e0;
        font-size: 0.9rem;
      }
    `,
  ],
})
export class BulkUploadComponent implements OnDestroy {
  private productService = inject(ProductService);
  private jobService = inject(JobService);

  selectedFile: File | null = null;
  uploading = signal(false);
  job = signal<Job | null>(null);
  private pollSub?: Subscription;

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.selectedFile = input.files?.[0] ?? null;
  }

  upload(): void {
    if (!this.selectedFile) return;
    this.uploading.set(true);
    this.job.set(null);

    this.productService.bulkUpload(this.selectedFile).subscribe({
      next: ({ jobId }) => {
        this.uploading.set(false);
        this.pollSub?.unsubscribe();
        this.pollSub = this.jobService.poll(jobId).subscribe((job) => this.job.set(job));
      },
      error: () => this.uploading.set(false),
    });
  }

  progressPercent(job: Job): number {
    if (!job.totalRows) return 0;
    return Math.round((job.processedRows / job.totalRows) * 100);
  }

  ngOnDestroy(): void {
    this.pollSub?.unsubscribe();
  }
}
