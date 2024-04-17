import {
  Component,
  DebugElement,
  Inject,
  Injectable,
  InjectionToken,
} from '@angular/core';
import {
  ComponentFixture,
  ComponentFixtureAutoDetect,
  TestBed,
} from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { Observable, of } from 'rxjs';

import 'zone.js/testing';
import {
  FieldFilterDefinition,
  FieldSortDefinition,
  Page,
  RequestImagesRange,
} from './interfaces/datastore-provider.interface';
import { MigImageData } from './interfaces/mig-image-data.interface';
import { MatImageGridLibComponent } from './mat-image-grid.component';
import { MatImageGridImageServiceBase } from './mat-image-grid.service';

type MigMockupServiceConfig = { numberOfImages: number };

type FigureCoordinates = { x: number; y: number };

const IMAGE_SERVICE_CONFIG = new InjectionToken<MigMockupServiceConfig>(
  'mig.mockup.service.config',
);

describe('MatImageGridLibComponent', () => {
  let component: MatImageGridTestComponent;
  let fixture: ComponentFixture<MatImageGridTestComponent>;
  const WaitForSubelementsTimeMs = 120;
  const testImageServiceConfig = {
    numberOfImages: 50,
  } as MigMockupServiceConfig;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [MatImageGridTestComponent],
      imports: [MatImageGridLibComponent],
      providers: [
        {
          provide: MatImageGridImageServiceBase,
          useClass: MatImageGridMockupService,
        },
        { provide: ComponentFixtureAutoDetect, useValue: true },
        { provide: IMAGE_SERVICE_CONFIG, useValue: testImageServiceConfig },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(MatImageGridTestComponent);
    fixture.detectChanges();
    component = fixture.componentInstance;
  });

  it('should create instance', () => {
    expect(component).toBeTruthy();
  });

  it('should have figure entries', () => {
    const images = fixture.debugElement.queryAll(By.css('figure'));

    expect(images).toHaveSize(testImageServiceConfig.numberOfImages);
  });

  it('should have img entries', async () => {
    // wait for ProgressiveImage to create all subelements
    await new Promise((resolve) =>
      setTimeout(resolve, WaitForSubelementsTimeMs),
    );
    const images = fixture.debugElement.queryAll(By.css('img'));

    expect(images).toHaveSize(testImageServiceConfig.numberOfImages * 2);
  });

  it('should have thumbnail image entries with src attribute', async () => {
    // wait for ProgressiveImage to create all subelements
    await new Promise((resolve) =>
      setTimeout(resolve, WaitForSubelementsTimeMs),
    );
    const thumbnailImages = fixture.debugElement.queryAll(
      By.css('img.mat-image-grid-thumbnail'),
    );

    expect(thumbnailImages).toHaveSize(testImageServiceConfig.numberOfImages);

    const thumbnailImages3 = thumbnailImages[2]
      .nativeElement as HTMLImageElement;

    // Strip pure image file name from url
    const srcQuery = thumbnailImages3.src.split('?', 2)[1];
    const src = srcQuery.split('&', 1)[0].split('=', 2)[1];

    expect(src).toBe('00002');
  });

  it('should have fullscreen image entries with src attribute', async () => {
    // wait for ProgressiveImage to create all subelements
    await new Promise((resolve) =>
      setTimeout(resolve, WaitForSubelementsTimeMs),
    );
    const fullscreenImages = fixture.debugElement.queryAll(
      By.css('img.mat-image-grid-full-image'),
    );

    expect(fullscreenImages).toHaveSize(testImageServiceConfig.numberOfImages);

    const fullscreenImages5 = fullscreenImages[4]
      .nativeElement as HTMLImageElement;

    // Strip pure image file name from url
    const srcQuery = fullscreenImages5.src.split('?', 2)[1];
    const src = srcQuery.split('&', 1)[0].split('=', 2)[1];

    expect(src).toBe('00004');
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

@Injectable()
class MatImageGridMockupService extends MatImageGridImageServiceBase {
  private entriesInDatastore = 0;

  constructor(@Inject(IMAGE_SERVICE_CONFIG) config: MigMockupServiceConfig) {
    super();
    if (
      typeof config.numberOfImages === 'number' &&
      config.numberOfImages > 0
    ) {
      this.entriesInDatastore = config.numberOfImages;
    }
  }

  public override getPagedData(
    imagesRange: RequestImagesRange,
    /* eslint-disable @typescript-eslint/no-unused-vars */
    sorts?: FieldSortDefinition<MigImageData>[],
    filters?: FieldFilterDefinition<MigImageData>[],
    /* eslint-enable @typescript-eslint/no-unused-vars */
  ): Observable<Page<MigImageData>> {
    const resultPage = {
      content: [],
      startImageIndex: imagesRange.startImageIndex,
      returnedElements: 0,
      totalElements: 0,
      totalFilteredElements: 0,
    } as Page<MigImageData>;
    const numberOfImages =
      imagesRange.numberOfImages === -1
        ? this.entriesInDatastore
        : Math.min(
            imagesRange.startImageIndex + imagesRange.numberOfImages,
            this.entriesInDatastore,
          ) - imagesRange.startImageIndex;
    for (let i = 0; i < numberOfImages; i++) {
      const entry = {
        imageId: `${(imagesRange.startImageIndex + i).toString().padStart(5, '0').slice(-5)}`,
        aspectRatio: 1.3,
      } as MigImageData;
      resultPage.returnedElements = resultPage.content.push(entry);
    }

    resultPage.totalElements = resultPage.returnedElements;
    resultPage.totalFilteredElements = resultPage.returnedElements;
    return of(resultPage);
  }
}

@Component({
  template:
    '<mat-image-grid [urlForSize]="urlForSize"> loading... </mat-image-grid>',
})
class MatImageGridTestComponent {
  private imagesBaseUrl = 'http://demosite.com/images';

  /**
   * Get the URL for an image with the given ID & size.
   * Used by mat-image-grid 'urlForSize' parameter.
   * This demo uses an url like 'https://00201?w=800&h=600'.
   * @param imageId - The ID of the image (e.g. teh filename).
   * @param imageWidth - The width (in pixels) of the image.
   * @param imageHeight - The height (in pixels) of the image.
   * @returns The URL of the image with the given size.
   */
  protected urlForSize = (
    imageId: string,
    imageWidth: number,
    imageHeight: number,
  ) => {
    return `${this.imagesBaseUrl}/test-image.jpg?image=${imageId}&w=${imageWidth.toString(10)}&h=${imageHeight.toString(10)}`;
  };
}
