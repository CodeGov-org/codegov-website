import {
  Overlay,
  OverlayPositionBuilder,
  OverlayRef,
} from '@angular/cdk/overlay';
import { ComponentPortal } from '@angular/cdk/portal';
import {
  ComponentRef,
  Directive,
  ElementRef,
  EventEmitter,
  HostListener,
  Input,
  OnChanges,
  OnInit,
  Output,
} from '@angular/core';

import { ComponentChanges } from '~core/utils';
import { TooltipComponent } from './tooltip.component';

@Directive({
  selector: '[appTooltip]',
  standalone: true,
})
export class TooltipDirective implements OnInit, OnChanges {
  @Input({ required: true, alias: 'appTooltip' })
  public tooltipText!: string | null;

  @Output()
  public tooltipClose = new EventEmitter<void>();

  private tooltipRef: ComponentRef<TooltipComponent> | null = null;

  @HostListener('mouseenter')
  public show(): void {
    if (this.tooltipText !== null) {
      const tooltipPortal = new ComponentPortal(TooltipComponent);
      this.tooltipRef = this.overlayRef.attach(tooltipPortal);

      this.tooltipRef.instance.tooltipText = this.tooltipText;
    }
  }

  @HostListener('mouseleave')
  public hide(): void {
    this.overlayRef.detach();
    this.tooltipRef = null;
    this.tooltipClose.emit();
  }

  private overlayRef!: OverlayRef;

  constructor(
    private readonly overlayPositionBuilder: OverlayPositionBuilder,
    private readonly elementRef: ElementRef,
    private readonly overlay: Overlay,
  ) {}

  public ngOnInit(): void {
    const positionStrategy = this.overlayPositionBuilder
      .flexibleConnectedTo(this.elementRef)
      .withPositions([
        {
          originX: 'center',
          originY: 'bottom',
          overlayX: 'center',
          overlayY: 'top',
          offsetY: 6,
        },
        {
          originX: 'start',
          originY: 'center',
          overlayX: 'end',
          overlayY: 'center',
          offsetX: -6,
        },
      ]);
    this.overlayRef = this.overlay.create({ positionStrategy });
  }

  public ngOnChanges(changes: ComponentChanges<TooltipDirective>): void {
    if (changes.tooltipText && this.tooltipRef !== null) {
      this.tooltipRef.setInput('tooltipText', this.tooltipText);
    }
  }
}
