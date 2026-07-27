import { Component, OnInit, inject, signal } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { CategoryService } from '../../../core/services/category.service';

@Component({
  selector: 'app-category-form',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink, MatFormFieldModule, MatInputModule, MatButtonModule],
  template: `
    <h1>{{ isEdit() ? 'Edit Category' : 'New Category' }}</h1>

    <form [formGroup]="form" (ngSubmit)="submit()" class="form">
      <mat-form-field appearance="outline">
        <mat-label>Name</mat-label>
        <input matInput formControlName="name" required />
      </mat-form-field>

      @if (error()) {
        <p class="error">{{ error() }}</p>
      }

      <div class="actions">
        <button mat-raised-button color="primary" type="submit" [disabled]="form.invalid || saving()">
          {{ saving() ? 'Saving...' : 'Save' }}
        </button>
        <a mat-button routerLink="/categories">Cancel</a>
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
export class CategoryFormComponent implements OnInit {
  private fb = inject(FormBuilder);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private categoryService = inject(CategoryService);

  categoryId = signal<string | null>(null);
  isEdit = signal(false);
  saving = signal(false);
  error = signal<string | null>(null);

  form = this.fb.nonNullable.group({
    name: ['', [Validators.required, Validators.maxLength(150)]],
  });

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.categoryId.set(id);
      this.isEdit.set(true);
      this.categoryService.get(id).subscribe((category) => {
        this.form.patchValue({ name: category.name });
      });
    }
  }

  submit(): void {
    this.error.set(null);
    this.saving.set(true);
    const { name } = this.form.getRawValue();

    const request = this.isEdit()
      ? this.categoryService.update(this.categoryId()!, { name })
      : this.categoryService.create({ name });

    request.subscribe({
      next: () => this.router.navigate(['/categories']),
      error: (err) => {
        this.saving.set(false);
        this.error.set(err?.error?.message ?? 'Something went wrong');
      },
    });
  }
}
