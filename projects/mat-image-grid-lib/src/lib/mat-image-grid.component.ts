import { CommonModule, DOCUMENT } from '@angular/common';
import {
  AfterViewInit,
  Component,
  ElementRef,
  EventEmitter,
  Inject,
  Input,
  NgZone,
  OnDestroy,
  OnInit,
  Output,
  Renderer2,
  ViewChild,
} from '@angular/core';
import { MatProgressBar } from '@angular/material/progress-bar';
import { BehaviorSubject } from 'rxjs';

import { OptimizedResize } from './classes/optimized-resize.class';
import { ProgressiveImage } from './classes/progressive-image.class';
import { RequestImagesRange } from './interfaces/datastore-provider.interface';
import {
  CreateMigImage,
  GetImageSize,
  GetMinAspectRatio,
  UnloadHandler,
  UrlForSize,
} from './interfaces/mig-common.types';
import { MigImageConfiguration } from './interfaces/mig-image-configuration.interface';
import { MigImageData } from './interfaces/mig-image-data.interface';
import { MatImageGridImageServiceBase } from './services/mat-image-grid.service';

@Component({
  selector: 'mat-image-grid',
  standalone: true,
  imports: [CommonModule, MatProgressBar],
  templateUrl: './mat-image-grid.component.html',
  styleUrl: './mat-image-grid.component.scss',
})
export class MatImageGridLibComponent<
    MigImage extends ProgressiveImage = ProgressiveImage,
    ServerData extends MigImageData = MigImageData,
  >
  implements AfterViewInit, OnDestroy
{
  @Input() primaryImageBufferHeight = 1000;
  @Input() secondaryImageBufferHeight = 300;
  @Input() spaceBetweenImages = 8;
  @Input() thumbnailSize = 20;
  @Input() withImageClickEvents = false;

  @Input({ required: true }) urlForSize: UrlForSize = this.urlForSizeDefault;
  @Input() createMigImage: CreateMigImage<ServerData, MigImage> =
    this.createMigImageDefault;
  @Input() getMinAspectRatio: GetMinAspectRatio = this.getMinAspectRatioDefault;
  @Input() getImageSize: GetImageSize = this.getImageSizeDefault;
  @Output() numberOfImagesOnServer = new EventEmitter<number>();
  @Output() numberOfLoadedImages = new EventEmitter<number>();
  @Output() imageClicked = new EventEmitter<string>();

  private readonly loadingSubject = new BehaviorSubject<boolean>(false);
  public loading$ = this.loadingSubject.asObservable();

  @ViewChild('migContainer') private migContainer!: ElementRef<HTMLDivElement>;
  private optimizedResize!: OptimizedResize; // Do not use before AfterViewInit
  private migContainerNative!: HTMLDivElement; // Do not use before AfterViewInit
  private images: MigImage[] = [];
  private inRAF = false;
  private lastWindowWidth = window.innerWidth;
  private latestYOffset = 0;
  private minAspectRatio: number | null = null;
  private onScroll = () => {};
  private onscrollUnloadHandler: UnloadHandler | null = null;
  private previousYOffset = 0;
  private scrollDirection = 'down';
  private totalHeight = 0;

  constructor(
    @Inject(DOCUMENT) private readonly documentRef: Document,
    private renderer2: Renderer2,
    private zone: NgZone,
    private matImageGridImageService: MatImageGridImageServiceBase<ServerData>,
  ) {}

  public ngAfterViewInit(): void {
    this.migContainerNative = this.migContainer.nativeElement;
    this.optimizedResize = new OptimizedResize(
      this.documentRef,
      this.renderer2,
      this.zone,
      this.migContainerNative,
    );
    this.getImageListFromServer();
  }

  public ngOnDestroy(): void {
    this.disable();
    this.optimizedResize.dispose();
    this.clearImageData();
  }

  /**
   * Enable scroll and resize handlers, and run a complete layout computation /
   * application.
   */
  public enable() {
    this.onScroll = this.getOnScroll();
    this.onscrollUnloadHandler?.();
    this.onscrollUnloadHandler = this.renderer2.listen(
      this.migContainerNative,
      'scroll',
      this.onScroll,
    );

    this.onScroll();
    this.computeLayout();
    this.doLayout();

    this.optimizedResize.add(() => {
      this.lastWindowWidth = this.migContainerNative.offsetWidth;
      this.computeLayout();
      this.doLayout();
    });
  }

  /**
   * Remove all scroll and resize listeners.
   */
  public disable() {
    if (this.onscrollUnloadHandler) {
      this.onscrollUnloadHandler();
      this.onscrollUnloadHandler = null;
    }

    this.optimizedResize.disable();
  }

  /**
   * Convert list of images information from server to internal list of images information.
   * This method must be called, while material-image-grid is disabled (with method 'disable()')!
   * @param imageData - list of Image details (information about each image)
   */
  public setImageData(imageData: ServerData[]): void {
    this.images = this.parseImageData(imageData);
  }

  /**
   * Clear internal ist of images information.
   * This method must be called, while material-image-grid is disabled (with method 'disable()')!
   */
  public clearImageData(): void {
    this.images.forEach((image) => {
      if (image.existsOnPage) {
        image.hide();
      }
      image.dispose();
    });

    this.renderer2.setStyle(this.migContainerNative, 'height', 'auto');
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
   * Creates new instances of the MigImage class for each of the images defined in `imageData`.
   * @param imageData - An array of metadata about each image from the matImageGridImageService
   * @returns An array of MigImage instances
   */
  private parseImageData(imageData: ServerData[]): MigImage[] {
    const progressiveImages: MigImage[] = [];
    const configurationParameters = {
      container: this.migContainer,
      thumbnailSize: this.thumbnailSize,
      lastWindowWidth: this.lastWindowWidth,
      withClickEvent: this.withImageClickEvents,
      getImageSize: this.getImageSize,
      urlForSize: this.urlForSize,
    } as MigImageConfiguration;

    imageData.forEach((image, index) => {
      const progressiveImage = this.createMigImage(
        this.renderer2,
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

  /**
   * This computes the layout of the entire grid, setting the height, width,
   * translateX, translateY, and transition values for each ProgressiveImage in
   * `this.images`. These styles are set on the ProgressiveImage.style property,
   * but are not set in the DOM.
   *
   * This separation of concerns (computing layout and DOM manipulation) is
   * paramount to the performance of mat-image-grid. While we need to manipulate
   * the DOM every time we scroll (adding or remove images, etc.), we only need
   * to compute the layout of the mat-image-grid on load and on resize. Therefore,
   * this function will compute the entire grid layout but will not manipulate the
   * DOM at all.
   *
   * All DOM manipulation occurs in `doLayout`.
   */
  private computeLayout() {
    // Constants
    const wrapperWidth = this.migContainerNative.clientWidth;

    // State
    let row: ProgressiveImage[] = []; // The list of images in the current row.
    let translateX = 0; // The current translateX value that we are at
    let translateY = 0; // The current translateY value that we are at
    let rowAspectRatio = 0; // The aspect ratio of the row we are building

    // Compute the minimum aspect ratio that should be applied to the rows.
    this.minAspectRatio = this.getMinAspectRatio(this.lastWindowWidth);

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
        //       will be updated in doLayout.
        row.forEach((img) => {
          const imageWidth = rowHeight * img.aspectRatio;

          // This is NOT DOM manipulation.
          img.style = {
            width: imageWidth,
            height: rowHeight,
            translateX,
            translateY,
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
   * Update the DOM to reflect the style values of each image in 'images',
   * adding or removing images appropriately.
   *
   * Mat-image-grid ensures that there are not too many images loaded into the
   * DOM at once by maintaining a buffer region around the viewport in which
   * images are allowed, removing all images below and above. Because all of
   * our layout is computed using CSS transforms, removing an image above the
   * buffer will not cause the grid to reshuffle.
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
    this.renderer2.setStyle(
      this.migContainerNative,
      'height',
      `${this.totalHeight}px`,
    );

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
    const containerOffset = this.getOffsetTop(this.migContainerNative);

    const scrollerHeight = this.migContainerNative.offsetHeight;

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
        image.hide();
      } else {
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
     * position and scroll direction, and then calls a doLayout guarded by a
     * window.requestAnimationFrame.
     *
     * We use the boolean variable _this.inRAF to ensure that we don't overload
     * the number of layouts we perform by starting another layout while we are
     * in the middle of doing one.
     */
    const onScroll = () => {
      // Compute the scroll direction using the latestYOffset and the previousYOffset
      const newYOffset = this.migContainerNative.scrollTop;
      this.previousYOffset = this.latestYOffset || newYOffset;
      this.latestYOffset = newYOffset;
      this.scrollDirection =
        this.latestYOffset > this.previousYOffset ? 'down' : 'up';

      // Call this.doLayout, guarded by window.requestAnimationFrame
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
   * Default implementation of the function that gets the URL for an image with the given ID & size.
   * @param imageId - The Id of the image (e.g. the filename).
   * @param imageWidth - The width (in pixels) of the image.
   * @param imageHeight - The height (in pixels) of the image.
   * @returns The URL of the image with the given size.
   */
  private urlForSizeDefault(
    this: void,
    imageId: string,
    imageWidth: number,
    imageHeight: number,
  ): string {
    return `/${imageId}/${imageWidth.toString(10)}/${imageHeight.toString(10)}`;
  }

  /**
   * Create a new instance of the MigImage class.
   * The MigImage class represents 1 image in the image grid.
   * @param renderer - Renderer to be injected into ProgressiveImage constructor.
   * @param singleImageData - Data from the server describing the image.
   * @param index - Index of the image in the list of all images (0..n-1).
   * @param configuration - Configuration data for this image.
   * @returns New instance of the MigImage class.
   */
  private createMigImageDefault(
    this: void,
    renderer: Renderer2,
    singleImageData: ServerData,
    index: number,
    configuration: MigImageConfiguration,
  ): MigImage {
    return new ProgressiveImage(
      renderer,
      singleImageData,
      index,
      configuration,
    ) as MigImage;
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
