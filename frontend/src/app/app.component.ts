import { AsyncPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, DestroyRef, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { filter } from 'rxjs';
import { AuthService } from '@app/services/auth.service';
import { CartService } from '@app/services/cart.service';
import { RealtimeService } from '@app/services/realtime.service';
import { NavigationItem } from '@app/types';
import { ProductsService } from '@app/services/products.service';
import { LucideDynamicIcon } from '@lucide/angular';
import { HotkeysDialogComponent } from '@app/components/hotkeys-dialog/hotkeys-dialog.component';
import { HotkeysService } from '@app/services/hotkeys.service';
import { I18nService } from '@app/services/i18n.service';
import { TranslatePipe } from '@app/pipes/translate.pipe';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [AsyncPipe, HotkeysDialogComponent, LucideDynamicIcon, RouterOutlet, RouterLink, RouterLinkActive, TranslatePipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './app.component.html',
  styleUrl: './app.component.css',
})
export class AppComponent {
  readonly auth = inject(AuthService);
  readonly cart = inject(CartService);
  readonly hotkeys = inject(HotkeysService);
  readonly i18n = inject(I18nService);
  private readonly realtime = inject(RealtimeService);
  private readonly products = inject(ProductsService);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);
  navOpen = false;
  readonly navItems: NavigationItem[] = [
    { path: '/dashboard', icon: 'layout-dashboard', label: 'Dashboard', description: 'Daily overview' },
    { path: '/products', icon: 'package', label: 'Products', description: 'Catalog and stock' },
    { path: '/cart', icon: 'shopping-cart', label: 'Checkout', description: 'Create a sale' },
    { path: '/sales', icon: 'receipt', label: 'Sales', description: 'Invoices and history' },
    { path: '/reports', icon: 'chart-bar', label: 'Reports', description: 'Business performance', admin: true },
    { path: '/users', icon: 'users', label: 'Users', description: 'Access management', admin: true },
  ];

  constructor() {
    this.auth.user$.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((user) => {
      if (user) this.realtime.connect(); else this.realtime.disconnect();
    });
    this.realtime.stockUpdates$.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((updates) => {
      updates.forEach((update) => this.cart.syncStock(update.productId, update.stockQuantity));
      this.products.applyStockUpdates(updates);
      this.products.refreshCachedPages();
    });
    this.realtime.productChanges$.pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.products.refreshCachedPages());
    this.router.events.pipe(
      filter((event): event is NavigationEnd => event instanceof NavigationEnd),
      takeUntilDestroyed(this.destroyRef),
    ).subscribe(() => this.navOpen = false);
  }

  logout() {
    this.auth.logout();
    void this.router.navigate(['/login']);
  }
}
