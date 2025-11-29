import { CollectionViewer } from '@angular/cdk/collections';
import { Inject, InjectionToken } from '@angular/core';
import { BehaviorSubject, Subscription, Observable, first, of } from 'rxjs';

import {
  DataSourcePaged,
  Page,
} from '../interfaces/data-source-paged.interface';
import { MigImageData } from '../interfaces/mig-image-data.interface';

type DemoComponentConfig = { numberOfImages: number };

const DEMO_COMPONENT_CONFIG = new InjectionToken<DemoComponentConfig>(
  'demo.component.config',
);

/**
 * Class to get a list of information about the images to display in the demo pages.
 */
export class DemoDataSource<T extends MigImageData> extends DataSourcePaged<T> {
  private entriesInDatastore = 0;
  private readonly emptyPage = {
    content: [] as T[],
    startImageIndex: 0,
    returnedElements: 0,
    totalElements: 0,
    totalFilteredElements: 0,
  } as Page<T>;

  /** Stream emitting data to render. */
  private readonly _data: BehaviorSubject<Page<T>>;
  private collectionViewerSubscription!: Subscription;

  public constructor(
    @Inject(DEMO_COMPONENT_CONFIG) config: DemoComponentConfig,
  ) {
    super();
    this._data = new BehaviorSubject<Page<T>>(this.emptyPage);
    if (
      typeof config.numberOfImages === 'number' &&
      config.numberOfImages > 0
    ) {
      this.entriesInDatastore = config.numberOfImages;
    }
  }

  override connect(collectionViewer: CollectionViewer): Observable<Page<T>> {
    this.collectionViewerSubscription = collectionViewer.viewChange.subscribe(
      (listRange) => {
        const numberOfRequestedImages = Math.max(
          listRange.end - listRange.start,
          0,
        );

        this.getPagedData(listRange.start, numberOfRequestedImages)
          .pipe(first())
          .subscribe((page: Page<T>) => this._data.next(page));
      },
    );
    return this._data.asObservable();
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  override disconnect(collectionViewer: CollectionViewer): void {
    this.collectionViewerSubscription.unsubscribe();
  }

  private getPagedData(start: number, count: number): Observable<Page<T>> {
    // Prevent to return images that are not in the (simulated) data set
    let numberOfImagesToLoad = Math.max(count, 0);

    const indexOfFirstImageToLoad = Math.max(start, 0);
    if (indexOfFirstImageToLoad >= this.entriesInDatastore) {
      numberOfImagesToLoad = 0;
    }

    let indexOfLastImageToLoad = start + numberOfImagesToLoad - 1;
    if (indexOfLastImageToLoad >= this.entriesInDatastore) {
      indexOfLastImageToLoad -=
        indexOfLastImageToLoad - this.entriesInDatastore + 1;
      indexOfLastImageToLoad = Math.max(indexOfLastImageToLoad, 0);
    }

    const resultPage = {
      content: [],
      startImageIndex: start,
      returnedElements: 0,
      totalElements: this.entriesInDatastore,
      totalFilteredElements: this.entriesInDatastore,
    } as Page<T>;

    for (let i = indexOfFirstImageToLoad; i <= indexOfLastImageToLoad; ++i) {
      const entry = {
        imageId: `${i.toString().padStart(5, '0').slice(-5)}`,
        aspectRatio: 1.3,
      } as T;
      resultPage.returnedElements = resultPage.content.push(entry);
    }

    return of(resultPage);
  }
}
