import { Inject, Injectable, InjectionToken } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { Observable, of } from 'rxjs';

import { LargeDatasetComponent } from './large-dataset.component';

import {
  DatastoreAdapterServiceBase,
  FieldFilterDefinition,
  FieldSortDefinition,
  MigImageData,
  Page,
  RequestImagesRange,
} from 'projects/mat-image-grid-lib/src';

type MigMockupServiceConfig = { numberOfImages: number };

const IMAGE_SERVICE_CONFIG = new InjectionToken<MigMockupServiceConfig>(
  'mig.mockup.service.config',
);

describe('LargeDatasetComponent', () => {
  let harness: RouterTestingHarness;

  const WaitForSubelementsTimeMs = 300;
  const imagesOnFirstLoad = 20;
  const testImageServiceConfig = {
    numberOfImages: 200,
  } as MigMockupServiceConfig;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LargeDatasetComponent],
      providers: [
        provideRouter([
          {
            path: 'large-dataset',
            component: LargeDatasetComponent,
            providers: [
              {
                provide: IMAGE_SERVICE_CONFIG,
                useValue: testImageServiceConfig,
              },
              {
                provide: DatastoreAdapterServiceBase,
                useClass: MatImageGridLargeDatasetMockupService,
              },
            ],
          },
        ]),
      ],
    }).compileComponents();
  });

  beforeEach(async () => {
    harness = await RouterTestingHarness.create('/large-dataset');

    // we need a container with a defined height, as mat-image-grid does
    // not set a height of its own, but fills container (parent element)
    const largeGrid = harness.routeNativeElement as HTMLDivElement;
    if (largeGrid && largeGrid.parentElement) {
      largeGrid.parentElement.style.height = '600px';
    }

    // wait for ProgressiveImage to create all subelements
    await new Promise((resolve) =>
      setTimeout(resolve, WaitForSubelementsTimeMs),
    );
  });

  it('should create component instance', () => {
    const component = harness.routeDebugElement
      ?.componentInstance as LargeDatasetComponent;

    expect(component).toBeDefined();
    expect(component.componentType).toBe('LargeDatasetComponent');
  });

  it('should have figure entries', () => {
    const images = harness.routeNativeElement?.querySelectorAll('figure');

    expect(images?.length).toBeGreaterThanOrEqual(imagesOnFirstLoad);
  });

  it('should have img entries', () => {
    const figures = harness.routeNativeElement?.querySelectorAll('figure');
    const numberOfFigures = figures?.length || 1;
    const images = harness.routeNativeElement?.querySelectorAll('img');

    expect(figures?.length).toBeGreaterThanOrEqual(imagesOnFirstLoad);
    expect(images?.length).toBe(numberOfFigures * 2);
  });

  it('should have thumbnail image entries with src attribute', () => {
    const figures = harness.routeNativeElement?.querySelectorAll('figure');
    const numberOfFigures = figures?.length || 1;
    const thumbnailImages = harness.routeNativeElement?.querySelectorAll(
      'img.mat-image-grid-thumbnail',
    );

    expect(figures?.length).toBeGreaterThanOrEqual(imagesOnFirstLoad);
    expect(thumbnailImages?.length).toBe(numberOfFigures);

    if (thumbnailImages !== undefined) {
      const thumbnailImages3 = thumbnailImages[2] as HTMLImageElement;

      expect(
        thumbnailImages3.src.startsWith('data:image/png;base64,'),
      ).toBeTrue();
    }
  });

  it('should have fullscreen image entries with src attribute', () => {
    const figures = harness.routeNativeElement?.querySelectorAll('figure');
    const numberOfFigures = figures?.length || 1;
    const fullscreenImages = harness.routeNativeElement?.querySelectorAll(
      'img.mat-image-grid-full-image',
    );

    expect(figures?.length).toBeGreaterThanOrEqual(imagesOnFirstLoad);
    expect(fullscreenImages?.length).toBe(numberOfFigures);

    if (fullscreenImages !== undefined) {
      const fullscreenImages5 = fullscreenImages[4] as HTMLImageElement;

      expect(
        fullscreenImages5.src.startsWith('data:image/png;base64,'),
      ).toBeTrue();
    }
  });
});

@Injectable()
class MatImageGridLargeDatasetMockupService extends DatastoreAdapterServiceBase<MigImageData> {
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
      imagesRange.numberOfImages < 0
        ? 0
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

    resultPage.totalElements = this.entriesInDatastore;
    resultPage.totalFilteredElements = this.entriesInDatastore;
    return of(resultPage);
  }
}
