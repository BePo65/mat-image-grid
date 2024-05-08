import { Inject, Injectable, InjectionToken } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { Observable, of } from 'rxjs';

import { ExtendedGridSettings } from './extended-grid-settings.class';
import { ExtendedGridComponent } from './extended-grid.component';
import { MigImageExtData } from './mig-customization/mig-image-ext-data.interface';

import {
  FieldFilterDefinition,
  FieldSortDefinition,
  MatImageGridImageServiceBase,
  Page,
  RequestImagesRange,
} from 'projects/mat-image-grid-lib/src';

type MigMockupServiceConfig = { numberOfImages: number };

const IMAGE_SERVICE_CONFIG = new InjectionToken<MigMockupServiceConfig>(
  'mig.mockup.service.config',
);

describe('ExtendedGridComponent', () => {
  let harness: RouterTestingHarness;

  const WaitForSubelementsTimeMs = 120;
  const testImageServiceConfig = {
    numberOfImages: 200,
  } as MigMockupServiceConfig;
  const appConfig = new ExtendedGridSettings();

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ExtendedGridComponent],
      providers: [
        provideRouter([
          {
            path: 'extended-grid',
            component: ExtendedGridComponent,
            providers: [
              {
                provide: IMAGE_SERVICE_CONFIG,
                useValue: testImageServiceConfig,
              },
              {
                provide: MatImageGridImageServiceBase,
                useClass: MatImageGridExtendedMockupService,
              },
            ],
          },
        ]),
      ],
    }).compileComponents();
  });

  beforeEach(async () => {
    harness = await RouterTestingHarness.create('/extended-grid');
  });

  it('should create component instance', () => {
    const component = harness.routeDebugElement
      ?.componentInstance as ExtendedGridComponent;

    expect(component).toBeDefined();
    expect(component.componentType).toBe('ExtendedGridComponent');
  });

  it('should have figure entries', () => {
    const images = harness.routeNativeElement?.querySelectorAll('figure');

    expect(images).toHaveSize(testImageServiceConfig.numberOfImages);
  });

  it('should have img entries', async () => {
    // wait for ProgressiveImage to create all subelements
    await new Promise((resolve) =>
      setTimeout(resolve, WaitForSubelementsTimeMs),
    );

    const images = harness.routeNativeElement?.querySelectorAll('img');

    expect(images).toHaveSize(testImageServiceConfig.numberOfImages * 2);
  });

  it('should have thumbnail image entries with src attribute', async () => {
    // wait for ProgressiveImage to create all subelements
    await new Promise((resolve) =>
      setTimeout(resolve, WaitForSubelementsTimeMs),
    );

    const thumbnailImages = harness.routeNativeElement?.querySelectorAll(
      'img.mat-image-grid-thumbnail',
    );

    expect(thumbnailImages).toHaveSize(testImageServiceConfig.numberOfImages);

    if (thumbnailImages !== undefined) {
      const thumbnailImages3 = thumbnailImages[2] as HTMLImageElement;

      // Strip pure image file name from url
      const src = thumbnailImages3.src;
      const imageNameAndSize = src
        .slice(appConfig.imagesBaseUrl.length + 1)
        .split('/');

      expect(src.startsWith(appConfig.imagesBaseUrl)).toBeTrue();
      expect(imageNameAndSize[0]).toBe('00002');
    }
  });

  it('should have fullscreen image entries with src attribute', async () => {
    // wait for ProgressiveImage to create all subelements
    await new Promise((resolve) =>
      setTimeout(resolve, WaitForSubelementsTimeMs),
    );

    const fullscreenImages = harness.routeNativeElement?.querySelectorAll(
      'img.mat-image-grid-full-image',
    );

    expect(fullscreenImages).toHaveSize(testImageServiceConfig.numberOfImages);

    if (fullscreenImages !== undefined) {
      const fullscreenImages5 = fullscreenImages[4] as HTMLImageElement;

      // Strip pure image file name from url
      const src = fullscreenImages5.src;
      const imageNameAndSize = src
        .slice(appConfig.imagesBaseUrl.length + 1)
        .split('/');

      expect(src.startsWith(appConfig.imagesBaseUrl)).toBeTrue();
      expect(imageNameAndSize[0]).toBe('00004');
    }
  });
});

@Injectable()
class MatImageGridExtendedMockupService extends MatImageGridImageServiceBase {
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
    sorts?: FieldSortDefinition<MigImageExtData>[],
    filters?: FieldFilterDefinition<MigImageExtData>[],
    /* eslint-enable @typescript-eslint/no-unused-vars */
  ): Observable<Page<MigImageExtData>> {
    const resultPage = {
      content: [],
      startImageIndex: imagesRange.startImageIndex,
      returnedElements: 0,
      totalElements: 0,
      totalFilteredElements: 0,
    } as Page<MigImageExtData>;
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
        imageDate: new Date(2024, 2, i + 1).toISOString(),
        description: `description ${i + 1}`,
        toursId: i + 1,
      } as MigImageExtData;
      resultPage.returnedElements = resultPage.content.push(entry);
    }

    resultPage.totalElements = resultPage.returnedElements;
    resultPage.totalFilteredElements = resultPage.returnedElements;
    return of(resultPage);
  }
}
