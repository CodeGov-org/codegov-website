import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'app-card',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: [
    `
      @import '@cg/styles/common';

      :host {
        @include layer-10;
        display: block;
        border-radius: $border-radius;
        border: $border-sm-size solid $slate-300;
        background-color: $slate-100;
        padding: size(4);

        @include dark {
          border-color: $slate-700;
          background-color: $slate-800;
        }
      }

      .card__title:not(:empty) {
        margin-bottom: size(6);
        border-bottom: $border-sm-size solid $slate-300;
        color: $black;

        @include dark {
          border-color: $slate-700;
          color: $white;
        }
      }
    `,
  ],
  template: `
    <div class="card__title">
      <ng-content select="[cardTitle]" />
    </div>
    <ng-content />
  `,
})
export class CardComponent {}
