import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MatTableModule } from '@angular/material/table';
import { MatSortModule, Sort } from '@angular/material/sort';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { ProductService } from '../../../core/services/product.service';
import { CategoryService } from '../../../core/services/category.service';
import { Category, Product } from '../../../core/models/models';
import { FILE_BASE_URL } from '../../../core/config';

@Component({
  selector: 'app-product-list',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    FormsModule,
    MatTableModule,
    MatSortModule,
    MatPaginatorModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatProgressSpinnerModule,
    MatCheckboxModule,
  ],
  template: `
    <div class="header">
      <h1>Products</h1>
      <div class="header-actions">
        @if (selectAllMatching()) {
          <button mat-stroked-button color="warn" (click)="removeAllMatching()">
            <mat-icon>delete_forever</mat-icon>
            Delete All ({{ total() }})
          </button>
        } @else if (selectedIds().size > 0) {
          <button mat-stroked-button color="warn" (click)="removeSelected()">
            <mat-icon>delete</mat-icon>
            Delete Selected ({{ selectedIds().size }})
          </button>
        }
        <a mat-raised-button color="primary" routerLink="/products/new">
          <mat-icon>add</mat-icon>
          New Product
        </a>
      </div>
    </div>

    <div class="filters">
      <mat-form-field appearance="outline">
        <mat-label>Search name or category</mat-label>
        <input matInput [(ngModel)]="search" (ngModelChange)="onFilterChange()" />
      </mat-form-field>

      <mat-form-field appearance="outline">
        <mat-label>Category</mat-label>
        <mat-select [(ngModel)]="categoryId" (ngModelChange)="onFilterChange()">
          <mat-option [value]="undefined">All categories</mat-option>
          @for (category of categories(); track category.id) {
            <mat-option [value]="category.id">{{ category.name }}</mat-option>
          }
        </mat-select>
      </mat-form-field>
    </div>

    @if (loading()) {
      <mat-spinner diameter="32"></mat-spinner>
    } @else {
      @if (allSelected() && total() > products().length && !selectAllMatching()) {
        <div class="select-all-banner">
          All {{ products().length }} products on this page are selected.
          <button mat-button (click)="selectAllMatching.set(true)">
            Select all {{ total() }} products{{ search || categoryId ? ' matching filters' : '' }}
          </button>
        </div>
      }
      @if (selectAllMatching()) {
        <div class="select-all-banner">
          All {{ total() }} products are selected.
          <button mat-button (click)="clearSelection()">Clear selection</button>
        </div>
      }

      <table mat-table [dataSource]="products()" matSort (matSortChange)="onSortChange($event)" class="mat-elevation-z1 full-width">
        <ng-container matColumnDef="select">
          <th mat-header-cell *matHeaderCellDef>
            <mat-checkbox
              [checked]="allSelected() || selectAllMatching()"
              [indeterminate]="someSelected() && !selectAllMatching()"
              [disabled]="selectAllMatching()"
              (change)="toggleAll($event.checked)"
              aria-label="Select all products on this page"
            ></mat-checkbox>
          </th>
          <td mat-cell *matCellDef="let product">
            <mat-checkbox
              [checked]="isSelected(product.id) || selectAllMatching()"
              [disabled]="selectAllMatching()"
              (change)="toggleOne(product.id, $event.checked)"
              [aria-label]="'Select ' + product.name"
            ></mat-checkbox>
          </td>
        </ng-container>

        <ng-container matColumnDef="image">
          <th mat-header-cell *matHeaderCellDef></th>
          <td mat-cell *matCellDef="let product">
            @if (product.imagePath) {
              <img [src]="fileBase + product.imagePath" alt="" class="thumb" />
            } @else {
              <div class="thumb placeholder"></div>
            }
          </td>
        </ng-container>

        <ng-container matColumnDef="name">
          <th mat-header-cell *matHeaderCellDef>Name</th>
          <td mat-cell *matCellDef="let product">{{ product.name }}</td>
        </ng-container>

        <ng-container matColumnDef="category">
          <th mat-header-cell *matHeaderCellDef>Category</th>
          <td mat-cell *matCellDef="let product">{{ product.category.name }}</td>
        </ng-container>

        <ng-container matColumnDef="price">
          <th mat-header-cell *matHeaderCellDef mat-sort-header>Price</th>
          <td mat-cell *matCellDef="let product">{{ product.price | currency }}</td>
        </ng-container>

        <ng-container matColumnDef="actions">
          <th mat-header-cell *matHeaderCellDef></th>
          <td mat-cell *matCellDef="let product">
            <a mat-icon-button [routerLink]="['/products', product.id, 'edit']" aria-label="Edit">
              <mat-icon>edit</mat-icon>
            </a>
            <button mat-icon-button color="warn" (click)="remove(product)" aria-label="Delete">
              <mat-icon>delete</mat-icon>
            </button>
          </td>
        </ng-container>

        <tr mat-header-row *matHeaderRowDef="columns"></tr>
        <tr mat-row *matRowDef="let row; columns: columns"></tr>
      </table>

      @if (products().length === 0) {
        <p class="empty">No products found.</p>
      }

      <mat-paginator
        [length]="total()"
        [pageSize]="pageSize"
        [pageSizeOptions]="[10, 20, 50]"
        [pageIndex]="pageIndex"
        (page)="onPageChange($event)"
      ></mat-paginator>
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
      .header-actions {
        display: flex;
        align-items: center;
        gap: 0.75rem;
      }
      .filters {
        display: flex;
        gap: 1rem;
        flex-wrap: wrap;
      }
      .select-all-banner {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        padding: 0.5rem 1rem;
        margin-bottom: 0.5rem;
        background: #e8eaf6;
        border-radius: 4px;
        font-size: 0.9rem;
      }
      .full-width {
        width: 100%;
      }
      .thumb {
        width: 40px;
        height: 40px;
        object-fit: cover;
        border-radius: 4px;
        display: block;
      }
      .thumb.placeholder {
        background: #e0e0e0;
      }
      .empty {
        opacity: 0.7;
        padding: 1rem 0;
      }
    `,
  ],
})
export class ProductListComponent implements OnInit {
  private productService = inject(ProductService);
  private categoryService = inject(CategoryService);

  fileBase = FILE_BASE_URL;
  columns = ['select', 'image', 'name', 'category', 'price', 'actions'];

  products = signal<Product[]>([]);
  categories = signal<Category[]>([]);
  total = signal(0);
  loading = signal(true);
  selectedIds = signal<Set<string>>(new Set());
  selectAllMatching = signal(false);

  search = '';
  categoryId: string | undefined = undefined;
  pageIndex = 0;
  pageSize = 20;
  sortBy: 'price' | undefined = undefined;
  order: 'asc' | 'desc' = 'desc';

  ngOnInit(): void {
    this.categoryService.list().subscribe((categories) => this.categories.set(categories));
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.clearSelection();
    this.productService
      .list({
        page: this.pageIndex + 1,
        limit: this.pageSize,
        sortBy: this.sortBy,
        order: this.order,
        search: this.search || undefined,
        categoryId: this.categoryId,
      })
      .subscribe({
        next: (res) => {
          this.products.set(res.data);
          this.total.set(res.pagination.total);
          this.loading.set(false);
        },
        error: () => this.loading.set(false),
      });
  }

  isSelected(id: string): boolean {
    return this.selectedIds().has(id);
  }

  toggleOne(id: string, checked: boolean): void {
    const next = new Set(this.selectedIds());
    if (checked) next.add(id);
    else next.delete(id);
    this.selectedIds.set(next);
  }

  toggleAll(checked: boolean): void {
    this.selectedIds.set(checked ? new Set(this.products().map((p) => p.id)) : new Set());
  }

  allSelected(): boolean {
    return this.products().length > 0 && this.selectedIds().size === this.products().length;
  }

  someSelected(): boolean {
    return this.selectedIds().size > 0 && !this.allSelected();
  }

  clearSelection(): void {
    this.selectedIds.set(new Set());
    this.selectAllMatching.set(false);
  }

  removeSelected(): void {
    const ids = Array.from(this.selectedIds());
    if (ids.length === 0) return;
    if (!confirm(`Delete ${ids.length} selected product(s)?`)) return;
    this.productService.bulkDelete(ids).subscribe(() => this.load());
  }

  removeAllMatching(): void {
    const scope = this.search || this.categoryId ? 'matching the current filters' : 'in the catalog';
    if (!confirm(`Delete all ${this.total()} products ${scope}? This cannot be undone.`)) return;
    this.productService
      .bulkDeleteAll({ search: this.search || undefined, categoryId: this.categoryId })
      .subscribe(() => this.load());
  }

  onFilterChange(): void {
    this.pageIndex = 0;
    this.load();
  }

  onPageChange(event: PageEvent): void {
    this.pageIndex = event.pageIndex;
    this.pageSize = event.pageSize;
    this.load();
  }

  onSortChange(sort: Sort): void {
    if (!sort.direction) {
      this.sortBy = undefined;
    } else {
      this.sortBy = 'price';
      this.order = sort.direction;
    }
    this.pageIndex = 0;
    this.load();
  }

  remove(product: Product): void {
    if (!confirm(`Delete product "${product.name}"?`)) return;
    this.productService.remove(product.id).subscribe(() => this.load());
  }
}
