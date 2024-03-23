import { Observable } from 'rxjs';

import {
  FieldFilterDefinition,
  FieldSortDefinition,
  DataStoreProvider,
  Page,
  RequestImagesRange,
} from './interfaces/pig-datastore-provider.interface';
import { PigImageData } from './interfaces/pig-image-data.interface';

/**
 * Base class to get a list of information about the images to display.
 * @template T - class derived from PigImageData
 */
export abstract class MatImageGridImageServiceBase<
  T extends PigImageData = PigImageData,
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
    throw new Error('Method "getImagesForPig" not implemented.');
  }
}
