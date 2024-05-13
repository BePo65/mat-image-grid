import { Injectable, Inject, InjectionToken } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router, RouterModule, provideRouter } from '@angular/router';
import { Observable, of } from 'rxjs';

import { AppComponent } from './app.component';
import { ExtendedGridComponent } from './pages/extended-grid/extended-grid.component';
import { MigImageExtData } from './pages/extended-grid/mig-customization/mig-image-ext-data.interface';
import { LargeDatasetComponent } from './pages/large-dataset/large-dataset.component';
import { PageNotFoundComponent } from './pages/not-found/not-found.component';
import { SimpleGridComponent } from './pages/simple-grid/simple-grid.component';

import {
  MatImageGridImageServiceBase,
  RequestImagesRange,
  FieldSortDefinition,
  MigImageData,
  FieldFilterDefinition,
  Page,
} from 'projects/mat-image-grid-lib/src';

type MigMockupServiceConfig = { numberOfImages: number };

const IMAGE_SERVICE_CONFIG = new InjectionToken<MigMockupServiceConfig>(
  'mig.mockup.service.config',
);

describe('AppComponent', () => {
  let fixture: ComponentFixture<AppComponent>;
  let router: Router;
  let app: AppComponent;

  const WaitForSubelementsTimeMs = 120;
  const simpleGridImageServiceConfig = {
    numberOfImages: 200,
  } as MigMockupServiceConfig;
  const extendedGridImageServiceConfig = {
    numberOfImages: 200,
  } as MigMockupServiceConfig;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      // imports: [AppComponent, RouterModule, RouterOutlet, SimpleGridComponent],
      imports: [AppComponent, RouterModule],
      providers: [
        provideRouter([
          {
            path: 'simple-grid',
            component: SimpleGridComponent,
            providers: [
              {
                provide: IMAGE_SERVICE_CONFIG,
                useValue: simpleGridImageServiceConfig,
              },
              {
                provide: MatImageGridImageServiceBase,
                useClass: MatImageGridMockupService,
              },
            ],
          },
          {
            path: 'extended-grid',
            component: ExtendedGridComponent,
            providers: [
              {
                provide: IMAGE_SERVICE_CONFIG,
                useValue: extendedGridImageServiceConfig,
              },
              {
                provide: MatImageGridImageServiceBase,
                useClass: MatImageGridExtendedMockupService,
              },
            ],
          },
          { path: 'large-dataset', component: LargeDatasetComponent },
          { path: '', redirectTo: '/simple-grid', pathMatch: 'full' },
          { path: '**', component: PageNotFoundComponent },
        ]),
      ],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(AppComponent);
    router = TestBed.inject(Router);
    app = fixture.componentInstance;
    fixture.ngZone?.run(() => {
      router.initialNavigation();
    });
  });

  it('should create app instance', () => {
    expect(app).toBeDefined();
  });

  it('should have a title property', () => {
    expect(app.title).toEqual('MatImageGrid Demo');
  });

  it('should render header and footer', () => {
    fixture.detectChanges();
    const appNative = fixture.nativeElement as HTMLElement;

    expect(appNative.querySelector('h1')?.textContent).toContain(
      'MatImageGrid Demo',
    );

    expect(appNative.querySelector('.header-source')?.textContent).toContain(
      'Source on github:',
    );

    expect(appNative.querySelector('.footer')?.textContent).toContain(
      'Images from',
    );
  });

  it('should have initial route set', () => {
    expect(router.url).toBe('/');
  });

  it('should navigate to simple-grid on empty route', async () => {
    const navigated = await fixture.ngZone?.run(() => router.navigate(['']));

    expect(navigated).toBeTruthy();

    fixture.detectChanges();

    expect(router.url).toBe('/simple-grid');
  });

  it('should navigate to simple-grid', async () => {
    const navigated = await fixture.ngZone?.run(() =>
      router.navigate(['simple-grid']),
    );

    expect(navigated).toBeTruthy();

    // wait for ProgressiveImage to create all subelements
    fixture.detectChanges();
    await new Promise((resolve) =>
      setTimeout(resolve, WaitForSubelementsTimeMs),
    );

    const appNative = fixture.nativeElement as HTMLElement;
    const mainElements = appNative.querySelectorAll('mat-image-grid');
    const figureElements = appNative.querySelectorAll('figure');

    expect(router.url).toBe('/simple-grid');
    expect(mainElements).toHaveSize(1);
    expect(figureElements).toHaveSize(
      simpleGridImageServiceConfig.numberOfImages,
    );
  });

  it('should navigate to extended-grid', async () => {
    const navigated = await fixture.ngZone?.run(() =>
      router.navigate(['extended-grid']),
    );

    expect(navigated).toBeTruthy();

    // wait for ProgressiveImage to create all subelements
    fixture.detectChanges();
    await new Promise((resolve) =>
      setTimeout(resolve, WaitForSubelementsTimeMs),
    );

    const appNative = fixture.nativeElement as HTMLElement;
    const mainElements = appNative.querySelectorAll('mat-image-grid');
    const figureElements = appNative.querySelectorAll('figure');

    expect(router.url).toBe('/extended-grid');
    expect(mainElements).toHaveSize(1);
    expect(figureElements).toHaveSize(
      extendedGridImageServiceConfig.numberOfImages,
    );
  });

  it('should navigate to large-dataset', async () => {
    const navigated = await fixture.ngZone?.run(() =>
      router.navigate(['large-dataset']),
    );

    expect(navigated).toBeTruthy();

    fixture.detectChanges();

    const appNative = fixture.nativeElement as HTMLElement;
    const contentElements = appNative.querySelectorAll('app-large-dataset p');

    expect(router.url).toBe('/large-dataset');
    expect(contentElements).toHaveSize(1);
    expect(contentElements[0].textContent).toContain(
      'Placeholder for mat-image-grid with very large dataset',
    );
  });

  it('should navigate to page-not-found on non-existing route', async () => {
    const navigated = await fixture.ngZone?.run(() =>
      router.navigate(['non-existing-route']),
    );

    expect(navigated).toBeTruthy();

    fixture.detectChanges();

    const appNative = fixture.nativeElement as HTMLElement;
    const contentElements = appNative.querySelectorAll('.page-content h2');

    expect(router.url).toBe('/non-existing-route');
    expect(contentElements).toHaveSize(1);
    expect(contentElements[0].textContent).toContain('Page not found');
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
