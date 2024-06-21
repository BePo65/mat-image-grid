import { CollectionViewer } from '@angular/cdk/collections';
import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, Subscription, first } from 'rxjs';

import { RequestImagesRange } from './interfaces/datastore-provider.interface';
import { AppDatastoreServiceBase } from './services/app.datastore.base.service';

import {
  Page,
  DataSourcePaged,
  MigImageData,
} from 'projects/mat-image-grid-lib/src';

/**
 * Class to get a list of information about the images to display in the demo pages.
 */
@Injectable()
export class AppDataSource<T extends MigImageData> extends DataSourcePaged<T> {
  private datastore: AppDatastoreServiceBase<T>;

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

  public constructor(datastore: AppDatastoreServiceBase<T>) {
    super();
    this._data = new BehaviorSubject<Page<T>>(this.emptyPage);
    this.datastore = datastore;
  }

  override connect(collectionViewer: CollectionViewer): Observable<Page<T>> {
    this.collectionViewerSubscription = collectionViewer.viewChange.subscribe(
      (listRange) => {
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
          .subscribe((page: Page<T>) => this._data.next(page));
      },
    );
    return this._data.asObservable();
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  override disconnect(collectionViewer: CollectionViewer): void {
    this.collectionViewerSubscription.unsubscribe();
  }
}
