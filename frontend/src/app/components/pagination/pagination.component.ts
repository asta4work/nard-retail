import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';
import { Page } from '@app/models';
import { TranslatePipe } from '@app/pipes/translate.pipe';

@Component({
  selector: 'app-pagination',
  standalone: true,
  imports: [TranslatePipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './pagination.component.html',
})
export class PaginationComponent {
  @Input({ required: true }) meta!: Page<unknown>['meta'];
  @Input() itemLabel = 'items';
  @Output() readonly pageChange = new EventEmitter<number>();
}
