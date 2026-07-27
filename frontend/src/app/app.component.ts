import { Component } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive, MatToolbarModule, MatButtonModule, MatIconModule],
  template: `
    <mat-toolbar color="primary" class="toolbar">
      <mat-icon>inventory_2</mat-icon>
      <span class="title">Product Catalog</span>
      <nav class="nav-links">
        <a mat-button routerLink="/products" routerLinkActive="active">Products</a>
        <a mat-button routerLink="/categories" routerLinkActive="active">Categories</a>
        <a mat-button routerLink="/users" routerLinkActive="active">Users</a>
        <a mat-button routerLink="/products/bulk-upload" routerLinkActive="active">Bulk Upload</a>
        <a mat-button routerLink="/products/reports" routerLinkActive="active">Reports</a>
      </nav>
    </mat-toolbar>
    <main class="content">
      <router-outlet></router-outlet>
    </main>
  `,
  styles: [
    `
      .toolbar {
        gap: 0.75rem;
        position: sticky;
        top: 0;
        z-index: 10;
      }
      .title {
        font-weight: 600;
        margin-right: 1rem;
      }
      .nav-links {
        display: flex;
        gap: 0.25rem;
        margin-left: auto;
      }
      .nav-links a.active {
        text-decoration: underline;
      }
      .content {
        max-width: 1100px;
        margin: 0 auto;
        padding: 1.5rem;
      }
    `,
  ],
})
export class AppComponent {}
