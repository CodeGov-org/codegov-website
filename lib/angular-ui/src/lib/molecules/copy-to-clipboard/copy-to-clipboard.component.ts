import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  ElementRef,
  Input,
  NgZone,
} from '@angular/core';

import { defineCustomElement } from '@cg/ui/dist/components/cg-copy-to-clipboard';
import { DefineCustomElement } from '../../define-custom-element';

@DefineCustomElement(defineCustomElement)
@Component({
  selector: 'cg-copy-to-clipboard',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <ng-content />
  `,
})
export class CopyToClipboardComponent {
  @Input({ required: true })
  public set value(value: HTMLCgCopyToClipboardElement['value']) {
    this.ngZone.runOutsideAngular(() => {
      this.elementRef.nativeElement.value = value;
    });
  }
  public get value(): HTMLCgCopyToClipboardElement['value'] {
    return this.elementRef.nativeElement.value;
  }

  constructor(
    private readonly changeDetectorRef: ChangeDetectorRef,
    private readonly ngZone: NgZone,
    private readonly elementRef: ElementRef<HTMLCgCopyToClipboardElement>,
  ) {
    this.changeDetectorRef.detach();
  }
}
