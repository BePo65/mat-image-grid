import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import {
  FieldFilterDefinition,
  FieldSortDefinition,
  DataStoreProvider,
  RequestImagesRange,
} from '../interfaces/datastore-provider.interface';

import { MigImageData, Page } from 'projects/mat-image-grid-lib/src';

/**
 * Base class to get a list of information about the images to display.
 * @template T - class derived from MigImageData
 */
// todo rename to data store
@Injectable()
export abstract class AppDatastoreServiceBase<
  T extends MigImageData = MigImageData,
> implements DataStoreProvider<T>
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
