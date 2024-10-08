// TODO what is container?
// TODO what is viewport?

import { CollectionViewer, ListRange } from '@angular/cdk/collections';
import { CdkScrollable, ScrollingModule } from '@angular/cdk/scrolling';
import { CommonModule } from '@angular/common';
import {
  AfterViewInit,
  Component,
  ElementRef,
  EventEmitter,
  Input,
  NgZone,
  OnDestroy,
  OnInit,
  Output,
  Renderer2,
  ViewChild,
} from '@angular/core';
import { MatProgressBar } from '@angular/material/progress-bar';
import {
  Observable,
  Subject,
  animationFrameScheduler,
  asapScheduler,
  auditTime,
  delay,
  distinctUntilChanged,
  filter,
  map,
  startWith,
  takeUntil,
  tap,
} from 'rxjs';

import { FloatingAverage } from './classes/floating-average.class';
import { LoadingService } from './classes/loading-service.class';
import { ProgressiveImage } from './classes/progressive-image.class';
import { MigResizableDirective } from './directives/mig-resizable-directive';
import {
  DataSourcePaged,
  Page,
} from './interfaces/data-source-paged.interface';
import {
  CreateMigImage,
  GetImageSize,
  GetMinAspectRatio,
  UrlForImageFromDimensions,
} from './interfaces/mig-common.types';
import { MigImageConfiguration } from './interfaces/mig-image-configuration.interface';
import { MigImageData } from './interfaces/mig-image-data.interface';

type ServerDataTotals = {
  totalElements: number;
  totalFilteredElements: number;
};
type serverDataImages<T> = {
  content: T[];
  startImageIndex: number;
  returnedElements: number;
};

/**
 * Scheduler to be used for scroll events. Needs to fall back to
 * something that doesn't rely on requestAnimationFrame on environments
 * that don't support it (e.g. server-side rendering).
 */
const SCROLL_SCHEDULER =
  typeof requestAnimationFrame !== 'undefined'
    ? animationFrameScheduler
    : asapScheduler;

@Component({
  selector: 'mat-image-grid',
  standalone: true,
  imports: [
    CommonModule,
    MatProgressBar,
    MigResizableDirective,
    ScrollingModule,
  ],
  templateUrl: './mat-image-grid.component.html',
  styleUrl: './mat-image-grid.component.scss',
})
export class MatImageGridLibComponent<
    ServerData extends MigImageData = MigImageData,
    MigImage extends
      ProgressiveImage<ServerData> = ProgressiveImage<ServerData>,
  >
  implements AfterViewInit, OnDestroy, OnInit, CollectionViewer
{
  /**
   * Default implementation of the function that gets the URL for a thumbnail image with the given data & dimensions.
   * This is a arrow function as it uses the 'this' context of the instance.
   * This method is located here so that it can be used as a default value for 'urlForThumbnail'.
   * @param singleImageData - The properties of one image (e.g. containing the imageId).
   * @param imageWidth - The width (in pixels) of the image.
   * @param imageHeight - The height (in pixels) of the image.
   * @returns The URL of the image with the given size.
   */
  private urlForThumbnailDefault = (
    singleImageData: ServerData,
    imageWidth: number,
    imageHeight: number,
  ): string => {
    return this.urlForImage(singleImageData, imageWidth, imageHeight);
  };

  @Input() PreViewportLoadBufferMultiplier = 3;
  @Input() PostViewportLoadBufferMultiplier = 1;
  @Input() PreViewportDomBufferMultiplier = 1;
  @Input() PostViewportDomBufferMultiplier = 0.5;
  @Input() PreViewportTriggerLoadBufferMultiplier = 1;
  @Input() spaceBetweenImages = 8;
  @Input() thumbnailSize = 20;
  @Input() withImageClickEvents = false;

  @Input({ required: true }) dataSource!: DataSourcePaged<ServerData>; // Do not use before ngAfterViewInit
  @Input({ required: true })
  urlForImage: UrlForImageFromDimensions<ServerData> = this.urlForImageDefault;
  @Input() urlForThumbnail: UrlForImageFromDimensions<ServerData> =
    this.urlForThumbnailDefault;
  @Input() createMigImage: CreateMigImage<ServerData, MigImage> =
    this.createMigImageDefault;
  @Input() getMinAspectRatio: GetMinAspectRatio = this.getMinAspectRatioDefault;
  @Input() getImageSize: GetImageSize = this.getImageSizeDefault;
  @Output() numberOfImagesOnServer = new EventEmitter<number>();
  @Output() numberOfImagesOnServerFiltered = new EventEmitter<number>();
  @Output() imageClicked = new EventEmitter<ServerData>();

  /**
    Implementation of the 'CollectionViewer' interface.
    Used by the dataSource object as parameter of the connect method.
    Emits when the rendered view of the data changes.
   */
  public readonly viewChange = new Subject<ListRange>();
  public loading$: Observable<boolean>;

  @ViewChild('migContainer') private migContainer!: ElementRef<HTMLDivElement>;
  @ViewChild('migGrid') private migGrid!: ElementRef<HTMLDivElement>;
  @ViewChild(CdkScrollable) private scrollable!: CdkScrollable;
  @ViewChild(MigResizableDirective) private resizable!: MigResizableDirective;
  private migContainerNative!: HTMLDivElement; // Do not use before AfterViewInit
  private migGridNative!: HTMLDivElement; // Do not use before AfterViewInit
  private images: MigImage[] = [];
  private containerHeight = 0;
  private containerWidth = window.innerWidth;
  private latestViewportTop = 0;
  private yTriggerLoadImages = 0;
  private minAspectRatio: number | null = null;
  private previousYOffset = 0;
  private scrollDirection = 'down';
  private totalHeight = 0;
  private bottomOfLastPositionedRow = 0;
  private indexOfLastRenderedImage = -1;
  private averageImagesPerRow!: FloatingAverage; // Do not use before AfterViewInit
  private averageHeightOfRow!: FloatingAverage; // Do not use before AfterViewInit
  private serverDataTotals = {
    totalElements: 0,
    totalFilteredElements: 0,
  } as ServerDataTotals;

  private readonly unsubscribe$ = new Subject<void>();

  /** Emits when new data is available. */
  private dataFromDataSource!: Observable<Page<ServerData>>; // Do not use before AfterViewInit
  private dataFromDataSourceTotals!: Observable<ServerDataTotals>; // Do not use before AfterViewInit
  private dataFromDataSourceImages!: Observable<serverDataImages<ServerData>>; // Do not use before AfterViewInit

  /* request new data from server when range changes only */
  private requestDataFromServer$!: Subject<ListRange>;

  private loadingService: LoadingService;

  constructor(
    private renderer2: Renderer2,
    private ngZone: NgZone,
  ) {
    this.initRequestSubject();
    this.loadingService = new LoadingService();
    this.loading$ = this.loadingService.loading$.pipe(delay(0));
  }

  public ngOnInit(): void {
    this.dataFromDataSource = this.dataSource.connect(this);
    this.initDataFromDataSourceTotals();
    this.initDataFromDataSourceImages();
    this.initOnScroll();
  }

  public ngAfterViewInit(): void {
    this.initOnResize();

    this.averageHeightOfRow = new FloatingAverage(
      25,
      this.getImageSize(this.containerWidth),
    );

    const defaultAspectRatioForRow = this.getMinAspectRatio(
      this.containerWidth,
    );
    const defaultAspectRatioForImage = 0.75;
    this.averageImagesPerRow = new FloatingAverage(
      25,
      defaultAspectRatioForRow / defaultAspectRatioForImage,
    );

    this.migContainerNative = this.migContainer.nativeElement;
    this.migGridNative = this.migGrid.nativeElement;
  }

  public ngOnDestroy(): void {
    this.dataSource.disconnect(this);
    this.unsubscribe$.next();
    this.unsubscribe$.complete();
    this.clearImageData();
  }

  /**
   * Initialize requestDataFromServer$.
   * Remove duplicate requests and set loading indicator.
   */
  private initRequestSubject() {
    this.requestDataFromServer$ = new Subject<ListRange>();
    this.requestDataFromServer$
      .pipe(
        takeUntil(this.unsubscribe$),
        distinctUntilChanged((previous: ListRange, current: ListRange) => {
          return (
            previous.start === current.start && previous.end === current.end
          );
        }),
      )
      .subscribe((range) => {
        this.ngZone.run(() => this.loadingService.startRequest());
        this.viewChange.next(range);
      });
  }

  private initDataFromDataSourceTotals() {
    this.dataFromDataSourceTotals = this.dataFromDataSource.pipe(
      takeUntil(this.unsubscribe$),
      filter((entry) => entry.totalElements !== 0),
      map((serverResponse) => {
        return {
          totalElements: serverResponse.totalElements,
          totalFilteredElements: serverResponse.totalFilteredElements,
        } as ServerDataTotals;
      }),
    );
    this.dataFromDataSourceTotals.pipe(takeUntil(this.unsubscribe$)).subscribe({
      next: (serverTotals) => {
        this.serverDataTotals = { ...serverTotals };
        this.numberOfImagesOnServer.emit(serverTotals.totalElements);
        this.numberOfImagesOnServerFiltered.emit(
          serverTotals.totalFilteredElements,
        );
      },
      error: (err: Error) =>
        console.error(`dataFromDataSourceTotals: '${err.message}'`),
    });
  }

  private initDataFromDataSourceImages() {
    this.dataFromDataSourceImages = this.dataFromDataSource.pipe(
      takeUntil(this.unsubscribe$),
      map((serverResponse) => {
        return {
          content: serverResponse.content,
          startImageIndex: serverResponse.startImageIndex,
          returnedElements: serverResponse.returnedElements,
        } as serverDataImages<ServerData>;
      }),
      tap(() => this.ngZone.run(() => this.loadingService.receivedResponse())),
    );
    this.dataFromDataSourceImages
      .pipe(
        takeUntil(this.unsubscribe$),
        filter((entry) => entry.returnedElements !== 0),
      )
      .subscribe({
        next: (serverImages) => {
          let startIndexForImport = serverImages.startImageIndex;
          if (startIndexForImport > this.images.length) {
            console.error(
              `Data from server starts at index '${startIndexForImport}' but index of last image already loaded is '${this.images.length - 1}'.`,
            );
          }

          let dataToImport = serverImages.content;
          if (startIndexForImport < this.images.length) {
            dataToImport = serverImages.content.slice(
              this.images.length - startIndexForImport,
            );
            startIndexForImport = this.images.length;
          }

          if (dataToImport.length > 0) {
            this.setImageData(dataToImport, startIndexForImport);
          }

          const startIndex = this.indexOfLastRenderedImage + 1;
          const endIndexExclusive = Math.min(
            startIndexForImport + dataToImport.length,
            this.images.length,
          );
          this.computeLayout(startIndex, endIndexExclusive);
          this.showImagesInViewport();

          // load more images, if estimation of visible images was too little
          this.fillViewport();
        },
        error: (err: Error) =>
          console.error(`dataFromDataSourceImages: '${err.message}'`),
      });
  }

  private initOnScroll() {
    // It's still too early to measure the viewport at this point. Deferring with a promise allows
    // the Viewport to be rendered with the correct size before we measure. We run this outside the
    // zone to avoid causing more change detection cycles. We handle the change detection loop
    // ourselves instead.
    // eslint-disable-next-line @typescript-eslint/no-floating-promises
    this.ngZone.runOutsideAngular(() =>
      Promise.resolve().then(() => {
        this.scrollable
          .elementScrolled()
          .pipe(
            // Start off with a fake scroll event so we properly detect our initial position.
            startWith(null),

            // Collect multiple events into one until the next animation frame. This way if
            // there are multiple scroll events in the same frame we only need to recheck
            // our layout once.
            auditTime(0, SCROLL_SCHEDULER),
            takeUntil(this.unsubscribe$),
          )
          .subscribe(() => this.onContentScrolled());
      }),
    );
  }

  private initOnResize() {
    this.resizable.elementResized
      .pipe(takeUntil(this.unsubscribe$))
      .subscribe(() => {
        // ResizeObserver runs out of angular ngZone
        this.onResized();
      });
  }

  /**
   * Convert list of images information from server to internal list of images information.
   * This method must be called, while material-image-grid is disabled (with method 'disable()')!
   * @param imageData - list of Image details (information about each image)
   * @param startIndex - index in images array, where to insert den new images
   */
  private setImageData(imageData: ServerData[], startIndex: number): void {
    if (startIndex > this.images.length) {
      console.error(
        `Data from server is out of order; index '${startIndex}' is not the immediate successor of the data already loaded.`,
      );
    } else {
      const imagesFromImageData = this.parseImageData(imageData, startIndex);
      this.images.splice(
        startIndex,
        imagesFromImageData.length,
        ...imagesFromImageData,
      );
    }
  }

  // TODO do we need this?
  /**
   * Clear internal ist of images information.
   * This method must be called, while material-image-grid is disabled (with method 'disable()')!
   */
  private clearImageData(): void {
    this.images.forEach((image) => {
      if (image.existsOnPage) {
        image.hide();
      }
      image.dispose();
    });

    this.renderer2.setStyle(this.migGridNative, 'height', 'auto');
  }

  /**
   * Creates new instances of the MigImage class for each of the images defined in `imageData`.
   * @param imageData - An array of metadata about each image from the matImageGridImageService
   * @param startImageIndex - index of first image in imageData, if transferred to images array
   * @returns An array of MigImage instances
   */
  private parseImageData(
    imageData: ServerData[],
    startImageIndex: number,
  ): MigImage[] {
    const progressiveImages: MigImage[] = [];
    const configurationParameters = {
      container: this.migGrid,
      thumbnailSize: this.thumbnailSize,
      lastWindowWidth: this.containerWidth,
      withClickEvent: this.withImageClickEvents,
      getImageSize: this.getImageSize,
      urlForImage: this.urlForImage,
      urlForThumbnail: this.urlForThumbnail,
    } as MigImageConfiguration;

    let imageIndex = startImageIndex;
    imageData.forEach((image) => {
      const progressiveImage = this.createMigImage(
        this.renderer2,
        image,
        imageIndex++,
        configurationParameters,
      );

      if (this.withImageClickEvents) {
        progressiveImage.onClick$
          .pipe(takeUntil(this.unsubscribe$))
          // .subscribe(this.imageClicked);
          .subscribe((imageData) =>
            this.ngZone.run(() => this.imageClicked.next(imageData)),
          );
      }

      progressiveImages.push(progressiveImage);
    });

    // at this point the images do not yet have an (absolute) position
    return progressiveImages;
  }

  /**
   * This computes the layout of the images in the given range, setting the height,
   * width, translateX, translateY, and transition values for each ProgressiveImage
   * `this.images`. These styles are set on the ProgressiveImage.style property,
   * but are not set in the DOM.
   *
   * This separation of concerns (computing layout and DOM manipulation) is
   * paramount to the performance of mat-image-grid. While we need to manipulate
   * the DOM every time we scroll (adding or remove images, etc.), we only need
   * to compute the layout of the mat-image-grid on load and on resize. Therefore,
   * this function will compute the layout of the images in the given range but
   * will not manipulate the DOM at all.
   *
   * All DOM manipulation occurs in `showImagesInViewport`.
   * @param startIndex - index of the first image to position in grid
   * @param endIndexExclusive - index of the first image beyond the rendered range
   */
  private computeLayout(startIndex: number, endIndexExclusive: number) {
    // Constants
    const wrapperWidth = this.migContainerNative.clientWidth;

    // State
    let row: ProgressiveImage<ServerData>[] = []; // The list of images in the current row.
    let translateX = 0; // The current translateX value that we are at
    let translateY = this.bottomOfLastPositionedRow; // The current translateY value that we are at
    let rowAspectRatio = 0; // The aspect ratio of the row we are building

    // Loop through all our images, building them up into rows and computing
    // the working rowAspectRatio.
    for (let i = startIndex; i < endIndexExclusive; i++) {
      const image = this.images[i];
      rowAspectRatio += image.aspectRatio;
      row.push(image);

      // When the rowAspectRatio exceeds the minimum acceptable aspect ratio,
      // or when we're out of images, we say that we have all the images we
      // need for this row, and compute the style values for each of these
      // images.
      if (
        rowAspectRatio >= (this.minAspectRatio || 0) ||
        i + 1 >= this.serverDataTotals.totalFilteredElements
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
        //       will be updated in showImagesInViewport.
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

        this.indexOfLastRenderedImage = i;
        this.averageImagesPerRow.addEntry(row.length);
        this.averageHeightOfRow.addEntry(rowHeight);

        // Reset our state variables for next row.
        row = [];
        rowAspectRatio = 0;
        translateY += rowHeight + this.spaceBetweenImages;
        translateX = 0;
      }
    }

    this.bottomOfLastPositionedRow = translateY;
    const offsetToTriggerPoint = Math.max(
      this.containerHeight *
        (this.PreViewportLoadBufferMultiplier -
          this.PreViewportDomBufferMultiplier),
      0,
    );
    this.yTriggerLoadImages = Math.max(translateY - offsetToTriggerPoint, 0);

    // update viewport height as we updated 'bottomOfLastRow'
    this.setViewportHeight();
  }

  /**
   * Update the DOM to reflect the style values of each image in 'images'
   * field of this component, adding or removing images appropriately.
   *
   * Mat-image-grid ensures that there are not too many images loaded into the
   * DOM at once by maintaining buffer regions around the viewport in which
   * images are allowed, removing all images below and above. Because all of
   * our layout is computed using CSS transforms, removing an image above the
   * buffer will not cause the grid to reshuffle.
   *
   * The Pre- buffers are the buffers in the direction of the user's scrolling.
   * (Below if they are scrolling down, above if they are scrolling up.) The
   * size of this buffer determines the experience of scrolling down the page.
   *
   * The Post- buffers are the buffers in the opposite direction of the user's
   * scrolling.  The size of this buffer determines the experience of changing
   * scroll directions. (Too small, and we have to reload a ton of images above
   * the viewport if the user changes scroll directions.)
   *
   * While the layout of all loaded images have been computed, only images within
   * the viewport, the PreViewportDomBuffer, and the PostViewportDomBuffer
   * will exist in the DOM.
   */
  private showImagesInViewport() {
    const heightBufferTop =
      this.scrollDirection === 'down'
        ? this.containerHeight * this.PostViewportDomBufferMultiplier
        : this.containerHeight * this.PreViewportDomBufferMultiplier;
    const heightBufferBottom =
      this.scrollDirection === 'down'
        ? this.containerHeight * this.PreViewportDomBufferMultiplier
        : this.containerHeight * this.PostViewportDomBufferMultiplier;

    // This is the top of the top buffer. If the bottom of an image is above
    // this line, it will be removed from DOM.
    const minTranslateYPlusHeight = Math.max(
      this.latestViewportTop - heightBufferTop,
      0,
    );

    // This is the bottom of the bottom buffer. If the top of an image is
    // below this line, it will be removed from DOM.
    const maxTranslateY =
      this.latestViewportTop + this.containerHeight + heightBufferBottom;

    for (let i = 0; i < this.images.length; ++i) {
      const image = this.images[i];
      const imageTranslateYAsNumber = image.style?.translateY || 0;
      const imageHeightAsNumber = image.style?.height || 0;
      if (
        imageTranslateYAsNumber + imageHeightAsNumber <
          minTranslateYPlusHeight ||
        imageTranslateYAsNumber > maxTranslateY ||
        i > this.indexOfLastRenderedImage
      ) {
        image.hide();
      } else {
        image.load();
      }
    }
  }

  /**
   * Event handler for images grid scroll event (triggered by cdkScrollable).
   * When called in this.scrollable observable, this event handler runs outside
   * the Angular zone.
   */
  private onContentScrolled() {
    // Compute the scroll direction using the latestYOffset and the previousYOffset
    const newYOffset = this.migContainerNative.scrollTop;
    this.previousYOffset = this.latestViewportTop || newYOffset;
    this.latestViewportTop = newYOffset;
    this.scrollDirection =
      this.latestViewportTop >= this.previousYOffset ? 'down' : 'up';

    // Show / hide images according to new scroll position
    this.showImagesInViewport();

    // load more images, if required
    this.fillViewport();
  }

  private onResized() {
    this.bottomOfLastPositionedRow = 0;
    this.containerHeight = this.migContainerNative.offsetHeight;
    this.containerWidth = this.migContainerNative.offsetWidth;
    this.minAspectRatio = this.getMinAspectRatio(this.containerWidth);

    // Reposition all loaded images
    this.computeLayout(0, this.images.length);
    this.setViewportHeight();
    this.showImagesInViewport();
    this.fillViewport();
  }

  /**
   * Set the height of the images container based on images already rendered
   * and on an estimation about the height required by the remaining images.
   */
  private setViewportHeight() {
    if (this.serverDataTotals.totalFilteredElements > 0) {
      const numberOfUnloadedImages = Math.ceil(
        this.serverDataTotals.totalFilteredElements -
          (this.indexOfLastRenderedImage + 1),
      );
      this.totalHeight = Math.ceil(
        this.bottomOfLastPositionedRow +
          (numberOfUnloadedImages / this.averageImagesPerRow.average) *
            (this.averageHeightOfRow.average + this.spaceBetweenImages),
      );

      if (numberOfUnloadedImages <= 0) {
        this.totalHeight -= this.spaceBetweenImages;
      }
    } else {
      this.totalHeight = 0;
    }

    // Set the container height
    this.renderer2.setStyle(
      this.migGridNative,
      'height',
      `${this.totalHeight}px`,
    );
  }

  /**
   * Request images from dataSource to fill the viewport.
   */
  private fillViewport() {
    if (this.containerHeight === 0) {
      // get number of images on sever only
      this.requestDataFromServer(0, 0);
    } else {
      // TODO consider scroll direction!
      const bottomOfDomBuffer =
        this.migContainerNative.scrollTop +
        this.containerHeight * (1 + this.PreViewportDomBufferMultiplier);

      if (bottomOfDomBuffer >= this.yTriggerLoadImages) {
        // Calculate vertical space to fill starting from top of visible area
        const viewRangePositioned =
          this.bottomOfLastPositionedRow - this.migContainerNative.scrollTop;

        const viewRangeRequired =
          this.containerHeight *
          (1 +
            this.PreViewportDomBufferMultiplier +
            this.PreViewportLoadBufferMultiplier);

        const rowsToRender = Math.ceil(
          (viewRangeRequired - viewRangePositioned) /
            this.averageHeightOfRow.average,
        );
        const imagesToRender = Math.ceil(
          rowsToRender * this.averageImagesPerRow.average,
        );
        const indexOfFirstImageToLoad = this.images.length;
        const indexOfLastImageToLoad = Math.max(
          indexOfFirstImageToLoad + imagesToRender - 1,
          0,
        );
        if (indexOfLastImageToLoad >= indexOfFirstImageToLoad) {
          this.requestDataFromServer(
            indexOfFirstImageToLoad,
            indexOfLastImageToLoad + 1,
          );
        }
      }
    }
  }

  /**
   * Request images data from server.
   * @param indexStart - index of first image to load
   * @param indexEndExclusive - index of last image to load + 1
   */
  private requestDataFromServer(indexStart: number, indexEndExclusive: number) {
    // Send only requests that will return data
    const imagesAvailable = this.serverDataTotals.totalFilteredElements;
    if (
      indexEndExclusive > indexStart &&
      (indexStart < imagesAvailable || imagesAvailable === 0)
    ) {
      this.requestDataFromServer$.next({
        start: indexStart,
        end: indexEndExclusive,
      });
    } else {
      if (indexStart === indexEndExclusive) {
        // request number of images on server only
        this.requestDataFromServer$.next({
          start: 0,
          end: 0,
        });
      }
    }
  }

  /**
   * Default implementation of the function that gets the URL for an image with the given data & dimensions.
   * @param singleImageData - The properties of one image (e.g. containing the imageId).
   * @param imageWidth - The width (in pixels) of the image.
   * @param imageHeight - The height (in pixels) of the image.
   * @returns The URL of the image with the given size.
   */
  private urlForImageDefault(
    this: void,
    singleImageData: ServerData,
    imageWidth: number,
    imageHeight: number,
  ): string {
    return `/${singleImageData.imageId}/${imageWidth.toString(10)}/${imageHeight.toString(10)}`;
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
