import { PigImageData } from '../interfaces/pig-image-data.interface';
import { PigSettings } from '../interfaces/pig-settings.interface';

import { OptimizedResize } from './optimized-resize.class';
import { DefaultPigSettings } from './pig-settings.class';
import { ProgressiveImage } from './progressive-image.class';

/**
 * Class for the progressive image grid. Instantiating an instance of the Pig
 * class does not cause any images to appear however. After instantiating,
 * call the `enable()` function on the returned instance:
 *
 *   const pig = new Pig(imageData, opts);
 *   pig.enable();
 */
export class Pig {
  public container: HTMLElement;
  public lastWindowWidth = window.innerWidth;
  public settings: DefaultPigSettings;

  private _optimizedResize: OptimizedResize;
  private images: ProgressiveImage[];
  private inRAF = false;
  private isTransitioning = false;
  private latestYOffset = 0;
  private minAspectRatio?: number;
  private minAspectRatioRequiresTransition = false;
  private onScroll = () => {};
  private previousYOffset = 0;
  private scrollDirection = 'down';
  private scroller: Window | HTMLElement;
  private totalHeight = 0;

  /**
   * Creates an instance of the progressive image grid, inserting boilerplate CSS
   * and loading image data.
   * @param imageData - An array of metadata about each image to include in the grid.
   * @param options - An object containing overrides for the default options.
   * @returns The Pig instance.
   */
  constructor(imageData: PigImageData[], options: PigSettings) {
    this._optimizedResize = new OptimizedResize();

    // Global State

    // We extend the default settings with the provided overrides.
    this.settings = Object.assign(
      new DefaultPigSettings(),
      options,
    ) as DefaultPigSettings;

    // Find the container to load images into, if it exists.
    const tempContainer = document.getElementById(this.settings.containerId);
    if (tempContainer) {
      this.container = tempContainer;
    } else {
      console.error(
        `Could not find element with ID ${this.settings.containerId}`,
      );
      // Create dummy element, to prevent errors in rest of code
      this.container = document.createElement('div');
    }

    this.scroller = this.settings.scroller;

    // Our global reference for images in the grid.  Note that not all of these
    // images are necessarily in view or loaded.
    this.images = this._parseImageData(imageData);

    // Inject our boilerplate CSS.
    this._injectStyle(
      this.settings.containerId,
      this.settings.classPrefix,
      this.settings.transitionSpeed,
    );

    // Allows for chaining with `enable()`.
    return this;
  }

  /**
   * Enable scroll and resize handlers, and run a complete layout computation /
   * application.
   * @returns The Pig instance, for easy chaining with the constructor.
   */
  enable() {
    this.onScroll = this._getOnScroll();

    this.scroller.addEventListener('scroll', this.onScroll);

    this.onScroll();
    this._computeLayout();
    this._doLayout();

    this._optimizedResize.add(() => {
      this.lastWindowWidth =
        this.scroller === window
          ? window.innerWidth
          : (this.scroller as HTMLElement).offsetWidth;
      this._computeLayout();
      this._doLayout();
    });

    return this;
  }

  /**
   * Remove all scroll and resize listeners.
   * @returns The Pig instance.
   */
  disable() {
    this.scroller.removeEventListener('scroll', this.onScroll);
    this._optimizedResize.disable();
    return this;
  }

  /**
   * Convert list of images information from server to internal list of images information.
   * This method must be called, while pig is disabled!
   * @param imageData - list of Image details (information about each image)
   */
  setImageData(imageData: PigImageData[]): void {
    this.images = this._parseImageData(imageData);
  }

  /**
   * Clear internal ist of images information.
   * This method must be called, while pig is disabled!
   */
  clearImageData(): void {
    this.images.forEach((image) => {
      if (image.existsOnPage) {
        image.hide();
      }
    });
    this.images = this._parseImageData([]);
    this.container.style.height = 'auto';
  }

  /**
   * Creates new instances of the ProgressiveImage class for each of the images
   * defined in `imageData`.
   * @param imageData - An array of metadata about each image to
   * @returns An array of ProgressiveImage instances that we created.
   */
  _parseImageData(imageData: PigImageData[]): ProgressiveImage[] {
    const progressiveImages: ProgressiveImage[] = [];

    imageData.forEach((image, index) => {
      const progressiveImage = this.settings.createProgressiveImage(
        image,
        index,
        this,
      );
      progressiveImages.push(progressiveImage);
    });

    return progressiveImages;
  }

  /**
   * Returns the distance from `elem` to the top of the page. This is done by
   * walking up the node tree, getting the offsetTop of each parent node, until
   * the top of the page.
   * @param elem - The element to compute the offset of.
   * @returns Distance of `elem` to the top of the page
   */
  _getOffsetTop(elem: HTMLElement) {
    let loopElement: HTMLElement | undefined = elem;
    let offsetTop = 0;
    do {
      if (!Number.isNaN(loopElement.offsetTop)) {
        offsetTop += loopElement.offsetTop;
      }
      loopElement = loopElement.offsetParent as HTMLElement;
    } while (loopElement);
    return offsetTop;
  }

  /**
   * Inject CSS needed to make the grid work in the <head></head>.
   * @param containerId - ID of the container for the images.
   * @param classPrefix - The prefix associated with this library that should be prepended to classnames.
   * @param transitionSpeed - Animation duration in milliseconds
   */
  _injectStyle(
    containerId: string,
    classPrefix: string,
    transitionSpeed: number,
  ) {
    const css =
      `#${containerId} {` +
      '  position: relative;' +
      '}' +
      `.${classPrefix}-figure {` +
      '  background-color: #D5D5D5;' +
      '  overflow: hidden;' +
      '  left: 0;' +
      '  position: absolute;' +
      '  top: 0;' +
      '  margin: 0;' +
      '  contain: paint;' +
      '}' +
      `.${classPrefix}-figure img {` +
      '  left: 0;' +
      '  position: absolute;' +
      '  top: 0;' +
      '  height: 100%;' +
      '  width: 100%;' +
      '  opacity: 0;' +
      `  transition: ${(transitionSpeed / 1000).toString(10)}s ease opacity;` +
      `  -webkit-transition: ${(transitionSpeed / 1000).toString(10)}s ease opacity;` +
      '}' +
      `.${classPrefix}-figure img.${classPrefix}-thumbnail {` +
      '  -webkit-filter: blur(30px);' +
      '  filter: blur(30px);' +
      '  left: auto;' +
      '  position: relative;' +
      '  width: auto;' +
      '}' +
      `.${classPrefix}-figure img.${classPrefix}-loaded {` +
      '  opacity: 1;' +
      '}';

    const head = document.head || document.getElementsByTagName('head')[0];
    const style = document.createElement('style');
    style.appendChild(document.createTextNode(css));
    head.appendChild(style);
  }

  /**
   * Because we may be transitioning a very large number of elements on a
   * resize, and because we cannot reliably determine when all elements are
   * done transitioning, we have to approximate the amount of time it will take
   * for the browser to be expected to complete with a transition. This
   * constant gives the scale factor to apply to the given transition time. For
   * example, if transitionTimeoutScaleFactor is 1.5 and transition speed is
   * given as 500ms, we will wait 750ms before assuming that we are actually
   * done resizing.
   * @returns {number} Time in milliseconds before we can consider a resize to
   * !                 have been completed.
   */
  _getTransitionTimeout() {
    const transitionTimeoutScaleFactor = 1.5;
    return this.settings.transitionSpeed * transitionTimeoutScaleFactor;
  }

  /**
   * Gives the CSS property string to set for the transition value, depending
   * on whether or not we are transitioning.
   * @returns {string} A value for the `transition` CSS property.
   */
  _getTransitionString() {
    if (this.isTransitioning) {
      return `${(this.settings.transitionSpeed / 1000).toString(10)}s transform ease`;
    }

    return 'none';
  }

  /**
   * Computes the current value for `this.minAspectRatio`, using the
   * `getMinAspectRatio` function defined in the settings. Then,
   * `this.minAspectRatioRequiresTransition` will be set, depending on whether
   * or not the value of this.minAspectRatio has changed.
   */
  _recomputeMinAspectRatio() {
    const oldMinAspectRatio = this.minAspectRatio;
    this.minAspectRatio = this.settings.getMinAspectRatio(this.lastWindowWidth);

    if (
      oldMinAspectRatio !== null &&
      oldMinAspectRatio !== this.minAspectRatio
    ) {
      this.minAspectRatioRequiresTransition = true;
    } else {
      this.minAspectRatioRequiresTransition = false;
    }
  }

  /**
   * This computes the layout of the entire grid, setting the height, width,
   * translateX, translateY, and transition values for each ProgressiveImage in
   * `this.images`. These styles are set on the ProgressiveImage.style property,
   * but are not set on the DOM.
   *
   * This separation of concerns (computing layout and DOM manipulation) is
   * paramount to the performance of the PIG. While we need to manipulate the
   * DOM every time we scroll (adding or remove images, etc.), we only need to
   * compute the layout of the PIG on load and on resize. Therefore, this
   * function will compute the entire grid layout but will not manipulate the
   * DOM at all.
   *
   * All DOM manipulation occurs in `_doLayout`.
   */
  _computeLayout() {
    // Constants
    const wrapperWidth = this.container?.clientWidth || 0;

    // State
    let row: ProgressiveImage[] = []; // The list of images in the current row.
    let translateX = 0; // The current translateX value that we are at
    let translateY = 0; // The current translateY value that we are at
    let rowAspectRatio = 0; // The aspect ratio of the row we are building

    // Compute the minimum aspect ratio that should be applied to the rows.
    this._recomputeMinAspectRatio();

    // If we are not currently transitioning, and our minAspectRatio has just
    // changed, then we mark isTransitioning true. If this is the case, then
    // `this._getTransitionString()` will ensure that each image has a value
    // like "0.5s ease all". This will cause images to animate as they change
    // position. (They need to change position because the minAspectRatio has
    // changed.) Once we determine that the transition is probably over (using
    // `this._getTransitionTimeout`) we unset `this.isTransitioning`, so that
    // future calls to `_computeLayout` will set "transition: none".
    if (!this.isTransitioning && this.minAspectRatioRequiresTransition) {
      this.isTransitioning = true;
      setTimeout(() => {
        this.isTransitioning = false;
      }, this._getTransitionTimeout());
    }

    // Get the valid-CSS transition string.
    const transition = this._getTransitionString();

    // Loop through all our images, building them up into rows and computing
    // the working rowAspectRatio.
    [].forEach.call(this.images, (image: ProgressiveImage, index) => {
      rowAspectRatio += image.aspectRatio;
      row.push(image);

      // When the rowAspectRatio exceeds the minimum acceptable aspect ratio,
      // or when we're out of images, we say that we have all the images we
      // need for this row, and compute the style values for each of these
      // images.
      if (
        rowAspectRatio >= (this.minAspectRatio || 0) ||
        index + 1 === this.images.length
      ) {
        // Make sure that the last row also has a reasonable height
        rowAspectRatio = Math.max(rowAspectRatio, this.minAspectRatio || 0);

        // Compute this row's height.

        const totalDesiredWidthOfImages =
          wrapperWidth - this.settings.spaceBetweenImages * (row.length - 1);
        const rowHeight = totalDesiredWidthOfImages / rowAspectRatio;

        // For each image in the row, compute the width, height, translateX,
        // and translateY values, and set them (and the transition value we
        // found above) on each image.
        //
        // NOTE: This does not manipulate the DOM, rather it just sets the
        //       style values on the ProgressiveImage instance. The DOM nodes
        //       will be updated in _doLayout.
        row.forEach((img) => {
          const imageWidth = rowHeight * img.aspectRatio;

          // This is NOT DOM manipulation.
          img.style = {
            width: imageWidth,
            height: rowHeight,
            translateX,
            translateY,
            transition,
          };

          // The next image is this.settings.spaceBetweenImages pixels to the
          // right of this image.
          translateX += imageWidth + this.settings.spaceBetweenImages;
        });

        // Reset our state variables for next row.
        row = [];
        rowAspectRatio = 0;
        translateY += rowHeight + this.settings.spaceBetweenImages;
        translateX = 0;
      }
    });

    // No space below the last image
    this.totalHeight = translateY - this.settings.spaceBetweenImages;
  }

  /**
   * Update the DOM to reflect the style values of each image in the PIG,
   * adding or removing images appropriately.
   *
   * PIG ensures that there are not too many images loaded into the DOM at once
   * by maintaining a buffer region around the viewport in which images are
   * allowed, removing all images below and above. Because all of our layout
   * is computed using CSS transforms, removing an image above the buffer will
   * not cause the gird to reshuffle.
   *
   * The primary buffer is the buffer in the direction of the user's scrolling.
   * (Below if they are scrolling down, above if they are scrolling up.) The
   * size of this buffer determines the experience of scrolling down the page.
   *
   * The secondary buffer is the buffer in the opposite direction of the user's
   * scrolling.  The size of this buffer determines the experience of changing
   * scroll directions. (Too small, and we have to reload a ton of images above
   * the viewport if the user changes scroll directions.)
   *
   * While the entire grid has been computed, only images within the viewport,
   * the primary buffer, and the secondary buffer will exist in the DOM.
   *
   *
   * !           Illustration: the primary and secondary buffers
   *
   *
   * +---------------------------+
   * |                           |
   * |                           |
   * |                           |
   * |                           |
   * + - - - - - - - - - - - - - +                   -------
   * |                           |                      A
   * |     Secondary Buffer      |   this.setting.secondaryImageBufferHeight
   * |                           |                      V
   * +---------------------------+                   -------
   * |                           |                      A
   * |                           |                      |
   * |                           |                      |
   * |        Viewport           |              window.innerHeight
   * |                           |                      |
   * |                           |                      |
   * |                           |                      V
   * +---------------------------+                   -------
   * |                           |                      A
   * |                           |                      |
   * |                           |                      |
   * |                           |                      |
   * |      Primary Buffer       |    this.settings.primaryImageBufferHeight
   * |                           |                      |
   * |                           |                      |
   * |                           |                      |
   * |                           |                      V
   * + - - - - - - - - - - - - - +                   -------
   * |                           |
   * |    (Scroll direction)     |
   * |            |              |
   * |            |              |
   * |            V              |
   * |                           |
   *
   */
  _doLayout() {
    // Set the container height
    this.container.style.height = `${this.totalHeight}px`;

    // Get the top and bottom buffers heights.
    const bufferTop =
      this.scrollDirection === 'up'
        ? this.settings.primaryImageBufferHeight
        : this.settings.secondaryImageBufferHeight;
    const bufferBottom =
      this.scrollDirection === 'down'
        ? this.settings.secondaryImageBufferHeight
        : this.settings.primaryImageBufferHeight;

    // Now we compute the location of the top and bottom buffers:
    const containerOffset = this._getOffsetTop(this.container);

    const scrollerHeight =
      this.scroller === window
        ? window.innerHeight
        : (this.scroller as HTMLElement).offsetHeight;

    // This is the top of the top buffer. If the bottom of an image is above
    // this line, it will be removed.
    const minTranslateYPlusHeight =
      this.latestYOffset - containerOffset - bufferTop;

    // This is the bottom of the bottom buffer.  If the top of an image is
    // below this line, it will be removed.
    const maxTranslateY =
      this.latestYOffset - containerOffset + scrollerHeight + bufferBottom;

    // Here, we loop over every image, determine if it is inside our buffers or
    // no, and either insert it or remove it appropriately.
    this.images.forEach((image) => {
      const imageTranslateYAsNumber = image.style?.translateY || 0;
      const imageHeightAsNumber = image.style?.height || 0;
      if (
        imageTranslateYAsNumber + imageHeightAsNumber <
          minTranslateYPlusHeight ||
        imageTranslateYAsNumber > maxTranslateY
      ) {
        // Hide Image
        image.hide();
      } else {
        // Load Image
        image.load();
      }
    });
  }

  /**
   * Create our onScroll handler and return it.
   * @returns Our optimized onScroll handler that we should attach.
   */
  _getOnScroll() {
    /**
     * This function is called on scroll. It computes variables about the page
     * position and scroll direction, and then calls a _doLayout guarded by a
     * window.requestAnimationFrame.
     *
     * We use the boolean variable _this.inRAF to ensure that we don't overload
     * the number of layouts we perform by starting another layout while we are
     * in the middle of doing one.
     */
    const onScroll = () => {
      // Compute the scroll direction using the latestYOffset and the previousYOffset
      const newYOffset =
        this.scroller === window
          ? window.scrollY
          : (this.scroller as HTMLElement).scrollTop;
      this.previousYOffset = this.latestYOffset || newYOffset;
      this.latestYOffset = newYOffset;
      this.scrollDirection =
        this.latestYOffset > this.previousYOffset ? 'down' : 'up';

      // Call _this.doLayout, guarded by window.requestAnimationFrame
      if (!this.inRAF) {
        this.inRAF = true;
        window.requestAnimationFrame(() => {
          this._doLayout();
          this.inRAF = false;
        });
      }
    };

    return onScroll;
  }
}
