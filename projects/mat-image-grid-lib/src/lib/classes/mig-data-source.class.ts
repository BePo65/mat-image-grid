import { CollectionViewer } from '@angular/cdk/collections';
import { BehaviorSubject, Observable, Subscription, first } from 'rxjs';

import { RequestImagesRange } from '../interfaces/datastore-adapter.interface';
import { MigImageData } from '../interfaces/mig-image-data.interface';
import { Page } from '../interfaces/page.interface';

import { DatastoreAdapterServiceBase } from './datastore-adapter.service.base';

/**
 * Class to get a list of images data to display in a mat-image-grid.
 * This class converts the raw data received fom a datastore adapter to a format
 * required by mat-image-grid.
 */
export class MigDataSource<T extends MigImageData = MigImageData> {
  private readonly emptyPage = {
    content: [] as T[],
    startImageIndex: 0,
    returnedElements: 0,
    totalElements: 0,
    totalFilteredElements: 0,
  } as Page<T>;

  private datastore: DatastoreAdapterServiceBase<T>;

  /** Stream emitting data to render. */
  private readonly _data: BehaviorSubject<Page<T>>;
  private collectionViewerSubscription!: Subscription;

  /**
   * @param datastore - datastore adapter for datastore to use
   */
  public constructor(datastore: DatastoreAdapterServiceBase<T>) {
    this.datastore = datastore;
    this._data = new BehaviorSubject<Page<T>>(this.emptyPage);
  }

  /**
   * Connects a collection viewer (such as a mat-image-grid) to this data source.
   * The viewChange observable of the CollectionViewer should return no images, when
   * the 'end' property of the ListRange is less than 0.
   * @param collectionViewer - The component that exposes a view over the data provided by this data source.
   * @returns Observable that emits a new value when the data changes.
   */
  connect(collectionViewer: CollectionViewer): Observable<Page<T>> {
    this.collectionViewerSubscription = collectionViewer.viewChange.subscribe(
      (listRange) => {
        // start is inclusive, end is exclusive
        const numberOfRequestedImages = Math.max(
          listRange.end - listRange.start,
          0,
        );

        const requestedRange = {
          startImageIndex: listRange.start,
          numberOfImages: numberOfRequestedImages,
        } as RequestImagesRange;

        this.datastore
          .getPagedData(requestedRange)
          .pipe(first())
          .subscribe((page: Page<T>) => {
            return this._data.next(page);
          });
      },
    );
    return this._data.asObservable();
  }

  /**
   * Disconnects a collection viewer (such as a mat-image-grid) from this data source.
   * @param collectionViewer - The component that exposes a view over the data provided by this data source.
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  disconnect(collectionViewer: CollectionViewer): void {
    this.collectionViewerSubscription.unsubscribe();
  }
}
