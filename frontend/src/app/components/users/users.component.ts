import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { AuthService } from '@app/services/auth.service';
import { getErrorMessage } from '@app/utils/http.utils';
import { User } from '@app/models';
import { Role } from '@app/types';
import { UsersService } from '@app/services/users.service';
import { handleRequest } from '@app/utils/request.utils';
import { LocalizedDatePipe } from '@app/pipes/localized-date.pipe';
import { TranslatePipe } from '@app/pipes/translate.pipe';

@Component({
  standalone: true,
  imports: [LocalizedDatePipe, ReactiveFormsModule, TranslatePipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './users.component.html',
})
export class UsersComponent {
  readonly auth = inject(AuthService);
  private readonly service = inject(UsersService);
  private readonly fb = inject(FormBuilder);
  readonly users = signal<User[]>([]);
  readonly loading = signal(false);
  readonly error = signal('');
  readonly form = this.fb.nonNullable.group({
    name: ['', Validators.required],
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(8)]],
    role: ['employee' as Role, Validators.required],
  });

  constructor() { this.load(); }

  load() {
    this.service.list().subscribe({
      next: (users) => this.users.set(users),
      error: (error) => this.error.set(getErrorMessage(error, 'Unable to load users')),
    });
  }
  create() {
    if (this.form.invalid) return;
    handleRequest(this.service.create(this.form.getRawValue()), 'Unable to create user', {
      setError: (error) => this.error.set(error),
      setLoading: (loading) => this.loading.set(loading),
    }).subscribe({
      next: () => { this.form.reset({ name: '', email: '', password: '', role: 'employee' }); this.load(); },
    });
  }
  setRole(user: User, role: Role) {
    this.service.update(user.id, { role }).subscribe({
      next: () => this.load(),
      error: (error) => this.error.set(getErrorMessage(error, 'Unable to update role')),
    });
  }
  toggle(user: User) {
    this.service.update(user.id, { active: !user.active }).subscribe({
      next: () => this.load(),
      error: (error) => this.error.set(getErrorMessage(error, 'Unable to update user')),
    });
  }
}
