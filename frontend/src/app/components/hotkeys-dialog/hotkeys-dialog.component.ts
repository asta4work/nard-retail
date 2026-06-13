import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { HotkeysService } from '@app/services/hotkeys.service';
import { TranslatePipe } from '@app/pipes/translate.pipe';

@Component({
  selector: 'app-hotkeys-dialog',
  standalone: true,
  imports: [TranslatePipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './hotkeys-dialog.component.html',
})
export class HotkeysDialogComponent {
  readonly hotkeys = inject(HotkeysService);
  readonly groups = ['Navigation', 'Actions'] as const;
}
