import { CommonModule } from '@angular/common';
import {
  AfterViewInit,
  Component,
  ElementRef,
  EventEmitter,
  Input,
  Output,
  ViewChild,
} from '@angular/core';
import { MatProgressBar } from '@angular/material/progress-bar';
import { BehaviorSubject } from 'rxjs';

import { OptimizedResize } from './classes/optimized-resize.class';
import { ProgressiveImage } from './classes/progressive-image.class';
import { RequestImagesRange } from './interfaces/pig-datastore-provider.interface';
import { ProgressiveImageConfiguration } from './interfaces/pig-image-configuration.interface';
import { PigImageData } from './interfaces/pig-image-data.interface';
import { MatImageGridImageServiceBase } from './mat-image-grid.service';

@Component({
  selector: 'mat-image-grid',
  standalone: true,
  imports: [CommonModule, MatProgressBar],
  templateUrl: './mat-image-grid.component.html',
  styleUrl: './mat-image-grid.component.scss',
})
export class MatImageGridLibComponent<
  PigImage extends ProgressiveImage = ProgressiveImage,
  ServerData extends PigImageData = PigImageData,
> implements AfterViewInit
{
  @Input() primaryImageBufferHeight = 1000;
  @Input() secondaryImageBufferHeight = 300;
  @Input() spaceBetweenImages = 8;
  @Input() transitionSpeed = 500;
  @Input() thumbnailSize = 20;
  @Input() withImageClickEvents = false;

  @Input({ required: true }) urlForSize: (
    filename: string,
    imageWidth: number,
    imageHeight: number,
  ) => string = this.urlForSizeDefault;
  @Input() createPigImage: (
    singleImageData: ServerData,
    index: number,
    configuration: ProgressiveImageConfiguration,
  ) => PigImage = this.createPigImageDefault;
  @Input() getMinAspectRatio: (lastWindowWidth: number) => number =
    this.getMinAspectRatioDefault;
  @Input() getImageSize: (lastWindowWidth: number) => number =
    this.getImageSizeDefault;
  @Output() numberOfImagesOnServer = new EventEmitter<number>();
  @Output() numberOfLoadedImages = new EventEmitter<number>();
  @Output() imageClicked = new EventEmitter<string>();

  private readonly loadingSubject = new BehaviorSubject<boolean>(false);
  public loading$ = this.loadingSubject.asObservable();

  private containerId = 'pigContainer';
  @ViewChild('pigContainer') private pigContainer!: ElementRef<HTMLDivElement>;

  private optimizedResize: OptimizedResize;
  private pigContainerNative!: HTMLDivElement; // Do not use before AfterViewInit
  private images: PigImage[] = [];
  private inRAF = false;
  private isTransitioning = false;
  private lastWindowWidth = window.innerWidth;
  private latestYOffset = 0;
  private minAspectRatio?: number;
  private minAspectRatioRequiresTransition = false;
  private onScroll = () => {};
  private previousYOffset = 0;
  private scrollDirection = 'down';
  private totalHeight = 0;

  // TODO can we drop these parameters with the help of view encapsulation?
  private classPrefix = 'pig';
  private figureTagName = 'figure';

  // TODO how to inject matImageGridImageService with type matching ServerData?
  constructor(
    private matImageGridImageService: MatImageGridImageServiceBase<ServerData>,
  ) {
    this.optimizedResize = new OptimizedResize();

    // Inject our boilerplate CSS.
    this.injectStyle(this.containerId, this.classPrefix, this.transitionSpeed);
  }

  public ngAfterViewInit(): void {
    this.pigContainerNative = this.pigContainer.nativeElement;
    this.getImageListFromServer();
  }

  /**
   * Enable scroll and resize handlers, and run a complete layout computation /
   * application.
   */
  public enable() {
    this.onScroll = this.getOnScroll();

    this.pigContainerNative.addEventListener('scroll', this.onScroll);

    this.onScroll();
    this.computeLayout();
    this.doLayout();

    this.optimizedResize.add(() => {
      this.lastWindowWidth = this.pigContainerNative.offsetWidth;
      this.computeLayout();
      this.doLayout();
    });
  }

  /**
   * Remove all scroll and resize listeners.
   */
  public disable() {
    this.pigContainerNative.removeEventListener('scroll', this.onScroll);
    this.optimizedResize.disable();
  }

  /**
   * Convert list of images information from server to internal list of images information.
   * This method must be called, while pig is disabled!
   * @param imageData - list of Image details (information about each image)
   */
  public setImageData(imageData: ServerData[]): void {
    this.images = this.parseImageData(imageData);
  }

  /**
   * Clear internal ist of images information.
   * This method must be called, while pig is disabled!
   */
  public clearImageData(): void {
    this.images.forEach((image) => {
      if (image.existsOnPage) {
        image.hide();
      }
      image.dispose();
    });
    this.images = this.parseImageData([]);
    this.pigContainerNative.style.height = 'auto';
  }

  /**
   * Get list of images from data store and show images in grid.
   * Emit total and filtered number of elements; indicate loading.
   */
  private getImageListFromServer() {
    const imagesRange = {
      startImageIndex: 0,
      numberOfImages: -1,
    } as RequestImagesRange;

    setTimeout(() => this.loadingSubject.next(true), 0);
    this.matImageGridImageService.getPagedData(imagesRange).subscribe({
      next: (serverResponse) => {
        this.disable();
        this.setImageData(serverResponse.content);
        this.enable();
        this.numberOfImagesOnServer.emit(serverResponse.totalElements);
        this.numberOfLoadedImages.emit(serverResponse.returnedElements);
        this.loadingSubject.next(false);
      },
      error: (err: Error) => console.error(err.message),
    });
  }

  /**
   * Creates new instances of the PigImage class for each of the images defined in `imageData`.
   * @param imageData - An array of metadata about each image from the matImageGridImageService
   * @returns An array of PigImage instances
   */
  private parseImageData(imageData: ServerData[]): PigImage[] {
    const progressiveImages: PigImage[] = [];
    const configurationParameters = {
      classPrefix: this.classPrefix,
      thumbnailSize: this.thumbnailSize,
      figureTagName: this.figureTagName,
      lastWindowWidth: this.lastWindowWidth,
      container: this.pigContainer,
      withClickEvent: this.withImageClickEvents,
      getImageSize: this.getImageSize,
      urlForSize: this.urlForSize,
    } as ProgressiveImageConfiguration;

    imageData.forEach((image, index) => {
      const progressiveImage = this.createPigImage(
        image,
        index,
        configurationParameters,
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
  private getOffsetTop(elem: HTMLElement) {
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

  // TODO injectStyle creates global classes to use for the created figure elements
  // TODO can we create them in the scss of this component?
  /**
   * Inject CSS needed to make the grid work in the <head></head>.
   * @param containerId - ID of the container for the images.
   * @param classPrefix - The prefix associated with this library that should be prepended to classnames.
   * @param transitionSpeed - Animation duration in milliseconds
   */
  private injectStyle(
    containerId: string,
    classPrefix: string,
    transitionSpeed: number,
  ) {
    const css =
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
  private getTransitionTimeout() {
    const transitionTimeoutScaleFactor = 1.5;
    return this.transitionSpeed * transitionTimeoutScaleFactor;
  }

  /**
   * Gives the CSS property string to set for the transition value, depending
   * on whether or not we are transitioning.
   * @returns {string} A value for the `transition` CSS property.
   */
  private getTransitionString() {
    if (this.isTransitioning) {
      return `${(this.transitionSpeed / 1000).toString(10)}s transform ease`;
    }

    return 'none';
  }

  /**
   * Computes the current value for `this.minAspectRatio`, using the
   * `getMinAspectRatio` function defined in the settings. Then,
   * `this.minAspectRatioRequiresTransition` will be set, depending on whether
   * or not the value of this.minAspectRatio has changed.
   */
  private recomputeMinAspectRatio() {
    const oldMinAspectRatio = this.minAspectRatio;
    this.minAspectRatio = this.getMinAspectRatio(this.lastWindowWidth);

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
  private computeLayout() {
    // Constants
    const wrapperWidth = this.pigContainerNative.clientWidth;

    // State
    let row: ProgressiveImage[] = []; // The list of images in the current row.
    let translateX = 0; // The current translateX value that we are at
    let translateY = 0; // The current translateY value that we are at
    let rowAspectRatio = 0; // The aspect ratio of the row we are building

    // Compute the minimum aspect ratio that should be applied to the rows.
    this.recomputeMinAspectRatio();

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
      }, this.getTransitionTimeout());
    }

    // Get the valid-CSS transition string.
    const transition = this.getTransitionString();

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
          wrapperWidth - this.spaceBetweenImages * (row.length - 1);
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
          translateX += imageWidth + this.spaceBetweenImages;
        });

        // Reset our state variables for next row.
        row = [];
        rowAspectRatio = 0;
        translateY += rowHeight + this.spaceBetweenImages;
        translateX = 0;
      }
    });

    // No space below the last image
    this.totalHeight = translateY - this.spaceBetweenImages;
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
  private doLayout() {
    // Set the container height
    this.pigContainerNative.style.height = `${this.totalHeight}px`;

    // Get the top and bottom buffers heights.
    const bufferTop =
      this.scrollDirection === 'up'
        ? this.primaryImageBufferHeight
        : this.secondaryImageBufferHeight;
    const bufferBottom =
      this.scrollDirection === 'down'
        ? this.secondaryImageBufferHeight
        : this.primaryImageBufferHeight;

    // Now we compute the location of the top and bottom buffers:
    const containerOffset = this.getOffsetTop(this.pigContainerNative);

    const scrollerHeight = this.pigContainerNative.offsetHeight;

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
  private getOnScroll() {
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
      const newYOffset = this.pigContainerNative.scrollTop;
      this.previousYOffset = this.latestYOffset || newYOffset;
      this.latestYOffset = newYOffset;
      this.scrollDirection =
        this.latestYOffset > this.previousYOffset ? 'down' : 'up';

      // Call _this.doLayout, guarded by window.requestAnimationFrame
      if (!this.inRAF) {
        this.inRAF = true;
        window.requestAnimationFrame(() => {
          this.doLayout();
          this.inRAF = false;
        });
      }
    };

    return onScroll;
  }

  /**
   * Default implementation of the function that gets the URL for an image with the given filename & size.
   * @param filename - The filename of the image.
   * @param imageWidth - The width (in pixels) of the image.
   * @param imageHeight - The height (in pixels) of the image.
   * @returns The URL of the image with the given size.
   */
  private urlForSizeDefault(
    this: void,
    filename: string,
    imageWidth: number,
    imageHeight: number,
  ): string {
    return `/${filename}/${imageWidth.toString(10)}/${imageHeight.toString(10)}`;
  }

  /**
   * Create a new instance of the PigImage class.
   * The PigImage class represents 1 image in the image grid.
   * @param singleImageData - Data from the server describing the image.
   * @param index - Index of the image in the list of all images (0..n-1).
   * @param configuration - Prefix of the css classes used for this image
   * @returns New instance of the PigImage class.
   */
  private createPigImageDefault(
    this: void,
    singleImageData: ServerData,
    index: number,
    configuration: ProgressiveImageConfiguration,
  ): PigImage {
    return new ProgressiveImage(
      singleImageData,
      index,
      configuration,
    ) as PigImage;
  }

  /**
   * Default implementation to get the minimum required aspect ratio for a
   * valid row of images. The perfect rows are maintained by building up a
   * row of images by adding together their aspect ratios (the aspect ratio
   * when they are placed next to each other) until that aspect ratio exceeds
   * the value returned by this function. Responsive reordering is achieved
   * through changes to what this function returns at different values of the
   * passed parameter `lastWindowWidth`.
   * @param lastWindowWidth - The last computed width of the browser window.
   * @returns The minimum aspect ratio at this window width.
   */
  private getMinAspectRatioDefault(this: void, lastWindowWidth: number) {
    if (lastWindowWidth <= 640) {
      return 2;
    } else if (lastWindowWidth <= 1280) {
      return 4;
    } else if (lastWindowWidth <= 1920) {
      return 5;
    }
    return 6;
  }

  /**
   * Default implementation to get the image size (height in pixels) to use
   * for this window width.
   * Responsive resizing of images is achieved through changes to what this
   * function returns at different values of the passed parameter `lastWindowWidth`.
   * @param lastWindowWidth - The last computed width of the images container.
   * @returns The size (height in pixels) of the images to load.
   */
  private getImageSizeDefault(this: void, lastWindowWidth: number): number {
    if (lastWindowWidth <= 640) {
      return 100;
    } else if (lastWindowWidth <= 1920) {
      return 250;
    }
    return 500;
  }
}
