import { Inject, Injectable, InjectionToken } from '@angular/core';
import {
  ComponentFixture,
  ComponentFixtureAutoDetect,
  TestBed,
} from '@angular/core/testing';
import { Observable, of } from 'rxjs';

import { AppComponent } from './app.component';
import { MinimalGridDatastoreService } from './services/minimal-grid.datastore.service';

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

describe('Minimal Demo Component', () => {
  let fixture: ComponentFixture<AppComponent>;
  let app: AppComponent;
  let originalTimeout: number;

  // it will take quite a long time, until all images have been loaded
  // we have to wait, as ResizeObserver is not part of angular testing zone
  const WaitForSubelementsTimeMs = 3000;
  const jasmineTimeout = 5000;
  const imagesOnFirstLoad = 16;
  const MinimalGridImageServiceConfig = {
    numberOfImages: 200,
  } as MigMockupServiceConfig;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AppComponent],
      providers: [
        {
          provide: IMAGE_SERVICE_CONFIG,
          useValue: MinimalGridImageServiceConfig,
        },
        {
          provide: MinimalGridDatastoreService,
          useClass: MatImageGridMockupService,
        },
        { provide: ComponentFixtureAutoDetect, useValue: true },
      ],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(AppComponent);
    app = fixture.componentInstance;
    fixture.detectChanges();
  });

  beforeEach(() => {
    originalTimeout = jasmine.DEFAULT_TIMEOUT_INTERVAL;
    jasmine.DEFAULT_TIMEOUT_INTERVAL = jasmineTimeout;
  });

  afterEach(() => {
    jasmine.DEFAULT_TIMEOUT_INTERVAL = originalTimeout;
  });

  it('should create the app', () => {
    expect(app).toBeDefined();
  });

  it('should have a title property', () => {
    expect(app.title).toEqual('MatImageGrid Minimal Demo');
  });

  it('should render grid', async () => {
    // wait for ProgressiveImage to create all subelements
    await fixture.whenStable();

    const appNative = fixture.nativeElement as HTMLElement;
    const mainElement = appNative.querySelector(
      'mat-image-grid',
    ) as HTMLDivElement;

    fixture.detectChanges();
    await fixture.whenStable();

    // wait for images to be loaded
    await new Promise((resolve) =>
      setTimeout(resolve, WaitForSubelementsTimeMs),
    );

    const figureElements = mainElement?.querySelectorAll('figure');

    expect(figureElements?.length).toBeGreaterThanOrEqual(imagesOnFirstLoad);
  });
});

@Injectable()
class MatImageGridMockupService extends DatastoreAdapterServiceBase<MigImageData> {
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
