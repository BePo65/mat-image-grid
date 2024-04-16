import { Injectable, Inject, InjectionToken } from '@angular/core';
import {
  ComponentFixture,
  ComponentFixtureAutoDetect,
  TestBed,
} from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { Observable, of } from 'rxjs';

import { AppComponent } from './app.component';
import { AppConfig } from './config/app.config';

import {
  FieldFilterDefinition,
  FieldSortDefinition,
  MatImageGridImageServiceBase,
  MigImageData,
  Page,
  RequestImagesRange,
} from 'projects/mat-image-grid-lib/src';

type MigMockupServiceConfig = { numberOfImages: number };

const IMAGE_SERVICE_CONFIG = new InjectionToken<MigMockupServiceConfig>(
  'mig.mockup.service.config',
);

describe('AppComponent', () => {
  let app: AppComponent;
  let fixture: ComponentFixture<AppComponent>;
  const WaitForSubelementsTimeMs = 120;
  const testImageServiceConfig = {
    numberOfImages: 200,
  } as MigMockupServiceConfig;
  const appConfig = new AppConfig();

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AppComponent],
      providers: [
        { provide: ComponentFixtureAutoDetect, useValue: true },
        { provide: IMAGE_SERVICE_CONFIG, useValue: testImageServiceConfig },
      ],
    })
      .overrideComponent(AppComponent, {
        set: {
          providers: [
            {
              provide: MatImageGridImageServiceBase,
              useClass: MatImageGridMockupService,
            },
          ],
        },
      })
      .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(AppComponent);
    fixture.detectChanges();
    app = fixture.componentInstance;
  });

  it('should create the app', () => {
    expect(app).toBeTruthy();
  });

  it('should have a title property', () => {
    const fixture = TestBed.createComponent(AppComponent);
    fixture.detectChanges();
    const app = fixture.componentInstance;

    expect(app.title).toEqual('Mat-Image-Grid-Demo');
  });

  it('should render title', () => {
    const fixture = TestBed.createComponent(AppComponent);
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;

    expect(compiled.querySelector('h1')?.textContent).toContain(
      'Mat-Image-Grid-Demo',
    );
  });

  it('should have figure entries', () => {
    const images = fixture.debugElement.queryAll(By.css('figure'));

    expect(images.length).toBe(testImageServiceConfig.numberOfImages);
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
    const src = thumbnailImages3.src;
    const imageNameAndSize = src
      .slice(appConfig.imagesBaseUrl.length + 1)
      .split('/');

    expect(src.startsWith(appConfig.imagesBaseUrl)).toBeTrue();
    expect(imageNameAndSize[0]).toBe('00002');
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
    const src = fullscreenImages5.src;
    const imageNameAndSize = src
      .slice(appConfig.imagesBaseUrl.length + 1)
      .split('/');

    expect(src.startsWith(appConfig.imagesBaseUrl)).toBeTrue();
    expect(imageNameAndSize[0]).toBe('00004');
  });
});

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
