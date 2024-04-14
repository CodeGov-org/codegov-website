import {
  ChangeDetectionStrategy,
  Component,
  HostListener,
  output,
} from '@angular/core';

import { defineCustomElement } from '@cg/ui/dist/components/cg-image-uploader-btn';
import { DefineCustomElement } from '../../define-custom-element';

export { ImageSet } from '@cg/ui';

type ImagesSelectedEvent = CustomEvent<
  HTMLCgImageUploaderBtnElementEventMap['imagesSelected']
>;

@DefineCustomElement(defineCustomElement)
@Component({
  selector: 'cg-image-uploader-btn',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <ng-content />
  `,
})
export class ImageUploaderBtnComponent {
  @HostListener('imagesSelected', ['$event'])
  public onImagesSelected(event: ImagesSelectedEvent): void {
    this.selectedImagesChange.emit(event.detail);
  }

  public selectedImagesChange = output<ImagesSelectedEvent['detail']>();
}
