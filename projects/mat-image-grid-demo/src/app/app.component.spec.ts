import { Injectable, Inject, InjectionToken } from '@angular/core';
import {
  ComponentFixture,
  TestBed,
  fakeAsync,
  tick,
} from '@angular/core/testing';
import { Router, RouterModule, provideRouter } from '@angular/router';
import { Observable, of } from 'rxjs';

import { AppComponent } from './app.component';
import { ExtendedGridComponent } from './pages/extended-grid/extended-grid.component';
import { LargeDatasetComponent } from './pages/large-dataset/large-dataset.component';
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

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      // imports: [AppComponent, RouterModule, RouterOutlet, SimpleGridComponent],
      imports: [AppComponent, RouterModule],
      providers: [
        provideRouter([
          { path: '', redirectTo: '/simple-grid', pathMatch: 'full' },
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
          { path: 'extended-grid', component: ExtendedGridComponent },
          { path: 'large-dataset', component: LargeDatasetComponent },
        ]),
      ],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(AppComponent);
    router = TestBed.inject(Router);
    app = fixture.componentInstance;
    router.initialNavigation();
  });

  it('should create app instance', () => {
    expect(app).toBeDefined();
  });

  it('should have a title property', () => {
    expect(app.title).toEqual('Mat-Image-Grid-Demo');
  });

  it('should render header and footer', () => {
    fixture.detectChanges();
    const appNative = fixture.nativeElement as HTMLElement;

    expect(appNative.querySelector('h1')?.textContent).toContain(
      'Mat-Image-Grid-Demo',
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

  it('should navigate to simple-grid on empty route', fakeAsync(() => {
    void router.navigate(['']);
    tick();

    expect(router.url).toBe('/simple-grid');
  }));

  it('should navigate to simple-grid', async () => {
    await router.navigate(['simple-grid']);
    fixture.detectChanges();

    // wait for ProgressiveImage to create all subelements
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
    await router.navigate(['extended-grid']);
    fixture.detectChanges();

    const appNative = fixture.nativeElement as HTMLElement;
    const contentElements = appNative.querySelectorAll('app-extended-grid p');

    expect(router.url).toBe('/extended-grid');
    expect(contentElements).toHaveSize(1);
    expect(contentElements[0].textContent).toBe('extended-grid works!');
  });

  it('should navigate to large-dataset', fakeAsync(() => {
    void router.navigate(['large-dataset']);
    tick();
    fixture.detectChanges();

    const appNative = fixture.nativeElement as HTMLElement;
    const contentElements = appNative.querySelectorAll('app-large-dataset p');

    expect(router.url).toBe('/large-dataset');
    expect(contentElements).toHaveSize(1);
    expect(contentElements[0].textContent).toBe('large-dataset works!');
  }));
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
