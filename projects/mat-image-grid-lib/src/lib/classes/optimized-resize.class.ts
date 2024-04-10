import { NgZone, Renderer2 } from '@angular/core';

import { UnloadHandler } from '../interfaces/mig-common.types';

type Callback = () => void;

/**
 * This is a manager for our resize handlers. You can add a callback, disable
 * all resize handlers, and (re-)enable handlers after they have been disabled.
 *
 * optimizedResize is adapted from Mozilla code:
 * https://developer.mozilla.org/en-US/docs/Web/Events/resize
 */
export class OptimizedResize {
  private callbacks: Callback[] = [];
  private isRunning = false;
  private window: (Window & typeof globalThis) | null;
  private renderer: Renderer2;
  private resizeUnloadHandler: UnloadHandler | null = null;
  private resizeDebounceTime = 66;
  private containerResizeObserver: ResizeObserver | undefined;
  private lastContainerWidth = 0;
  private resizeObserverEnabled = false;
  migContainerNative: HTMLDivElement;

  /**
   *Creates an instance of OptimizedResize.
   * @param documentRef - Reference to the angular DOCUMENT element.
   * @param renderer2 - Angular class to modify DOM (here: add / remove event handlers).
   * @param zone - Angular zone to run callbacks in.
   * @param migContainerNative - Material-image-grid container element.
   */
  constructor(
    documentRef: Document,
    renderer2: Renderer2,
    private zone: NgZone,
    migContainerNative: HTMLDivElement,
  ) {
    // get a reference to the 'window' object that can be used in ssr environments too.
    this.window = documentRef.defaultView;
    this.renderer = renderer2;
    this.migContainerNative = migContainerNative;
    if (this.window?.ResizeObserver) {
      this.createContainerWidthResizeObserver();
    }
  }

  /**
   * Add a callback to be run on resize.
   * @param callback - The callback to run on resize.
   */
  add(callback: Callback) {
    if (!this.callbacks.length) {
      this.enable();
    }

    this.callbacks.push(callback);
  }

  /**
   * Enables all resize handlers, if they fo not exist or were disabled.
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

  dispose() {
    this.disable();
    this.callbacks = [];
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
              this.zone.run(() => this.resize());
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
    if (!this.isRunning) {
      this.isRunning = true;
      if (this.window?.requestAnimationFrame) {
        this.window.requestAnimationFrame(this.runCallbacks.bind(this));
      } else {
        setTimeout(this.runCallbacks.bind(this), this.resizeDebounceTime);
      }
    }
  }

  /**
   * Run the actual callbacks.
   */
  private runCallbacks() {
    this.callbacks.forEach((callback) => {
      callback();
    });

    this.isRunning = false;
  }
}
