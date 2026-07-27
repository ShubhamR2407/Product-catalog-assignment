import { Component, OnInit, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { FormsModule } from '@angular/forms';
import { CategoryService } from '../../../core/services/category.service';
import { Category } from '../../../core/models/models';

@Component({
  selector: 'app-category-list',
  standalone: true,
  imports: [
    RouterLink,
    FormsModule,
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatProgressSpinnerModule,
  ],
  template: `
    <div class="header">
      <h1>Categories</h1>
      <a mat-raised-button color="primary" routerLink="/categories/new">
        <mat-icon>add</mat-icon>
        New Category
      </a>
    </div>

    <mat-form-field appearance="outline" class="search">
      <mat-label>Search by name</mat-label>
      <input matInput [(ngModel)]="search" (ngModelChange)="load()" />
    </mat-form-field>

    @if (loading()) {
      <mat-spinner diameter="32"></mat-spinner>
    } @else {
      <table mat-table [dataSource]="categories()" class="mat-elevation-z1 full-width">
        <ng-container matColumnDef="name">
          <th mat-header-cell *matHeaderCellDef>Name</th>
          <td mat-cell *matCellDef="let category">{{ category.name }}</td>
        </ng-container>

        <ng-container matColumnDef="id">
          <th mat-header-cell *matHeaderCellDef>Unique ID</th>
          <td mat-cell *matCellDef="let category" class="mono">{{ category.id }}</td>
        </ng-container>

        <ng-container matColumnDef="actions">
          <th mat-header-cell *matHeaderCellDef></th>
          <td mat-cell *matCellDef="let category">
            <a mat-icon-button [routerLink]="['/categories', category.id, 'edit']" aria-label="Edit">
              <mat-icon>edit</mat-icon>
            </a>
            <button mat-icon-button color="warn" (click)="remove(category)" aria-label="Delete">
              <mat-icon>delete</mat-icon>
            </button>
          </td>
        </ng-container>

        <tr mat-header-row *matHeaderRowDef="columns"></tr>
        <tr mat-row *matRowDef="let row; columns: columns"></tr>
      </table>

      @if (categories().length === 0) {
        <p class="empty">No categories found.</p>
      }
    }
  `,
  styles: [
    `
      .header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        margin-bottom: 1rem;
      }
      .search {
        width: 100%;
        max-width: 320px;
      }
      .full-width {
        width: 100%;
      }
      .mono {
        font-family: monospace;
        font-size: 0.8rem;
      }
      .empty {
        opacity: 0.7;
        padding: 1rem 0;
      }
    `,
  ],
})
export class CategoryListComponent implements OnInit {
  private categoryService = inject(CategoryService);

  columns = ['name', 'id', 'actions'];
  categories = signal<Category[]>([]);
  loading = signal(true);
  search = '';

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.categoryService.list(this.search || undefined).subscribe({
      next: (categories) => {
        this.categories.set(categories);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  remove(category: Category): void {
    if (!confirm(`Delete category "${category.name}"?`)) return;
    this.categoryService.remove(category.id).subscribe({
      next: () => this.load(),
      error: (err) => alert(err?.error?.message ?? 'Failed to delete category'),
    });
  }
}
