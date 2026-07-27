import { Component, OnInit, inject, signal } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { ProductService } from '../../../core/services/product.service';
import { CategoryService } from '../../../core/services/category.service';
import { Category } from '../../../core/models/models';
import { FILE_BASE_URL } from '../../../core/config';

@Component({
  selector: 'app-product-form',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    RouterLink,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
  ],
  template: `
    <h1>{{ isEdit() ? 'Edit Product' : 'New Product' }}</h1>

    <form [formGroup]="form" (ngSubmit)="submit()" class="form">
      <mat-form-field appearance="outline">
        <mat-label>Name</mat-label>
        <input matInput formControlName="name" required />
      </mat-form-field>

      <mat-form-field appearance="outline">
        <mat-label>Price</mat-label>
        <input matInput type="number" step="0.01" min="0" formControlName="price" required />
      </mat-form-field>

      <mat-form-field appearance="outline">
        <mat-label>Category</mat-label>
        <mat-select formControlName="categoryId" required>
          @for (category of categories(); track category.id) {
            <mat-option [value]="category.id">{{ category.name }}</mat-option>
          }
        </mat-select>
      </mat-form-field>

      <div class="image-field">
        @if (previewUrl()) {
          <img [src]="previewUrl()" alt="Preview" class="preview" />
        }
        <input type="file" accept="image/*" (change)="onFileSelected($event)" />
      </div>

      @if (error()) {
        <p class="error">{{ error() }}</p>
      }

      <div class="actions">
        <button mat-raised-button color="primary" type="submit" [disabled]="form.invalid || saving()">
          {{ saving() ? 'Saving...' : 'Save' }}
        </button>
        <a mat-button routerLink="/products">Cancel</a>
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
      .image-field {
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
        margin-bottom: 1rem;
      }
      .preview {
        width: 120px;
        height: 120px;
        object-fit: cover;
        border-radius: 4px;
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
export class ProductFormComponent implements OnInit {
  private fb = inject(FormBuilder);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private productService = inject(ProductService);
  private categoryService = inject(CategoryService);

  productId = signal<string | null>(null);
  isEdit = signal(false);
  saving = signal(false);
  error = signal<string | null>(null);
  categories = signal<Category[]>([]);
  previewUrl = signal<string | null>(null);
  selectedFile: File | null = null;

  form = this.fb.nonNullable.group({
    name: ['', [Validators.required, Validators.maxLength(255)]],
    price: [0, [Validators.required, Validators.min(0)]],
    categoryId: ['', Validators.required],
  });

  ngOnInit(): void {
    this.categoryService.list().subscribe((categories) => this.categories.set(categories));

    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.productId.set(id);
      this.isEdit.set(true);
      this.productService.get(id).subscribe((product) => {
        this.form.patchValue({ name: product.name, price: product.price, categoryId: product.categoryId });
        if (product.imagePath) this.previewUrl.set(FILE_BASE_URL + product.imagePath);
      });
    }
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0] ?? null;
    this.selectedFile = file;
    if (file) this.previewUrl.set(URL.createObjectURL(file));
  }

  submit(): void {
    this.error.set(null);
    this.saving.set(true);
    const { name, price, categoryId } = this.form.getRawValue();

    const formData = new FormData();
    formData.append('name', name);
    formData.append('price', String(price));
    formData.append('categoryId', categoryId);
    if (this.selectedFile) formData.append('image', this.selectedFile);

    const request = this.isEdit()
      ? this.productService.update(this.productId()!, formData)
      : this.productService.create(formData);

    request.subscribe({
      next: () => this.router.navigate(['/products']),
      error: (err) => {
        this.saving.set(false);
        this.error.set(err?.error?.message ?? 'Something went wrong');
      },
    });
  }
}
