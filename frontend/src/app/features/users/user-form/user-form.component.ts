import { Component, OnInit, inject, signal } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { UserService } from '../../../core/services/user.service';

@Component({
  selector: 'app-user-form',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink, MatFormFieldModule, MatInputModule, MatButtonModule],
  template: `
    <h1>{{ isEdit() ? 'Edit User' : 'New User' }}</h1>

    <form [formGroup]="form" (ngSubmit)="submit()" class="form">
      <mat-form-field appearance="outline">
        <mat-label>Email</mat-label>
        <input matInput type="email" formControlName="email" required />
      </mat-form-field>

      <mat-form-field appearance="outline">
        <mat-label>{{ isEdit() ? 'New Password (leave blank to keep current)' : 'Password' }}</mat-label>
        <input matInput type="password" formControlName="password" />
      </mat-form-field>

      @if (error()) {
        <p class="error">{{ error() }}</p>
      }

      <div class="actions">
        <button mat-raised-button color="primary" type="submit" [disabled]="form.invalid || saving()">
          {{ saving() ? 'Saving...' : 'Save' }}
        </button>
        <a mat-button routerLink="/users">Cancel</a>
      </div>
    </form>
  `,
  styles: [
    `
      .form {
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
        max-width: 420px;
      }
      .actions {
        display: flex;
        gap: 0.5rem;
        align-items: center;
      }
      .error {
        color: #b3261e;
      }
    `,
  ],
})
export class UserFormComponent implements OnInit {
  private fb = inject(FormBuilder);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private userService = inject(UserService);

  userId = signal<string | null>(null);
  isEdit = signal(false);
  saving = signal(false);
  error = signal<string | null>(null);

  form = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    password: [''],
  });

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.userId.set(id);
      this.isEdit.set(true);
      this.form.controls.password.clearValidators();
      this.userService.get(id).subscribe((user) => {
        this.form.patchValue({ email: user.email });
      });
    } else {
      this.form.controls.password.setValidators([Validators.required, Validators.minLength(8)]);
    }
  }

  submit(): void {
    this.error.set(null);
    this.saving.set(true);
    const { email, password } = this.form.getRawValue();

    const request = this.isEdit()
      ? this.userService.update(this.userId()!, { email, password: password || undefined })
      : this.userService.create({ email, password });

    request.subscribe({
      next: () => this.router.navigate(['/users']),
      error: (err) => {
        this.saving.set(false);
        this.error.set(err?.error?.message ?? 'Something went wrong');
      },
    });
  }
}
