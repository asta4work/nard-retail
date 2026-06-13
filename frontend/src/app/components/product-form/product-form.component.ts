import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { ProductsService } from '@app/services/products.service';
import { handleRequest } from '@app/utils/request.utils';
import { PRODUCT_ICON_OPTIONS, ProductIcon } from '@app/types';
import { LucideDynamicIcon } from '@lucide/angular';

@Component({
  standalone: true,
  imports: [LucideDynamicIcon, ReactiveFormsModule, RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './product-form.component.html',
})
export class ProductFormComponent {
  private readonly fb = inject(FormBuilder);
  private readonly products = inject(ProductsService);
  private readonly router = inject(Router);
  readonly id = Number(inject(ActivatedRoute).snapshot.paramMap.get('id')) || null;
  loading = false;
  error = '';
  readonly iconOptions = PRODUCT_ICON_OPTIONS;
  readonly form = this.fb.nonNullable.group({
    name: ['', [Validators.required, Validators.maxLength(180)]],
    description: [''],
    category: ['', [Validators.required, Validators.maxLength(100)]],
    price: [0, [Validators.required, Validators.min(0.01)]],
    stockQuantity: [0, [Validators.required, Validators.min(0), Validators.pattern(/^\d+$/)]],
    icon: ['package' as ProductIcon, Validators.required],
  });

  constructor() {
    if (this.id) {
      this.products.get(this.id).subscribe((product) => this.form.patchValue({
        name: product.name,
        description: product.description ?? '',
        category: product.category,
        price: Number(product.price),
        stockQuantity: product.stockQuantity,
        icon: product.icon || 'package',
      }));
    }
  }

  save() {
    this.form.markAllAsTouched();
    if (this.form.invalid) return;
    const request = this.id ? this.products.update(this.id, this.form.getRawValue()) : this.products.create(this.form.getRawValue());
    handleRequest(request, 'Unable to save product', {
      setError: (error) => this.error = error,
      setLoading: (loading) => this.loading = loading,
    }).subscribe({
      next: (product) => void this.router.navigate(['/products', product.id]),
    });
  }
}
