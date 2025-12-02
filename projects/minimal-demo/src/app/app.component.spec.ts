import { Component, Inject, Injectable, InjectionToken } from '@angular/core';
import {
  ComponentFixture,
  ComponentFixtureAutoDetect,
  TestBed,
} from '@angular/core/testing';
import { Observable, of } from 'rxjs';

import { AppDataSource } from './classes/app.data-source.class';
import { MinimalGridSettings } from './classes/minimal-grid-settings.class';
import {
  RequestImagesRange,
  FieldSortDefinition,
  FieldFilterDefinition,
} from './interfaces/datastore-provider.interface';
import { AppDatastoreServiceBase } from './services/app.datastore.base.service';
import { MinimalGridDatastoreService } from './services/minimal-grid.datastore.service';

import {
  MatImageGridLibComponent,
  MigImageData,
  Page,
} from 'projects/mat-image-grid-lib/src';

type MigMockupServiceConfig = { numberOfImages: number };

const IMAGE_SERVICE_CONFIG = new InjectionToken<MigMockupServiceConfig>(
  'mig.mockup.service.config',
);

describe('Minimal Demo Component', () => {
  let fixture: ComponentFixture<AppTestComponent>;
  let app: AppTestComponent;
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
      imports: [AppTestComponent],
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
    fixture = TestBed.createComponent(AppTestComponent);
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

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [MatImageGridLibComponent],
  providers: [
    {
      provide: AppDatastoreServiceBase,
      useClass: MinimalGridDatastoreService,
    },
    AppDataSource,
  ],
  template: `
    <div id="grid-container" #gridContainer>
      <mat-image-grid
        id="test-grid"
        [dataSource]="demoDataSource"
        [urlForImage]="urlForImage"
      >
        loading...
      </mat-image-grid>
    </div>
  `,
  styles: `
    #grid-container {
      height: 600px;
    }
  `,
})
export class AppTestComponent {
  public title = 'MatImageGrid Minimal Demo';

  private imagesBaseUrl: string;

  constructor(
    private settings: MinimalGridSettings,
    protected demoDataSource: AppDataSource<MigImageData>,
  ) {
    // MinimalGridSettings is not listed in 'providers', as it is defined with 'providedIn: root'
    this.imagesBaseUrl = this.settings.imagesBaseUrl;
  }

  /**
   * Get the URL for an image with the given image data & dimensions.
   * Used by mat-image-grid 'urlForImage' parameter.
   * This demo uses an url like 'https://picsum.photos/id/201/800/600'.
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
    return `${this.imagesBaseUrl}/${singleImageData.imageId}/${imageWidth.toString(10)}/${imageHeight.toString(10)}`;
  };
}
