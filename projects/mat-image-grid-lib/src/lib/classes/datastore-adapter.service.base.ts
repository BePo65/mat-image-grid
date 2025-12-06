import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import {
  FieldFilterDefinition,
  FieldSortDefinition,
  RequestImagesRange,
  DataStoreAdapter,
} from '../interfaces/datastore-adapter.interface';
import { MigImageData } from '../interfaces/mig-image-data.interface';
import { Page } from '../interfaces/page.interface';

/**
 * Base class for the adapter that gets a list of image data
 * from the data store.
 * @template T - class derived from MigImageData
 */
@Injectable()
export abstract class DatastoreAdapterServiceBase<
  T extends MigImageData = MigImageData,
> implements DataStoreAdapter<T>
{
  // eslint-disable-next-line jsdoc/require-returns-check
  /**
   * Get list of all available images for use in progressive image grid
   * @param imagesRange - definition of the number of requested images
   * @param sorts - sorting definition of the requested images
   * @param filters - filter for selecting the requested images
   * @returns list of images
   */
  public getPagedData(
    /* eslint-disable @typescript-eslint/no-unused-vars */
    imagesRange: RequestImagesRange,
    sorts?: FieldSortDefinition<T>[],
    filters?: FieldFilterDefinition<T>[],
    /* eslint-enable @typescript-eslint/no-unused-vars */
  ): Observable<Page<T>> {
    throw new Error('Method "getPagedData" not implemented.');
  }
}
