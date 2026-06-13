import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '@app/services/auth.service';
import { handleRequest } from '@app/utils/request.utils';
import { TranslatePipe } from '@app/pipes/translate.pipe';
import { I18nService } from '@app/services/i18n.service';

@Component({
  standalone: true,
  imports: [ReactiveFormsModule, TranslatePipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './login.component.html',
})
export class LoginComponent {
  readonly i18n = inject(I18nService);
  private readonly fb = inject(FormBuilder);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  loading = false;
  error = '';
  readonly form = this.fb.nonNullable.group({
    email: ['admin@retail.local', [Validators.required, Validators.email]],
    password: ['ChangeMe123!', [Validators.required, Validators.minLength(8)]],
  });

  submit() {
    if (this.form.invalid) return;
    handleRequest(this.auth.login(this.form.getRawValue()), 'Unable to sign in', {
      setError: (error) => this.error = error,
      setLoading: (loading) => this.loading = loading,
    }).subscribe({
      next: () => void this.router.navigate(['/dashboard']),
    });
  }
}
