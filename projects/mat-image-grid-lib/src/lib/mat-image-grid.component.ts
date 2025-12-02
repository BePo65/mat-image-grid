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

enum ScrollDirection {
  'down',
  'up',
}

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

  @Input() PostViewportLoadBufferMultiplier = 3; // remove images before this point
  @Input() PostViewportDomBufferMultiplier = 1; // buffer for images that just scrolled out of view
  @Input() PreViewportDomBufferMultiplier = 1; // buffer for images that are ready to scroll into view
  @Input() PreViewportTriggerLoadBufferMultiplier = 1.9; // start loading more images, although we have more to scroll into view
  @Input() PreViewportLoadBufferMultiplier = 3; // remove images after this point
  @Input() ScrollDirectionChangeThreshold = 2; // minimum number of pixels to scroll, before a change in scroll direction is recognized
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
  private images: MigImage[] = []; // Cached data from server (with positions added)

  private containerWidth = window.innerWidth; // width of element that contains the image grid
  private containerHeight = 0; // height of element that contains the image grid
  private totalHeight = 0; // total height of the image grid
  private latestViewportTop = 0; // current top of the viewport
  private minAspectRatio: number | null = null;
  private scrollDirection: ScrollDirection = ScrollDirection.down;
  private triggerPointLoadImages = 0; // Y coordinate that will trigger loading more images from server

  private indexFirstLoadedImage = -1; // index of first loaded image in this.images

  // The position of images in this.images is only calculated for complete rows.
  // Images that have not yet been positioned can exist at the beginning or at
  // the end of this.images.
  private indexFirstPositionedImage = -1; // Index of the first positioned image in this.images.
  private indexLastPositionedImage = -1; // index of last positioned image in this.images

  // Images up to this index were already used to calculate the average values.
  // The average values are used to estimate / calculate the height of the whole image-grid.
  private indexLastImageEverPositioned = -1;
  private yBottomLastImageEverPositioned = -1;

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
    this.resetAverageValues();
    this.migContainerNative = this.migContainer.nativeElement;
    this.migGridNative = this.migGrid.nativeElement;
  }

  public ngOnDestroy(): void {
    this.dataSource?.disconnect(this);
    this.unsubscribe$.next();
    this.unsubscribe$.complete();
    this.clearImageData();
  }

  /**
   * Reset the variables used to create the floating average of
   * the height of a row and the number of images per row.
   * These values are used to calculate the total height of the grid,
   * even when we do not have loaded all images.
   */
  private resetAverageValues() {
    // reset values used to determine, when to add a value to the floating average
    this.indexLastImageEverPositioned = -1;
    this.yBottomLastImageEverPositioned = -1;

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
  }

  /**
   * Get the Y position of the top of an image.
   * @param index index of the image in this.images
   * @returns Y position of the top of an image
   */
  private topOfImage(index: number) {
    const yTop = this.images[index]?.yTop;
    return yTop !== undefined ? yTop : 0;
  }

  private get topFirstPositionedRow() {
    return this.topOfImage(this.indexFirstPositionedImage);
  }

  /**
   * Get the Y position of the bottom of an image including
   * the space between the rows.
   * @param index index of the image in this.images
   * @returns Y position of the bottom of the image including the space between the rows
   */
  private bottomOfImage(index: number) {
    const yBottom = this.images[index]?.yBottom;
    if (yBottom !== undefined) {
      return yBottom + this.spaceBetweenImages;
    }

    return 0;
  }

  private get bottomLastPositionedRow() {
    return this.bottomOfImage(this.indexLastPositionedImage);
  }

  /**
   * Get the y-position above the viewport, from where we don't need
   * images in the load buffer any more, when scrolling down.
   * @returns y-position of the start of the load buffer when scrolling down
   */
  private loadBufferStartScrollDown() {
    return (
      this.latestViewportTop -
      this.containerHeight *
        (this.PostViewportDomBufferMultiplier +
          this.PostViewportLoadBufferMultiplier)
    );
  }

  /**
   * Get the y-position above the viewport, from where we don't need
   * images in the load buffer any more, when scrolling up.
   * @returns y-position of the start of the load buffer when scrolling up
   */
  private loadBufferStartScrollUp() {
    return (
      this.latestViewportTop -
      this.containerHeight *
        (this.PreViewportDomBufferMultiplier +
          this.PreViewportLoadBufferMultiplier)
    );
  }

  /**
   * Get the y-position above the viewport, from where we don't need
   * images in the load buffer any more,
   * @returns y-position of the start of the load buffer
   */
  private get loadBufferStart() {
    if (this.scrollDirection === ScrollDirection.down) {
      return this.loadBufferStartScrollDown();
    }

    return this.loadBufferStartScrollUp();
  }

  /**
   * Get the y-position below the viewport, from where we don't need images
   * in the load buffer any more, when scrolling down.
   * @returns y-position of the end of the load buffer when scrolling down
   */
  private loadBufferEndScrollDown() {
    return (
      this.latestViewportTop +
      this.containerHeight *
        (1 +
          this.PreViewportDomBufferMultiplier +
          this.PreViewportLoadBufferMultiplier)
    );
  }

  /**
   * Get the y-position below the viewport, from where we don't need images
   * in the load buffer any more, when scrolling up.
   * @returns y-position of the end of the load buffer when scrolling up
   */
  private loadBufferEndScrollUp() {
    return (
      this.latestViewportTop +
      this.containerHeight *
        (1 +
          this.PostViewportDomBufferMultiplier +
          this.PostViewportLoadBufferMultiplier)
    );
  }

  /**
   * Get the y-position below the viewport, from where we don't need
   * images in the load buffer any more,
   * @returns y-position of the end of the load buffer
   */
  private get loadBufferEnd() {
    if (this.scrollDirection === ScrollDirection.down) {
      return this.loadBufferEndScrollDown();
    }

    return this.loadBufferEndScrollUp();
  }

  /**
   * Get the y-position above the viewport, from where we don't need
   * images in the DOM any more, when scrolling down.
   * @returns y-position of the start of the DOM buffer when scrolling down
   */
  private domBufferStartScrollDown() {
    return (
      this.latestViewportTop -
      this.containerHeight * this.PostViewportDomBufferMultiplier
    );
  }

  /**
   * Get the y-position above the viewport, from where we don't need
   * images in the DOM any more, when scrolling up.
   * @returns y-position of the start of the DOM buffer when scrolling up
   */
  private domBufferStartScrollUp() {
    return (
      this.latestViewportTop -
      this.containerHeight * this.PreViewportDomBufferMultiplier
    );
  }

  /**
   * Get the y-position above the viewport, from where we don't need
   * images in the DOM buffer any more,
   * @returns y-position of the start of the DOM buffer
   */
  private get domBufferStart() {
    if (this.scrollDirection === ScrollDirection.down) {
      return this.domBufferStartScrollDown();
    }

    return this.domBufferStartScrollUp();
  }

  /**
   * Get the y-position below the viewport, from where we don't need
   * images in the DOM any more, when scrolling down.
   * @returns y-position of the end of the DOM buffer when scrolling down
   */
  private domBufferEndScrollDown() {
    return (
      this.latestViewportTop +
      this.containerHeight * (1 + this.PreViewportDomBufferMultiplier)
    );
  }

  /**
   * Get the y-position below the viewport, from where we don't need
   * from where we don't need images in the DOM any more.
   * @returns y-position of the end of the DOM buffer when scrolling up
   */
  private domBufferEndScrollUp() {
    return (
      this.latestViewportTop +
      this.containerHeight * (1 + this.PostViewportDomBufferMultiplier)
    );
  }

  /**
   * Get the y-position below the viewport, from where we don't need
   * images in the DOM buffer any more,
   * @returns y-position of the end of the DOM buffer
   */
  private get domBufferEnd() {
    if (this.scrollDirection === ScrollDirection.down) {
      return this.domBufferEndScrollDown();
    }

    return this.domBufferEndScrollUp();
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
          if (this.migGrid === undefined) {
            // received data while the app is already shutting down
            return;
          }

          let adjustImageGridHeight = false;
          const startIndexForImport = serverImages.startImageIndex;
          const dataToImport = serverImages.content;

          // handle data to import at the end of this.images
          // or if this.images is empty
          const dataToEndOfImages = this.selectDataToImportAtEnd(
            dataToImport,
            startIndexForImport,
          );
          if (dataToEndOfImages.length > 0) {
            this.importImageDataAtEnd(dataToEndOfImages);
            adjustImageGridHeight = this.computeLayoutAtEnd(
              this.indexLastPositionedImage + 1,
              this.images.length,
            );
          }

          // handle data to import at the start of this.images
          const dataToStartOfImages = this.selectDataToImportAtStart(
            dataToImport,
            startIndexForImport,
          );
          if (dataToStartOfImages.length > 0) {
            this.importImageDataAtStart(
              dataToStartOfImages,
              startIndexForImport,
            );
            const endIndexExcl = Math.max(
              startIndexForImport + dataToStartOfImages.length,
              this.indexFirstPositionedImage,
            );
            this.computeLayoutAtStart(startIndexForImport, endIndexExcl);

            // if we scrolled to the start of the container, but the first row is below
            // or above the start of the container, then move all positioned images
            // to the correct position
            if (
              this.topFirstPositionedRow < 0 ||
              (this.topFirstPositionedRow > 0 &&
                this.indexFirstPositionedImage === 0)
            ) {
              // how many px do we have to move the loaded images down?
              // diffOfTopInPx is positive, if the first image has Y > 0 and negative else
              let diffOfTopInPx = this.topFirstPositionedRow;
              if (this.indexFirstPositionedImage !== 0) {
                // we are already at Y < 0 and this is not  the 1st image; therefore
                // we have even to add the estimated space required for the missing images
                diffOfTopInPx -=
                  (this.indexFirstPositionedImage /
                    this.averageImagesPerRow.average) *
                  this.averageHeightOfRow.average;
              }

              this.moveAllPositionedImagesBy(diffOfTopInPx);

              this.yBottomLastImageEverPositioned -= diffOfTopInPx;
              adjustImageGridHeight = true;
            }
          }

          if (dataToEndOfImages.length > 0 || dataToStartOfImages.length > 0) {
            if (adjustImageGridHeight) {
              this.setImageGridHeight();
            }
            this.showImagesInViewport();

            // load more images, if estimation of visible images was too little
            this.setReloadTrigger();
            this.fillViewport();

            // remove buffered data that is out of bounds for the current scroll position
            if (this.scrollDirection === ScrollDirection.down) {
              this.deleteImagesAtStart();
            } else {
              this.deleteImagesAtEnd();
            }
          }
        },
        error: (err: Error) =>
          console.error(`dataFromDataSourceImages: '${err.message}'`),
      });
  }

  /**
   * Get the definition for the data to import at the beginning of the images array.
   * @param imagesFromServer - list of images data returned by the server
   * @param indexOfFirstImageFromServer - where to place the first image from the server into this.images array
   * @returns ServerData[] with the definition for the data to import
   */
  private selectDataToImportAtStart(
    imagesFromServer: ServerData[],
    indexOfFirstImageFromServer: number,
  ): ServerData[] {
    let result = [] as ServerData[];

    if (imagesFromServer.length > 0) {
      if (
        this.indexFirstLoadedImage < 0 &&
        indexOfFirstImageFromServer === 0 &&
        this.images.length === 0
      ) {
        // import to empty images array
        result = imagesFromServer;
      } else if (
        indexOfFirstImageFromServer < this.indexFirstLoadedImage &&
        (this.scrollDirection === ScrollDirection.up ||
          this.topFirstPositionedRow > this.loadBufferStart)
      ) {
        // import to the start of the images array
        const importLength =
          this.indexFirstLoadedImage - indexOfFirstImageFromServer;
        if (imagesFromServer.length >= importLength) {
          // get segment of data to import into images array without creating holes;
          // on fast scrolling images requested from server may already have been
          // scrolled out of the buffer (start and end defined by the given limits)
          result = imagesFromServer.slice(0, importLength);
        }
      }
    }

    return result;
  }

  /**
   * Convert list of images information from server to internal representation required
   * by the image grid and add it to the start of this.images.
   * @param imageDataToAdd - list of Image details from server (information about each image)
   * @param startIndex - index in this.images array, where to insert the new images
   */
  private importImageDataAtStart(
    imageDataToAdd: ServerData[],
    startIndex: number,
  ): void {
    if (imageDataToAdd.length > 0) {
      const imagesFromImageData = this.parseImageData(
        imageDataToAdd,
        startIndex,
      );
      this.images.splice(
        startIndex,
        imagesFromImageData.length,
        ...imagesFromImageData,
      );

      // remember the new index of the first image in this.images
      if (
        this.indexFirstLoadedImage < 0 ||
        startIndex < this.indexFirstLoadedImage
      ) {
        this.indexFirstLoadedImage = startIndex;
      }
    }
  }

  /**
   * Extract the data to import at the end of the images array from the data returned by the server.
   * @param imagesFromServer - list of images data returned by the server
   * @param indexOfFirstImageFromServer - where to place the first image from the server into this.images array
   * @returns ServerData[] with the definition for the data to import
   */
  private selectDataToImportAtEnd(
    imagesFromServer: ServerData[],
    indexOfFirstImageFromServer: number,
  ): ServerData[] {
    let result = [] as ServerData[];

    if (imagesFromServer.length > 0) {
      if (
        this.indexFirstLoadedImage < 0 &&
        indexOfFirstImageFromServer === 0 &&
        this.images.length === 0
      ) {
        // import to empty images array
        result = imagesFromServer;
      } else if (
        indexOfFirstImageFromServer <= this.images.length &&
        (this.scrollDirection === ScrollDirection.down ||
          this.bottomLastPositionedRow < this.loadBufferEnd)
      ) {
        // add images not yet available in this.images to the end of the images array
        const startOfNewData = this.images.length - indexOfFirstImageFromServer;

        if (startOfNewData >= 0) {
          // get segment of data to import to images array without creating holes
          result = imagesFromServer.slice(startOfNewData);
        }
      }
    }
    return result;
  }

  /**
   * Convert list of images information from server to internal representation required
   * by the image grid and add it to the end of this.images.
   * @param imageDataToAppend - list of Image details (information about each image) to append
   */
  private importImageDataAtEnd(imageDataToAppend: ServerData[]): void {
    if (imageDataToAppend.length > 0) {
      const imagesFromImageData = this.parseImageData(
        imageDataToAppend,
        this.images.length,
      );
      this.images.splice(this.images.length, 0, ...imagesFromImageData);

      // on first load: remember where the image data starts
      if (this.indexFirstLoadedImage < 0) {
        this.indexFirstLoadedImage = 0;
      }
    }
  }

  /**
   *
   * subtract diffOfTopInPx from the Y position of each positioned image
   * to move all images in grid to a new vertical position.
   * @param diffOfTopInPx - number of pixels to subtract from the Y position of each image
   */
  private moveAllPositionedImagesBy(diffOfTopInPx: number): void {
    if (this.indexFirstPositionedImage < 0 || diffOfTopInPx === 0) {
      return;
    }

    for (
      let i = this.indexFirstPositionedImage;
      i <= this.indexLastPositionedImage;
      i++
    ) {
      const image = this.images[i];
      if (image?.style) {
        image.style.translateY -= diffOfTopInPx;
      }
    }
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

    if (this.migGridNative !== undefined) {
      this.renderer2.setStyle(this.migGridNative, 'height', 'auto');
    }
  }

  /**
   * Creates new instances of the MigImage class for each of the images defined in `imageData`.
   * @param imageData - An array of metadata about each image from the matImageGridImageService
   * @param startImageIndex - index of first image in imageData, after adding it to this.images array
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
   * to compute the layout of the mat-image-grid on loading new data and on resize.
   * Therefore, this function will compute the layout of the images in the given
   * range but will **not** manipulate the DOM at all.
   *
   * All DOM manipulation occurs in `showImagesInViewport`.
   *
   * This method handles positioning images at the start of the images list
   * (images that have been deleted, when scrolling down).
   * @param startIndex - index of the first image to position in grid
   * @param endIndexExclusive - index of the first image beyond the positioned range
   */
  private computeLayoutAtStart(startIndex: number, endIndexExclusive: number) {
    const wrapperWidth = this.containerWidth;
    let row: ProgressiveImage<ServerData>[] = []; // The list of images in the current row.
    let translateX = 0; // The current translateX value that we are at
    let translateY = this.topOfImage(endIndexExclusive); // The last translateY value that we are at
    let rowAspectRatio = 0; // The aspect ratio of the row we are building

    // limit loop defining values to prevent accessing non existing images
    const lowestIndex = Math.max(startIndex, 0);
    const highestIndex = Math.min(endIndexExclusive, this.images.length);

    // Loop through all our images in the given range, building them up into rows and computing
    // the working rowAspectRatio.
    for (let i = highestIndex - 1; i >= lowestIndex; i--) {
      const image = this.images[i];
      rowAspectRatio += image.aspectRatio;
      row.unshift(image);

      // When the rowAspectRatio exceeds the minimum acceptable aspect ratio
      // or when we reached the first image, we say that we have all the images
      // we need for this row, and compute the style values for each of these
      // images.
      if (rowAspectRatio >= (this.minAspectRatio ?? 0) || i - 1 < 0) {
        // Make sure that the first row gets not too high, if we have
        // not enough images to fill the row
        rowAspectRatio = Math.max(rowAspectRatio, this.minAspectRatio ?? 0);

        // Compute this row's height.
        const totalDesiredWidthOfImages =
          wrapperWidth - this.spaceBetweenImages * (row.length - 1);

        // round height of images to integer (as height has unit px)
        // round down to avoid horizontal scrollbar (rounding up, the image might be 1px too wide)
        const rowHeight = Math.floor(
          totalDesiredWidthOfImages / rowAspectRatio,
        );

        // fix position of row
        translateY -= rowHeight + this.spaceBetweenImages;

        // For each image in the row, compute the width, height, translateX,
        // and translateY values, and set them (and the transition value we
        // found above) on each image.
        //
        // NOTE: This does not manipulate the DOM, rather it just sets the
        //       style values on the ProgressiveImage instance. The DOM nodes
        //       will be updated in showImagesInViewport.
        row.forEach((img) => {
          const imageWidth = Math.floor(rowHeight * img.aspectRatio);

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

        this.indexFirstPositionedImage = i;

        // Reset our state variables for next row.
        row = [];
        rowAspectRatio = 0;
        translateX = 0;
      }
    }
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
   * to compute the layout of the mat-image-grid on loading new data and on resize.
   * Therefore, this function will compute the layout of the images in the given
   * range but will **not** manipulate the DOM at all.
   *
   * All DOM manipulation occurs in `showImagesInViewport`.
   *
   * This method handles positioning images at the end of the images list.
   * @param startIndex - index of the first image to position in grid
   * @param endIndexExclusive - index of the first image beyond the positioned range
   * @returns true=image grid height must be adjusted, as average values have been changed
   */
  private computeLayoutAtEnd(startIndex: number, endIndexExclusive: number) {
    const wrapperWidth = this.containerWidth;
    let row: ProgressiveImage<ServerData>[] = []; // The list of images in the current row.
    let rowAspectRatio = 0; // The aspect ratio of the row we are building
    let translateX = 0; // The current translateX value that we are at
    let translateY = this.bottomOfImage(startIndex - 1); // The bottom of the previous row
    let adjustImageGridHeight = false;

    // limit loop defining values to prevent accessing non existing images
    const startindexLimited = Math.max(startIndex, 0);
    const endIndexExclusiveLimited = Math.min(
      endIndexExclusive,
      this.images.length,
    );

    // Loop through all our images in the given range, building them up into rows and computing
    // the working rowAspectRatio.
    for (let i = startindexLimited; i < endIndexExclusiveLimited; i++) {
      const image = this.images[i];
      rowAspectRatio += image.aspectRatio;
      row.push(image);

      // When the rowAspectRatio exceeds the minimum acceptable aspect ratio
      // or when we're out of images, we say that we have all the images we
      // need for this row, and compute the style values for each of these
      // images.
      if (
        rowAspectRatio >= (this.minAspectRatio ?? 0) ||
        i + 1 >= this.serverDataTotals.totalFilteredElements
      ) {
        // Make sure that the last row also has a reasonable height
        rowAspectRatio = Math.max(rowAspectRatio, this.minAspectRatio ?? 0);

        // Compute this row's height.
        const totalDesiredWidthOfImages =
          wrapperWidth - this.spaceBetweenImages * (row.length - 1);

        // round height of images to integer (as height has unit px)
        // round down to avoid horizontal scrollbar (rounding up, the image might be 1px too wide)
        const rowHeight = Math.floor(
          totalDesiredWidthOfImages / rowAspectRatio,
        );

        // For each image in the row, compute the width, height, translateX,
        // and translateY values, and set them (and the transition value we
        // found above) on each image.
        //
        // NOTE: This does not manipulate the DOM, rather it just sets the
        //       style values on the ProgressiveImage instance. The DOM nodes
        //       will be updated in showImagesInViewport.
        row.forEach((img) => {
          const imageWidth = Math.floor(rowHeight * img.aspectRatio);

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

        this.indexLastPositionedImage = i;

        // if we did not yet call computeLayoutAtStart, then this is also the first positioned image
        if (this.indexFirstPositionedImage < 0) {
          this.indexFirstPositionedImage = startindexLimited;
        }

        translateY += rowHeight + this.spaceBetweenImages;
        adjustImageGridHeight = this.addRowToAverage(
          i,
          row.length,
          rowHeight,
          translateY,
        );

        // Reset our state variables for next row.
        row = [];
        rowAspectRatio = 0;
        translateX = 0;
      }
    }

    return adjustImageGridHeight;
  }

  /**
   * Add a row of images to the calculation of the average values.
   * Average values are the height of a row and the number of images per row.
   * The average values are used to estimate the required height of the image grid (even when not
   * all images have already been loaded).
   * @param indexLastImageInRow - index of the last image in the row
   * @param imagesInRow - number of images in the row
   * @param heightOfRow - height of the row
   * @param yBottomRow - Y of bottom of the row
   * @returns true=the average value has been changed
   */
  private addRowToAverage(
    indexLastImageInRow: number,
    imagesInRow: number,
    heightOfRow: number,
    yBottomRow: number,
  ) {
    let addedToAverage = false;

    if (indexLastImageInRow > this.indexLastImageEverPositioned) {
      // only consider row, when we never considered these images before
      this.averageImagesPerRow.addEntry(imagesInRow);
      this.averageHeightOfRow.addEntry(heightOfRow);
      addedToAverage = true;
    }

    if (indexLastImageInRow > this.indexLastImageEverPositioned) {
      this.indexLastImageEverPositioned = indexLastImageInRow;
      this.yBottomLastImageEverPositioned = yBottomRow;
    }
    return addedToAverage;
  }

  /**
   * Set y position where to start loading more images when scrolling down.
   */
  private setReloadTriggerScrollDown() {
    const offsetToTriggerPointFromBottom = Math.floor(
      this.containerHeight *
        (1 +
          this.PreViewportDomBufferMultiplier +
          this.PreViewportTriggerLoadBufferMultiplier),
    );

    this.triggerPointLoadImages = Math.min(
      this.latestViewportTop + offsetToTriggerPointFromBottom,
      this.bottomLastPositionedRow,
    );
  }

  /**
   * Set y position where to start loading more images when scrolling up.
   */
  private setReloadTriggerScrollUp() {
    const offsetToTriggerPointFromTop = Math.floor(
      this.containerHeight *
        (this.PreViewportDomBufferMultiplier +
          this.PreViewportTriggerLoadBufferMultiplier),
    );

    this.triggerPointLoadImages = Math.max(
      this.latestViewportTop - offsetToTriggerPointFromTop,
      this.topFirstPositionedRow,
    );
  }

  /**
   * Set y position where to start loading more images for
   * both scrolling directions.
   */
  private setReloadTrigger() {
    if (this.scrollDirection === ScrollDirection.down) {
      this.setReloadTriggerScrollDown();
    } else {
      this.setReloadTriggerScrollUp();
    }
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
   * The Pre-Buffers are the buffers in the direction the user is scrolling.
   * (Below if they are scrolling down, above if they are scrolling up.) The
   * size of this buffer determines the experience of scrolling down the page.
   *
   * The Post-Buffers are the buffers in the opposite direction of the users
   * scrolling. The size of this buffer determines the experience of changing
   * scroll directions. (Too small, and we have to reload a ton of images above
   * the viewport if the user changes scroll directions.)
   *
   * While the layout of all loaded images have been computed, only images within
   * the viewport, the PreViewportDomBuffer and the PostViewportDomBuffer will
   * exist in the DOM.
   */
  private showImagesInViewport() {
    if (this.indexFirstPositionedImage < 0) {
      // nothing to show
      return;
    }

    // This is the top of the DOM buffer (smallest Y value). If the bottom
    // of an image is above this line, it will be removed from the DOM.
    const minYInDom = Math.max(this.domBufferStart, 0);

    // This is the bottom of the DOM buffer (highest Y value). If the
    // top of an image is below this line, it will be removed from the DOM.
    const maxYInDom = this.domBufferEnd;

    for (
      let i = this.indexFirstPositionedImage;
      i <= this.indexLastPositionedImage;
      ++i
    ) {
      // ignore 'holes' in sparse array
      if (this.images[i] === undefined) {
        continue;
      }

      const image = this.images[i];
      const imageTranslateYAsNumber = image.style?.translateY ?? 0;
      const imageHeightAsNumber = image.style?.height ?? 0;
      const bottomOfImage = imageTranslateYAsNumber + imageHeightAsNumber;

      if (
        bottomOfImage < minYInDom ||
        imageTranslateYAsNumber > maxYInDom ||
        i > this.indexLastPositionedImage
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
    // Compute the scroll direction using the latestYOffset and the previousYOffset.
    // Prevent scrolling below the bottom of the grid (would  inadvertently change scrolling direction)
    const newYOffset = Math.min(
      this.migContainerNative.scrollTop,
      this.totalHeight,
    );
    const previousYOffset = this.latestViewportTop ?? newYOffset;
    this.latestViewportTop = newYOffset;
    const scrollTopChange = newYOffset - previousYOffset;

    if (Math.abs(scrollTopChange) >= this.ScrollDirectionChangeThreshold) {
      this.scrollDirection =
        scrollTopChange >= 0 ? ScrollDirection.down : ScrollDirection.up;
    }

    // Show / hide images according to new scroll position
    this.showImagesInViewport();

    // load more images, if required
    this.fillViewport();
  }

  /**
   * Delete images from the start of the load cache ('this.images') when scrolling down.
   */
  private deleteImagesAtStart() {
    // do nothing, if this.images is empty
    if (this.indexFirstLoadedImage < 0) {
      return;
    }

    // calculate Y of the top of the DOM buffer. If the bottom of an image
    // is above this line, it will be removed from the DOM.
    const heightDomBufferStart =
      this.containerHeight * this.PostViewportDomBufferMultiplier;
    const minYInDom = Math.max(
      this.latestViewportTop - heightDomBufferStart,
      0,
    );

    // calculate Y of the top of the load buffer. If the bottom of an image is above
    // this line, it will be removed from the load buffer (this.images).
    const heightLoadBufferStart =
      this.containerHeight * this.PostViewportLoadBufferMultiplier;
    const minYLoaded = Math.max(minYInDom - heightLoadBufferStart, 0);

    // do not delete the last positioned image, as we need it to get the y-position
    // of images added at the end of this.images
    for (
      let i = this.indexFirstLoadedImage;
      i < this.indexLastPositionedImage;
      i++
    ) {
      if (this.images[i].yBottom >= minYLoaded) {
        break;
      }

      this.images[i].hide();
      // eslint-disable-next-line @typescript-eslint/no-array-delete
      delete this.images[i];
      this.indexFirstLoadedImage = i + 1;

      this.indexFirstPositionedImage = this.indexFirstLoadedImage;
    }
  }

  /**
   * Delete images from the end of the load cache ('this.images') when scrolling up.
   */
  private deleteImagesAtEnd() {
    // calculate Y of the bottom of the DOM buffer. If the top of an image
    // is below this line, it will be removed from the DOM.
    const heightDomBufferEnd =
      this.containerHeight * this.PostViewportDomBufferMultiplier;
    const maxYInDom =
      this.latestViewportTop + this.containerHeight + heightDomBufferEnd;

    // calculate Y of the bottom of the load buffer. If the top of an image
    // is below this line, it will be removed from the load buffer (this.images).
    const heightLoadBufferEnd =
      this.containerHeight * this.PostViewportLoadBufferMultiplier;
    const maxYLoadBuffer = maxYInDom + heightLoadBufferEnd;

    let indexOfFirstImageToDelete = this.indexLastPositionedImage + 1;

    // do not delete the first positioned image, as we need it to get the y-position
    // of images to be added at the start of this image
    for (
      let i = this.images.length - 1;
      i > this.indexFirstPositionedImage;
      i--
    ) {
      const image = this.images[i];
      const yTop = image.yTop;
      if (yTop <= maxYLoadBuffer) {
        indexOfFirstImageToDelete = i + 1;
        break;
      }

      image.hide();
    }

    // set this.bottomOfLastPositionedRow; calculate from image and space between images
    if (indexOfFirstImageToDelete < this.images.length) {
      this.indexLastPositionedImage = Math.max(
        indexOfFirstImageToDelete - 1,
        0,
      );
    }

    // remove unneeded elements at end of cache
    this.images.splice(indexOfFirstImageToDelete);
  }

  private onResized() {
    this.containerHeight = this.migContainerNative.clientHeight;
    this.containerWidth = this.migContainerNative.clientWidth;
    this.minAspectRatio = this.getMinAspectRatio(this.containerWidth);
    this.resetAverageValues();

    // Reposition all loaded images
    const indexOfFirstVisibleImage = this.indexOfScrollTop();
    const adjustImageGridHeight = this.computeLayoutAtEnd(
      indexOfFirstVisibleImage,
      this.images.length,
    );
    this.computeLayoutAtStart(
      this.indexFirstLoadedImage,
      indexOfFirstVisibleImage,
    );

    if (adjustImageGridHeight) {
      this.setImageGridHeight();
    }
    this.setReloadTrigger(); // as viewportTop may have changed when setting total grid height
    this.showImagesInViewport();
    this.fillViewport();
  }

  /**
   * Get the index of the first image visible in viewport.
   * @returns index of the first visible image or -1 (if no image is visible)
   */
  private indexOfScrollTop() {
    const viewportTop = this.latestViewportTop;

    for (
      let i = this.indexFirstPositionedImage;
      i <= this.indexLastPositionedImage;
      i++
    ) {
      const image = this.images[i];
      if (image && image.yTop >= viewportTop) {
        return i;
      }
    }
    return -1; // No image found in the viewport
  }

  /**
   * Set the height of the images container based on the images already positioned
   * and on an estimation about the height required by the remaining images.
   * for the 'images already positioned' indexOfLastPositionedImage and
   * bottomOfLastPositionedRow is used; i.e. images that were once positioned and
   * then later removed while scrolling up are ignored.
   */
  private setImageGridHeight() {
    if (this.serverDataTotals.totalFilteredElements > 0) {
      const numberOfUnpositionedImages = Math.ceil(
        this.serverDataTotals.totalFilteredElements -
          (this.indexLastImageEverPositioned + 1),
      );
      this.totalHeight = Math.ceil(
        this.yBottomLastImageEverPositioned +
          (numberOfUnpositionedImages / this.averageImagesPerRow.average) *
            (this.averageHeightOfRow.average + this.spaceBetweenImages),
      );

      if (numberOfUnpositionedImages <= 0) {
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

    // set this.latestViewportTop to current scrollTop, as scrollTop changes, when container height is reduced
    this.latestViewportTop = this.migContainerNative.scrollTop;
  }

  /**
   * Request images from the dataSource to fill the viewport, the Pre- and the Post-ViewportDomBuffer
   * and the Pre- and the Post-ViewportLoadBuffer.
   */
  private fillViewport() {
    if (this.containerHeight === 0) {
      // get number of images on sever only
      this.requestDataFromServer(0, 0);
    } else {
      if (this.scrollDirection === ScrollDirection.down) {
        this.fillViewportScrollDown();
      } else {
        this.fillViewportScrollUp();
      }
    }
  }

  /**
   * Request images from the dataSource to fill the viewport and the buffers
   * when scrolling down.
   */
  private fillViewportScrollDown() {
    const bottomOfDomBuffer =
      this.latestViewportTop +
      this.containerHeight * (1 + this.PreViewportDomBufferMultiplier);

    if (
      bottomOfDomBuffer >= this.triggerPointLoadImages ||
      this.images.length === 0
    ) {
      // Calculate vertical space to fill starting from top of visible area
      const viewRangeAlreadyPositioned =
        this.bottomLastPositionedRow - this.latestViewportTop;

      const viewRangeRequired =
        this.containerHeight *
        (1 +
          this.PreViewportDomBufferMultiplier +
          this.PreViewportLoadBufferMultiplier);

      const rowsToRender = Math.ceil(
        (viewRangeRequired - viewRangeAlreadyPositioned) /
          this.averageHeightOfRow.average,
      );
      const imagesToRender = Math.ceil(
        rowsToRender * this.averageImagesPerRow.average,
      );
      const indexOfFirstImageToLoad = this.images.length;

      let indexOfLastImageToLoadExcl = Math.max(
        indexOfFirstImageToLoad + imagesToRender,
        0,
      );
      // limit last index to number of images on server, if available
      if (this.serverDataTotals.totalFilteredElements !== 0) {
        indexOfLastImageToLoadExcl = Math.min(
          indexOfLastImageToLoadExcl,
          this.serverDataTotals.totalFilteredElements,
        );
      }

      if (indexOfLastImageToLoadExcl > indexOfFirstImageToLoad) {
        this.requestDataFromServer(
          indexOfFirstImageToLoad,
          indexOfLastImageToLoadExcl,
        );
      }
    }
  }

  /**
   * Request images from the dataSource to fill the viewport and the buffers
   * when scrolling up.
   */
  private fillViewportScrollUp() {
    const topOfDomBuffer =
      this.latestViewportTop -
      this.containerHeight * this.PreViewportDomBufferMultiplier;

    if (topOfDomBuffer <= this.triggerPointLoadImages) {
      // Calculate vertical space to fill starting from top of visible area
      const viewRangeAlreadyPositioned =
        this.latestViewportTop - this.topFirstPositionedRow;

      const viewRangeRequired =
        this.containerHeight *
        (this.PreViewportDomBufferMultiplier +
          this.PreViewportLoadBufferMultiplier);

      const rowsToRender = Math.ceil(
        (viewRangeRequired - viewRangeAlreadyPositioned) /
          this.averageHeightOfRow.average,
      );
      const imagesToRender = Math.ceil(
        rowsToRender * this.averageImagesPerRow.average,
      );
      const indexOfLastImageToLoad = this.indexFirstLoadedImage - 1;
      const indexOfFirstImageToLoad = Math.max(
        indexOfLastImageToLoad - imagesToRender + 1,
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
    if (lastWindowWidth <= 500) {
      return 3.5;
    } else if (lastWindowWidth <= 640) {
      return 3.8;
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
