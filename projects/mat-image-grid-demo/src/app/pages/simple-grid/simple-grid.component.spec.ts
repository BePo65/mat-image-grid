import { Inject, Injectable, InjectionToken } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { Observable, of } from 'rxjs';

import {
  FieldFilterDefinition,
  FieldSortDefinition,
  RequestImagesRange,
} from '../../interfaces/datastore-provider.interface';
import { AppDatastoreServiceBase } from '../../services/app.datastore.base.service';
import { SimpleGridDatastoreService } from '../../services/simple-grid.datastore.service';

import { SimpleGridSettings } from './simple-grid-settings.class';
import { SimpleGridComponent } from './simple-grid.component';

import { MigImageData, Page } from 'projects/mat-image-grid-lib/src';

type MigMockupServiceConfig = { numberOfImages: number };

const IMAGE_SERVICE_CONFIG = new InjectionToken<MigMockupServiceConfig>(
  'mig.mockup.service.config',
);

describe('SimpleGridComponent', () => {
  let harness: RouterTestingHarness;

  const WaitForSubelementsTimeMs = 120;
  const testImageServiceConfig = {
    numberOfImages: 200,
  } as MigMockupServiceConfig;
  const appConfig = new SimpleGridSettings();

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SimpleGridComponent],
      providers: [
        provideRouter([
          {
            path: 'simple-grid',
            component: SimpleGridComponent,
            providers: [
              {
                provide: IMAGE_SERVICE_CONFIG,
                useValue: testImageServiceConfig,
              },
              {
                provide: SimpleGridDatastoreService,
                useClass: MatImageGridMockupService,
              },
            ],
          },
        ]),
      ],
    }).compileComponents();
  });

  beforeEach(async () => {
    harness = await RouterTestingHarness.create('/simple-grid');
  });

  it('should create component instance', () => {
    const component = harness.routeDebugElement
      ?.componentInstance as SimpleGridComponent;

    expect(component).toBeDefined();
    expect(component.componentType).toBe('SimpleGridComponent');
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
class MatImageGridMockupService extends AppDatastoreServiceBase<MigImageData> {
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
