import { Component, OnDestroy, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatInputModule } from '@angular/material/input';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatIconModule } from '@angular/material/icon';
import { ProductService } from '../../../core/services/product.service';
import { JobService } from '../../../core/services/job.service';
import { CategoryService } from '../../../core/services/category.service';
import { Category, Job } from '../../../core/models/models';

@Component({
  selector: 'app-reports',
  standalone: true,
  imports: [
    FormsModule,
    MatButtonModule,
    MatFormFieldModule,
    MatSelectModule,
    MatInputModule,
    MatProgressBarModule,
    MatIconModule,
  ],
  template: `
    <h1>Product Reports</h1>
    <p class="hint">
      Generate a downloadable product report. Generation happens in the background so this page keeps
      polling for progress without timing out, even for large catalogs.
    </p>

    <div class="filters">
      <mat-form-field appearance="outline">
        <mat-label>Format</mat-label>
        <mat-select [(ngModel)]="format">
          <mat-option value="csv">CSV</mat-option>
          <mat-option value="xlsx">XLSX</mat-option>
        </mat-select>
      </mat-form-field>

      <mat-form-field appearance="outline">
        <mat-label>Category (optional)</mat-label>
        <mat-select [(ngModel)]="categoryId">
          <mat-option [value]="undefined">All categories</mat-option>
          @for (category of categories(); track category.id) {
            <mat-option [value]="category.id">{{ category.name }}</mat-option>
          }
        </mat-select>
      </mat-form-field>

      <mat-form-field appearance="outline">
        <mat-label>Search (optional)</mat-label>
        <input matInput [(ngModel)]="search" />
      </mat-form-field>

      <button mat-raised-button color="primary" (click)="generate()" [disabled]="generating()">
        Generate Report
      </button>
    </div>

    @if (job(); as j) {
      <div class="status">
        <p>
          Status: <strong>{{ j.status }}</strong>
          @if (j.totalRows !== null) {
            ({{ j.processedRows }} / {{ j.totalRows }} rows)
          }
        </p>

        @if (j.status === 'pending' || j.status === 'processing') {
          <mat-progress-bar
            [mode]="j.totalRows ? 'determinate' : 'indeterminate'"
            [value]="progressPercent(j)"
          ></mat-progress-bar>
        }

        @if (j.status === 'completed') {
          <a mat-raised-button color="accent" [href]="downloadUrl(j.id)">
            <mat-icon>download</mat-icon>
            Download Report
          </a>
        }

        @if (j.status === 'failed') {
          <p class="summary error"><mat-icon>error</mat-icon> Report generation failed.</p>
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
      .filters {
        display: flex;
        gap: 1rem;
        flex-wrap: wrap;
        align-items: flex-start;
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
      .summary.error {
        color: #b3261e;
      }
    `,
  ],
})
export class ReportsComponent implements OnInit, OnDestroy {
  private productService = inject(ProductService);
  private jobService = inject(JobService);
  private categoryService = inject(CategoryService);

  categories = signal<Category[]>([]);
  format: 'csv' | 'xlsx' = 'csv';
  categoryId: string | undefined = undefined;
  search = '';

  generating = signal(false);
  job = signal<Job | null>(null);
  private pollSub?: Subscription;

  ngOnInit(): void {
    this.categoryService.list().subscribe((categories) => this.categories.set(categories));
  }

  generate(): void {
    this.generating.set(true);
    this.job.set(null);

    this.productService
      .requestReport({ format: this.format, categoryId: this.categoryId, search: this.search || undefined })
      .subscribe({
        next: ({ jobId }) => {
          this.generating.set(false);
          this.pollSub?.unsubscribe();
          this.pollSub = this.jobService.poll(jobId).subscribe((job) => this.job.set(job));
        },
        error: () => this.generating.set(false),
      });
  }

  downloadUrl(jobId: string): string {
    return this.jobService.downloadUrl(jobId);
  }

  progressPercent(job: Job): number {
    if (!job.totalRows) return 0;
    return Math.round((job.processedRows / job.totalRows) * 100);
  }

  ngOnDestroy(): void {
    this.pollSub?.unsubscribe();
  }
}
