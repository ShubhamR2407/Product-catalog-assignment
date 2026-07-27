import { Routes } from '@angular/router';

export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'products' },

  {
    path: 'products',
    loadComponent: () =>
      import('./features/products/product-list/product-list.component').then((m) => m.ProductListComponent),
  },
  {
    path: 'products/new',
    loadComponent: () =>
      import('./features/products/product-form/product-form.component').then((m) => m.ProductFormComponent),
  },
  {
    path: 'products/bulk-upload',
    loadComponent: () =>
      import('./features/products/bulk-upload/bulk-upload.component').then((m) => m.BulkUploadComponent),
  },
  {
    path: 'products/reports',
    loadComponent: () =>
      import('./features/products/reports/reports.component').then((m) => m.ReportsComponent),
  },
  {
    path: 'products/:id/edit',
    loadComponent: () =>
      import('./features/products/product-form/product-form.component').then((m) => m.ProductFormComponent),
  },

  {
    path: 'categories',
    loadComponent: () =>
      import('./features/categories/category-list/category-list.component').then(
        (m) => m.CategoryListComponent
      ),
  },
  {
    path: 'categories/new',
    loadComponent: () =>
      import('./features/categories/category-form/category-form.component').then(
        (m) => m.CategoryFormComponent
      ),
  },
  {
    path: 'categories/:id/edit',
    loadComponent: () =>
      import('./features/categories/category-form/category-form.component').then(
        (m) => m.CategoryFormComponent
      ),
  },

  {
    path: 'users',
    loadComponent: () =>
      import('./features/users/user-list/user-list.component').then((m) => m.UserListComponent),
  },
  {
    path: 'users/new',
    loadComponent: () =>
      import('./features/users/user-form/user-form.component').then((m) => m.UserFormComponent),
  },
  {
    path: 'users/:id/edit',
    loadComponent: () =>
      import('./features/users/user-form/user-form.component').then((m) => m.UserFormComponent),
  },

  { path: '**', redirectTo: 'products' },
];
