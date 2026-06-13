import { ApplicationConfig } from '@angular/core';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { provideRouter } from '@angular/router';
import { routes } from './app.routes';
import { authInterceptor } from '@app/interceptors/auth.interceptor';
import {
  LucideBookOpen,
  LucideChartBar,
  LucideCoffee,
  LucideLaptop,
  LucideLayoutDashboard,
  LucideLanguages,
  LucideKeyboard,
  LucideSearch,
  LucideSlidersHorizontal,
  LucideX,
  LucidePackage,
  LucideReceipt,
  LucideShirt,
  LucideShoppingBag,
  LucideShoppingCart,
  LucideSparkles,
  LucideUsers,
  LucideUtensils,
  provideLucideIcons,
} from '@lucide/angular';

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes),
    provideHttpClient(withInterceptors([authInterceptor])),
    provideLucideIcons(
      LucidePackage,
      LucideCoffee,
      LucideLaptop,
      LucideShirt,
      LucideShoppingBag,
      LucideBookOpen,
      LucideUtensils,
      LucideSparkles,
      LucideLayoutDashboard,
      LucideLanguages,
      LucideKeyboard,
      LucideSearch,
      LucideSlidersHorizontal,
      LucideX,
      LucideShoppingCart,
      LucideReceipt,
      LucideChartBar,
      LucideUsers,
    ),
  ],
};
