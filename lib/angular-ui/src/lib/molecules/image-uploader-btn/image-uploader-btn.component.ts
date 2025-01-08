import {
  ChangeDetectionStrategy,
  Component,
  HostListener,
  input,
  output,
} from '@angular/core';

import { defineCustomElement } from '@cg/ui/dist/components/cg-image-uploader-btn';
import { defineCustomElementComponent } from '../../custom-element-component';

export { ImageSet } from '@cg/ui';

type ImagesSelectedEvent = CustomEvent<
  HTMLCgImageUploaderBtnElementEventMap['imagesSelected']
>;

@Component({
  selector: 'cg-image-uploader-btn',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<ng-content />`,
})
export class ImageUploaderBtnComponent extends defineCustomElementComponent<HTMLCgImageUploaderBtnElement>(
  defineCustomElement,
) {
  public readonly disabled = input<boolean>();
  public readonly isLoading = input<boolean>();

  @HostListener('imagesSelected', ['$event'])
  public onImagesSelected(event: ImagesSelectedEvent): void {
    this.selectedImagesChange.emit(event.detail);
  }

  public selectedImagesChange = output<ImagesSelectedEvent['detail']>();

  constructor() {
    super();

    this.elemProxyEffect(this.disabled, 'disabled');
    this.elemProxyEffect(this.isLoading, 'isLoading');
  }
}
