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
  HostListener,
  OnDestroy,
  OnInit,
  effect,
  input,
  output,
} from '@angular/core';

import { TooltipComponent } from './tooltip.component';

@Directive({
  selector: '[appTooltip]',
})
export class TooltipDirective implements OnInit, OnDestroy {
  public readonly tooltipText = input.required<string>({ alias: 'appTooltip' });

  public readonly tooltipClose = output();

  private tooltipRef: ComponentRef<TooltipComponent> | null = null;

  @HostListener('mouseenter')
  public onMouseEnter(): void {
    if (!this.isTouchScreen()) {
      this.show();
    }
  }

  @HostListener('click')
  public onClick(): void {
    if (this.isTouchScreen()) {
      this.show();
    }
  }

  @HostListener('mouseleave')
  public onMouseLeave(): void {
    this.hide();
  }

  @HostListener('window:scroll', ['$event'])
  public onScroll(): void {
    this.hide();
  }

  private overlayRef!: OverlayRef;

  constructor(
    private readonly overlayPositionBuilder: OverlayPositionBuilder,
    private readonly elementRef: ElementRef,
    private readonly overlay: Overlay,
  ) {
    effect(() => {
      if (this.tooltipRef !== null) {
        this.tooltipRef.setInput('tooltipText', this.tooltipText());
      }
    });
  }

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

  public ngOnDestroy(): void {
    this.hide();
  }

  private isTouchScreen(): boolean {
    return window.matchMedia('(pointer: coarse)').matches;
  }

  private hide(): void {
    this.overlayRef.detach();
    this.tooltipRef = null;
    this.tooltipClose.emit();
  }

  private show(): void {
    if (this.tooltipText !== null) {
      const tooltipPortal = new ComponentPortal(TooltipComponent);
      this.tooltipRef = this.overlayRef.attach(tooltipPortal);

      this.tooltipRef.setInput('tooltipText', this.tooltipText());
    }
  }
}
