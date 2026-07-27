import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { UserService } from '../../../core/services/user.service';
import { User } from '../../../core/models/models';

@Component({
  selector: 'app-user-list',
  standalone: true,
  imports: [CommonModule, RouterLink, MatTableModule, MatButtonModule, MatIconModule, MatProgressSpinnerModule],
  template: `
    <div class="header">
      <h1>Users</h1>
      <a mat-raised-button color="primary" routerLink="/users/new">
        <mat-icon>add</mat-icon>
        New User
      </a>
    </div>

    @if (loading()) {
      <mat-spinner diameter="32"></mat-spinner>
    } @else {
      <table mat-table [dataSource]="users()" class="mat-elevation-z1 full-width">
        <ng-container matColumnDef="email">
          <th mat-header-cell *matHeaderCellDef>Email</th>
          <td mat-cell *matCellDef="let user">{{ user.email }}</td>
        </ng-container>

        <ng-container matColumnDef="createdAt">
          <th mat-header-cell *matHeaderCellDef>Created</th>
          <td mat-cell *matCellDef="let user">{{ user.createdAt | date: 'medium' }}</td>
        </ng-container>

        <ng-container matColumnDef="actions">
          <th mat-header-cell *matHeaderCellDef></th>
          <td mat-cell *matCellDef="let user">
            <a mat-icon-button [routerLink]="['/users', user.id, 'edit']" aria-label="Edit">
              <mat-icon>edit</mat-icon>
            </a>
            <button mat-icon-button color="warn" (click)="remove(user)" aria-label="Delete">
              <mat-icon>delete</mat-icon>
            </button>
          </td>
        </ng-container>

        <tr mat-header-row *matHeaderRowDef="columns"></tr>
        <tr mat-row *matRowDef="let row; columns: columns"></tr>
      </table>

      @if (users().length === 0) {
        <p class="empty">No users yet.</p>
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
      .full-width {
        width: 100%;
      }
      .empty {
        opacity: 0.7;
        padding: 1rem 0;
      }
    `,
  ],
})
export class UserListComponent implements OnInit {
  private userService = inject(UserService);

  columns = ['email', 'createdAt', 'actions'];
  users = signal<User[]>([]);
  loading = signal(true);

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.userService.list().subscribe({
      next: (users) => {
        this.users.set(users);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  remove(user: User): void {
    if (!confirm(`Delete user ${user.email}?`)) return;
    this.userService.remove(user.id).subscribe(() => this.load());
  }
}
