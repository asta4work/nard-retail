import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';
import { Page } from '@app/models';

@Component({
  selector: 'app-pagination',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './pagination.component.html',
})
export class PaginationComponent {
  @Input({ required: true }) meta!: Page<unknown>['meta'];
  @Input() itemLabel = 'items';
  @Output() readonly pageChange = new EventEmitter<number>();
}
