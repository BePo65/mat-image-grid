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
import { ExtendedGridDatastoreService } from '../../services/extended-grid.datastore.service';

import { ExtendedGridSettings } from './extended-grid-settings.class';
import { ExtendedGridComponent } from './extended-grid.component';
import { MigImageExtData } from './mig-customization/mig-image-ext-data.interface';

import { Page } from 'projects/mat-image-grid-lib/src';

type MigMockupServiceConfig = { numberOfImages: number };

const IMAGE_SERVICE_CONFIG = new InjectionToken<MigMockupServiceConfig>(
  'mig.mockup.service.config',
);

describe('ExtendedGridComponent', () => {
  let harness: RouterTestingHarness;

  const WaitForSubelementsTimeMs = 300;
  const imagesOnFirstLoad = 20;
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
                provide: ExtendedGridDatastoreService,
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

    // wait for ProgressiveImage to create all subelements
    await new Promise((resolve) =>
      setTimeout(resolve, WaitForSubelementsTimeMs),
    );
  });

  it('should create component instance', () => {
    const component = harness.routeDebugElement
      ?.componentInstance as ExtendedGridComponent;

    expect(component).toBeDefined();
    expect(component.componentType).toBe('ExtendedGridComponent');
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
        thumbnailImages3.src.startsWith('data:image/jpeg;base64,'),
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
class MatImageGridExtendedMockupService extends AppDatastoreServiceBase<MigImageExtData> {
  private entriesInDatastore = 0;
  private dummyImage =
    'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEBLAEsAAD/2wBDAA0JCgsKCA0LCgsODg0PEyAVExISEyccHhcgLikxMC4pLSwzOko+MzZGNywtQFdBRkxOUlNSMj5aYVpQYEpRUk//2wBDAQ4ODhMREyYVFSZPNS01T09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT0//wAARCAAUABQDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAb/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFgEBAQEAAAAAAAAAAAAAAAAAAAUG/8QAFBEBAAAAAAAAAAAAAAAAAAAAAP/aAAwDAQACEQMRAD8AoQGJRwAAAAAH/9k=';

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
        imageDate: new Date(2024, 2, i + 1).toISOString(),
        description: `description ${i + 1}`,
        toursId: i + 1,
        thumbnailDataUrl: this.dummyImage,
      } as MigImageExtData;
      resultPage.returnedElements = resultPage.content.push(entry);
    }

    resultPage.totalElements = this.entriesInDatastore;
    resultPage.totalFilteredElements = this.entriesInDatastore;
    return of(resultPage);
  }
}
