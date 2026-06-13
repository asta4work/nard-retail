import { DOCUMENT } from '@angular/common';
import { Injectable, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { take } from 'rxjs';
import { AuthService } from './auth.service';
import { CartService } from './cart.service';
import { I18nService } from './i18n.service';
import { ProductsService } from './products.service';

export interface HotkeyDefinition {
  keys: string[];
  label: string;
  group: 'Navigation' | 'Actions';
}

@Injectable({ providedIn: 'root' })
export class HotkeysService {
  private readonly document = inject(DOCUMENT);
  private readonly router = inject(Router);
  private readonly auth = inject(AuthService);
  private readonly cart = inject(CartService);
  private readonly products = inject(ProductsService);
  private readonly i18n = inject(I18nService);
  readonly open = signal(false);
  readonly notice = signal('');
  readonly definitions: HotkeyDefinition[] = [
    { keys: ['Alt', '1'], label: 'Go to dashboard', group: 'Navigation' },
    { keys: ['Alt', '2'], label: 'Go to products', group: 'Navigation' },
    { keys: ['Alt', '3'], label: 'Go to checkout', group: 'Navigation' },
    { keys: ['Alt', '4'], label: 'Go to sales', group: 'Navigation' },
    { keys: ['Alt', '5'], label: 'Go to reports', group: 'Navigation' },
    { keys: ['Alt', '6'], label: 'Go to users', group: 'Navigation' },
    { keys: ['Alt', 'F'], label: 'Focus product search', group: 'Actions' },
    { keys: ['Alt', 'A'], label: 'Add first available product', group: 'Actions' },
    { keys: ['Alt', 'S'], label: 'Complete current sale', group: 'Actions' },
    { keys: ['?'], label: 'Show keyboard shortcuts', group: 'Actions' },
  ];

  constructor() {
    this.document.addEventListener('keydown', (event) => this.handle(event));
  }

  toggle() {
    this.open.update((open) => !open);
  }

  close() {
    this.open.set(false);
  }

  private handle(event: KeyboardEvent) {
    if (event.key === 'Escape') {
      this.close();
      return;
    }
    if (!this.auth.authenticated) return;

    const typing = event.target instanceof HTMLInputElement ||
      event.target instanceof HTMLTextAreaElement ||
      event.target instanceof HTMLSelectElement;
    if (typing && !(event.altKey && event.code === 'KeyS')) return;

    const routes: Record<string, string> = {
      Digit1: '/dashboard',
      Digit2: '/products',
      Digit3: '/cart',
      Digit4: '/sales',
      Digit5: '/reports',
      Digit6: '/users',
    };
    if (event.altKey && routes[event.code]) {
      event.preventDefault();
      void this.router.navigate([routes[event.code]]);
      return;
    }
    if (event.altKey && event.code === 'KeyF') {
      event.preventDefault();
      void this.router.navigate(['/products']).then(() => {
        setTimeout(() => this.document.querySelector<HTMLInputElement>('[data-hotkey-search]')?.focus());
      });
      return;
    }
    if (event.altKey && event.code === 'KeyA') {
      event.preventDefault();
      this.addFirstAvailableProduct();
      return;
    }
    if (event.altKey && event.code === 'KeyS') {
      event.preventDefault();
      this.document.defaultView?.dispatchEvent(new Event('retail-complete-sale'));
      return;
    }
    if (event.key === '?' || (event.altKey && event.code === 'Slash')) {
      event.preventDefault();
      this.toggle();
    }
  }

  private addFirstAvailableProduct() {
    this.products.list({ availability: 'in-stock', sort: 'stock', order: 'DESC', limit: 1 }).pipe(take(1))
      .subscribe((page) => {
        const product = page.data[0];
        if (product) this.cart.add(product);
        this.showNotice(product ? 'First available product added to cart.' : 'No available product found.');
      });
  }

  private showNotice(message: string) {
    this.notice.set(this.i18n.translate(message));
    setTimeout(() => this.notice.set(''), 2600);
  }
}
