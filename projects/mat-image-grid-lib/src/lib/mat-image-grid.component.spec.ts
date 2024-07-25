import { CollectionViewer } from '@angular/cdk/collections';
import {
  Component,
  DebugElement,
  Inject,
  InjectionToken,
  ViewChild,
} from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { BehaviorSubject, Observable, Subscription, first, of } from 'rxjs';

import 'zone.js/testing';

import { DataSourcePaged, Page } from '../public-api';

import { MigImageData } from './interfaces/mig-image-data.interface';
import { MatImageGridLibComponent } from './mat-image-grid.component';

type DemoComponentConfig = { numberOfImages: number };

type FigureCoordinates = { x: number; y: number };

const DEMO_COMPONENT_CONFIG = new InjectionToken<DemoComponentConfig>(
  'demo.component.config',
);

describe('MatImageGridLibComponent', () => {
  let component: DemoMigComponent;
  let fixture: ComponentFixture<DemoMigComponent>;
  const imagesOnFirstLoad = 4;
  const WaitForSubelementsTimeMs = 400;
  const testImageServiceConfig = {
    numberOfImages: 50,
  } as DemoComponentConfig;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [DemoMigComponent],
      imports: [MatImageGridLibComponent],
      providers: [
        { provide: DEMO_COMPONENT_CONFIG, useValue: testImageServiceConfig },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(DemoMigComponent);
    fixture.detectChanges();
    component = fixture.componentInstance;

    // wait for ProgressiveImage to create all subelements
    await new Promise((resolve) =>
      setTimeout(resolve, WaitForSubelementsTimeMs),
    );
    fixture.detectChanges();
  });

  it('should create instance', () => {
    expect(component).toBeTruthy();
  });

  it('should have figure entries', () => {
    const images = fixture.debugElement.queryAll(By.css('figure'));

    expect(images.length).toBeGreaterThanOrEqual(imagesOnFirstLoad);
  });

  it('should have img entries', () => {
    const figures = fixture.debugElement.queryAll(By.css('figure'));
    const images = fixture.debugElement.queryAll(By.css('img'));

    expect(figures.length).toBeGreaterThanOrEqual(imagesOnFirstLoad);
    expect(images.length).toBe(figures.length * 2);
  });

  it('should have thumbnail image entries with src attribute', () => {
    const figures = fixture.debugElement.queryAll(By.css('figure'));
    const thumbnailImages = fixture.debugElement.queryAll(
      By.css('img.mat-image-grid-thumbnail'),
    );

    expect(figures.length).toBeGreaterThanOrEqual(imagesOnFirstLoad);
    expect(thumbnailImages.length).toBe(figures.length);

    const thumbnailImages3 = thumbnailImages[2]
      .nativeElement as HTMLImageElement;

    // Strip pure image file name from url
    // Example of url: "http://demosite.com/images/test-image.jpg?image=00002&w=26&h=20"
    const srcQuery = thumbnailImages3.src.split('?', 2)[1];
    const queryElements = srcQuery.split('&');
    const src = queryElements[0].split('=')[1];
    const height = queryElements[2].split('=')[1];

    expect(src).toBe('00002');
    expect(height).toBe('20');
  });

  it('should have fullscreen image entries with src attribute', () => {
    const figures = fixture.debugElement.queryAll(By.css('figure'));
    const fullscreenImages = fixture.debugElement.queryAll(
      By.css('img.mat-image-grid-full-image'),
    );

    expect(figures.length).toBeGreaterThanOrEqual(imagesOnFirstLoad);
    expect(fullscreenImages.length).toBe(figures.length);

    const fullscreenImages5 = fullscreenImages[3]
      .nativeElement as HTMLImageElement;

    // Strip pure image file name from url
    const srcQuery = fullscreenImages5.src.split('?', 2)[1];
    const src = srcQuery.split('&', 1)[0].split('=', 2)[1];

    expect(src).toBe('00003');
  });

  it('should have several elements in first row of images', () => {
    const images = fixture.debugElement.queryAll(By.css('figure'));
    const firstRowImages = figuresInFirstRow(images);

    expect(firstRowImages.length).toBeGreaterThan(0);
    expect(firstRowImages.length).toBeLessThan(
      testImageServiceConfig.numberOfImages,
    );
  });

  it('should handle resize event', async () => {
    const fixtureNative = fixture.debugElement.nativeElement as HTMLDivElement;
    let images = fixture.debugElement.queryAll(By.css('figure'));
    let firstRowImages = figuresInFirstRow(images);
    const figuresInFirstRowBeforeResize = firstRowImages.length;

    expect(figuresInFirstRowBeforeResize).toBeGreaterThan(0);

    // change width of image grid container
    const originalWidth = fixtureNative.offsetWidth;
    fixtureNative.style.setProperty('width', `${originalWidth * 0.3}px`);

    // wait for resize to be handled
    await new Promise((resolve) =>
      setTimeout(resolve, WaitForSubelementsTimeMs),
    );

    images = fixture.debugElement.queryAll(By.css('figure'));
    firstRowImages = figuresInFirstRow(images);
    const figuresInFirstRowAfterResize = firstRowImages.length;

    expect(figuresInFirstRowAfterResize).toBeLessThan(
      figuresInFirstRowBeforeResize,
    );
  });
});

/**
 * Gets list of figure elements in the first row of image grid.
 * @param images - array of DebugElements representing the figure elements in the demo component
 * @returns array of DebugElements representing the figure elements in the first row of grid
 */
const figuresInFirstRow = (images: DebugElement[]) => {
  return images.filter((element: DebugElement) => {
    const figureElementNative = element.nativeElement as HTMLElement;
    const coordinatesArray = figureElementNative.style
      .getPropertyValue('transform')
      .slice(12, -1)
      .split(',');
    const coordinates = {
      x: parseInt(coordinatesArray[0]),
      y: parseInt(coordinatesArray[1]),
    } as FigureCoordinates;
    return coordinates.y === 0;
  });
};

/**
 * Class to get a list of information about the images to display in the demo pages.
 */
export class DemoDataSource<T extends MigImageData> extends DataSourcePaged<T> {
  private entriesInDatastore = 0;
  private readonly emptyPage = {
    content: [] as T[],
    startImageIndex: 0,
    returnedElements: 0,
    totalElements: 0,
    totalFilteredElements: 0,
  } as Page<T>;

  /** Stream emitting data to render. */
  private readonly _data: BehaviorSubject<Page<T>>;
  private collectionViewerSubscription!: Subscription;

  public constructor(
    @Inject(DEMO_COMPONENT_CONFIG) config: DemoComponentConfig,
  ) {
    super();
    this._data = new BehaviorSubject<Page<T>>(this.emptyPage);
    if (
      typeof config.numberOfImages === 'number' &&
      config.numberOfImages > 0
    ) {
      this.entriesInDatastore = config.numberOfImages;
    }
  }

  override connect(collectionViewer: CollectionViewer): Observable<Page<T>> {
    this.collectionViewerSubscription = collectionViewer.viewChange.subscribe(
      (listRange) => {
        const numberOfRequestedImages = Math.max(
          listRange.end - listRange.start,
          0,
        );

        this.getPagedData(listRange.start, numberOfRequestedImages)
          .pipe(first())
          .subscribe((page: Page<T>) => this._data.next(page));
      },
    );
    return this._data.asObservable();
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  override disconnect(collectionViewer: CollectionViewer): void {
    this.collectionViewerSubscription.unsubscribe();
  }

  private getPagedData(start: number, count: number): Observable<Page<T>> {
    const resultPage = {
      content: [],
      startImageIndex: start,
      returnedElements: 0,
      totalElements: 0,
      totalFilteredElements: 0,
    } as Page<T>;
    const numberOfImages =
      count === -1
        ? this.entriesInDatastore
        : Math.min(start + count, this.entriesInDatastore) - start;
    for (let i = 0; i < numberOfImages; i++) {
      const entry = {
        imageId: `${(start + i).toString().padStart(5, '0').slice(-5)}`,
        aspectRatio: 1.3,
      } as T;
      resultPage.returnedElements = resultPage.content.push(entry);
    }

    resultPage.totalElements = resultPage.returnedElements;
    resultPage.totalFilteredElements = resultPage.returnedElements;
    return of(resultPage);
  }
}

@Component({
  template:
    '<mat-image-grid [dataSource]="testDataSource" [urlForImage]="urlForImage"> loading... </mat-image-grid>',
})
class DemoMigComponent {
  @ViewChild(MatImageGridLibComponent)
  protected imageGrid!: MatImageGridLibComponent; // Do not use before ngAfterViewInit

  protected testDataSource: DemoDataSource<MigImageData>;

  private imagesBaseUrl = 'http://demosite.com/images';

  constructor(
    @Inject(DEMO_COMPONENT_CONFIG) dataSourceConfig: DemoComponentConfig,
  ) {
    this.testDataSource = new DemoDataSource(dataSourceConfig);
  }

  /**
   * Get the URL for an image with the given image data & dimensions.
   * Used by mat-image-grid 'urlForImage' parameter.
   * This demo uses an url like 'https://00201?w=800&h=600'.
   * @param singleImageData - The properties of one image (e.g. containing the imageId).
   * @param imageWidth - The width (in pixels) of the image.
   * @param imageHeight - The height (in pixels) of the image.
   * @returns The URL of the image with the given size.
   */
  protected urlForImage = (
    singleImageData: MigImageData,
    imageWidth: number,
    imageHeight: number,
  ) => {
    return `${this.imagesBaseUrl}/test-image.jpg?image=${singleImageData.imageId}&w=${imageWidth.toString(10)}&h=${imageHeight.toString(10)}`;
  };
}
