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
        @if (selectedIds().size > 0) {
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
      <table mat-table [dataSource]="products()" matSort (matSortChange)="onSortChange($event)" class="mat-elevation-z1 full-width">
        <ng-container matColumnDef="select">
          <th mat-header-cell *matHeaderCellDef>
            <mat-checkbox
              [checked]="allSelected()"
              [indeterminate]="someSelected()"
              (change)="toggleAll($event.checked)"
              aria-label="Select all products on this page"
            ></mat-checkbox>
          </th>
          <td mat-cell *matCellDef="let product">
            <mat-checkbox
              [checked]="isSelected(product.id)"
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
  columns = ['image', 'name', 'category', 'price', 'actions'];

  products = signal<Product[]>([]);
  categories = signal<Category[]>([]);
  total = signal(0);
  loading = signal(true);

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
