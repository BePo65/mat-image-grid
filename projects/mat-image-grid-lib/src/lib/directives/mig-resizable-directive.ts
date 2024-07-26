/* eslint-disable @angular-eslint/directive-selector */

import { DOCUMENT } from '@angular/common';
import {
  AfterViewInit,
  Directive,
  ElementRef,
  Inject,
  OnDestroy,
  Renderer2,
} from '@angular/core';
import {
  animationFrameScheduler,
  asapScheduler,
  auditTime,
  Observable,
  Subject,
  takeUntil,
} from 'rxjs';

import { UnloadHandler } from '../interfaces/mig-common.types';

/**
 * Scheduler to be used for resize events. Needs to fall back to
 * something that doesn't rely on requestAnimationFrame on environments
 * that don't support it (e.g. server-side rendering).
 */
const RESIZE_SCHEDULER =
  typeof requestAnimationFrame !== 'undefined'
    ? animationFrameScheduler
    : asapScheduler;

/**
 * This is a manager for our resize events. You can add disable
 * the resize handlers, and (re-)enable handlers after they have been disabled.
 *
 * OptimizedResize uses the ResizeObserver object with a fallback to the
 * window.resize event.
 * The events emitted by the 'elementResized' property run out of
 * Angular ngZone.
 */
@Directive({
  selector: '[migResizable]',
  standalone: true,
})
export class MigResizableDirective implements AfterViewInit, OnDestroy {
  private window: (Window & typeof globalThis) | null;
  private migContainerNative: HTMLDivElement;
  private resizeUnloadHandler: UnloadHandler | null = null;
  private containerResizeObserver: ResizeObserver | undefined;
  private lastContainerWidth = 0;
  private resizeObserverEnabled = false;

  private readonly unsubscribe$ = new Subject<void>();
  private resizingSubject = new Subject<void>();

  /**
   * Observable that emits, when element resized.
   * Collects multiple events into one until the next animation frame.
   */
  public elementResized: Observable<void> = this.resizingSubject.pipe(
    // Collect multiple events into one until the next animation frame. This way if
    // there are multiple resize events in the same frame we only need to recheck
    // our layout once.
    auditTime(0, RESIZE_SCHEDULER),
    takeUntil(this.unsubscribe$),
  );

  /**
   *Creates an instance of OptimizedResize.
   * @param documentRef - Reference to the angular DOCUMENT element.
   * @param renderer - Angular class to modify DOM (here: add / remove event handlers).
   * @param containerElement - elementRef of the container element
   */
  constructor(
    @Inject(DOCUMENT) documentRef: Document,
    private renderer: Renderer2,
    containerElement: ElementRef<HTMLDivElement>,
  ) {
    // get a reference to the 'window' object that can be used in ssr environments too.
    this.window = documentRef.defaultView;
    this.migContainerNative = containerElement.nativeElement;

    if (this.window?.ResizeObserver) {
      this.createContainerWidthResizeObserver();
    }
  }

  ngAfterViewInit(): void {
    this.enable();
  }

  ngOnDestroy(): void {
    this.disable();
    this.unsubscribe$.next();
    this.unsubscribe$.complete();
  }

  /**
   * Enables all resize handlers, if they do not exist or were disabled.
   */
  enable() {
    if (this.containerResizeObserver) {
      if (!this.resizeObserverEnabled) {
        this.containerResizeObserver.observe(this.migContainerNative);
        this.resizeObserverEnabled = true;
      }
    } else {
      if (!this.resizeUnloadHandler) {
        this.resizeUnloadHandler = this.renderer.listen(
          this.window,
          'resize',
          this.resize.bind(this),
        );
      }
    }
  }

  /**
   * Disables (but do not remove) all resize handlers.
   */
  disable() {
    if (this.containerResizeObserver) {
      if (this.resizeObserverEnabled) {
        this.containerResizeObserver.unobserve(this.migContainerNative);
        this.resizeObserverEnabled = false;
      }
    } else {
      if (this.resizeUnloadHandler) {
        this.resizeUnloadHandler();
        this.resizeUnloadHandler = null;
      }
    }
  }

  /**
   * Create observer for resize events of the container element to update the
   * image grid. When the width of the container changes, all resize callbacks
   * get called.
   */
  private createContainerWidthResizeObserver() {
    this.containerResizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        if (entry.contentBoxSize) {
          // Using '[0]': the css standard makes contentBoxSize an array
          if (
            entry.contentBoxSize &&
            Array.isArray(entry.contentBoxSize) &&
            entry.contentBoxSize[0]
          ) {
            const contentBoxSize =
              entry.contentBoxSize as ReadonlyArray<ResizeObserverSize>;
            const newWidth = contentBoxSize[0].inlineSize;

            if (newWidth !== this.lastContainerWidth) {
              // ResizeObserver runs out of angular zone
              this.resize();
              this.lastContainerWidth = newWidth;
            }
          }
        }
      }
    });
  }

  /**
   * Handle the resize event.
   */
  private resize() {
    this.resizingSubject.next();
  }
}
