import { Renderer2 } from '@angular/core';

import { UnloadHandler } from '../interfaces/mig-common.types';

type Callback = () => void;

/**
 * This is a manager for our resize handlers. You can add a callback, disable
 * all resize handlers, and re-enable handlers after they have been disabled.
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

  /**
   *Creates an instance of OptimizedResize.
   * @param documentRef - Reference to the angular DOCUMENT element.
   * @param renderer2 - Angular class to modify DOM (here: add / remove event handlers).
   */
  constructor(documentRef: Document, renderer2: Renderer2) {
    // get a reference to the 'window' object that can be used in ssr environments too.
    this.window = documentRef.defaultView;
    this.renderer = renderer2;
  }

  /**
   * Add a callback to be run on resize.
   * @param callback - The callback to run on resize.
   */
  add(callback: Callback) {
    if (!this.callbacks.length) {
      this.reEnable();
    }

    this.callbacks.push(callback);
  }

  /**
   * Disables (but do not remove) all resize handlers.
   */
  disable() {
    if (this.resizeUnloadHandler) {
      this.resizeUnloadHandler();
      this.resizeUnloadHandler = null;
    }
  }

  /**
   * Enables all resize handlers, if they were disabled.
   */
  reEnable() {
    if (!this.resizeUnloadHandler) {
      // TODO change to resizeObserver?!
      this.resizeUnloadHandler = this.renderer.listen(
        this.window,
        'resize',
        this.resize.bind(this),
      );
    }
  }

  dispose() {
    this.disable();
    this.callbacks = [];
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
