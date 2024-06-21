import { CollectionViewer } from '@angular/cdk/collections';
import { Observable } from 'rxjs';

/**
 * Interface defining the properties of a page of images returned from the datastore.
 * @template T - Type defining the data of an image from the data source.
 */
export interface Page<T> {
  content: T[];
  startImageIndex: number;
  returnedElements: number;
  totalElements: number;
  totalFilteredElements: number;
}

/**
 * Interface defining the methods of a class fetching image data from a server.
 * @template T - type defining the data of an image
 */
export abstract class DataSourcePaged<T> {
  /**
   * Connects a collection viewer (such as a mat-image-grid) to this data source.
   * @param collectionViewer - The component that exposes a view over the data provided by this data source.
   * @returns Observable that emits a new value when the data changes.
   */
  abstract connect(collectionViewer: CollectionViewer): Observable<Page<T>>;

  /**
   * Disconnects a collection viewer (such as a mat-image-grid) from this data source.
   * @param collectionViewer - The component that exposes a view over the data provided by this data source.
   */
  abstract disconnect(collectionViewer: CollectionViewer): void;
}
