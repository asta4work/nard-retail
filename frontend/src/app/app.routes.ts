import { Routes } from '@angular/router';
import { adminGuard, authGuard } from './guards/auth.guard';

export const routes: Routes = [
  {
    path: 'login',
    loadComponent: () => import('./components/login/login.component').then((module) => module.LoginComponent),
  },
  {
    path: 'dashboard',
    canActivate: [authGuard],
    loadComponent: () => import('./components/dashboard/dashboard.component').then((module) => module.DashboardComponent),
  },
  {
    path: 'products',
    canActivate: [authGuard],
    loadComponent: () => import('./components/products/products.component').then((module) => module.ProductsComponent),
  },
  {
    path: 'products/new',
    canActivate: [authGuard, adminGuard],
    loadComponent: () => import('./components/product-form/product-form.component').then((module) => module.ProductFormComponent),
  },
  {
    path: 'products/:id/edit',
    canActivate: [authGuard, adminGuard],
    loadComponent: () => import('./components/product-form/product-form.component').then((module) => module.ProductFormComponent),
  },
  {
    path: 'products/:id',
    canActivate: [authGuard],
    loadComponent: () => import('./components/product-detail/product-detail.component').then((module) => module.ProductDetailComponent),
  },
  {
    path: 'cart',
    canActivate: [authGuard],
    loadComponent: () => import('./components/cart/cart.component').then((module) => module.CartComponent),
  },
  {
    path: 'sales',
    canActivate: [authGuard],
    loadComponent: () => import('./components/sales/sales.component').then((module) => module.SalesComponent),
  },
  {
    path: 'reports',
    canActivate: [authGuard, adminGuard],
    loadComponent: () => import('./components/reports/reports.component').then((module) => module.ReportsComponent),
  },
  {
    path: 'users',
    canActivate: [authGuard, adminGuard],
    loadComponent: () => import('./components/users/users.component').then((module) => module.UsersComponent),
  },
  { path: '', pathMatch: 'full', redirectTo: 'dashboard' },
  { path: '**', redirectTo: 'dashboard' },
];
