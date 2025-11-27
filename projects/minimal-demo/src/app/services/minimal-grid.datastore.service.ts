import { Injectable } from '@angular/core';
import { Observable, delay, of } from 'rxjs';

import {
  RequestImagesRange,
  FieldSortDefinition,
  FieldFilterDefinition,
} from '../interfaces/datastore-provider.interface';

import { AppDatastoreServiceBase } from './app.datastore.base.service';
import SIMPLE_GRID_DATA from './minimal-grid-images.mock.data';

import { MigImageData, Page } from 'projects/mat-image-grid-lib/src';

/**
 * Class to get a list of information about the images to display in the LargeDatasetComponent.
 */
@Injectable()
export class MinimalGridDatastoreService extends AppDatastoreServiceBase<MigImageData> {
  private images: MigImageData[];

  public constructor() {
    super();

    // clone images list
    this.images = SIMPLE_GRID_DATA.map((image) => image);
  }

  // TODO add 'sorts?: FieldSortDefinition<MigImageData>[]' and 'filters?: FieldFilterDefinition<MigImageData>[]'
  public override getPagedData(
    imagesRange: RequestImagesRange,
    /* eslint-disable @typescript-eslint/no-unused-vars */
    sorts?: FieldSortDefinition<MigImageData>[],
    filters?: FieldFilterDefinition<MigImageData>[],
    /* eslint-enable @typescript-eslint/no-unused-vars */
  ): Observable<Page<MigImageData>> {
    const numberOfImages =
      imagesRange.numberOfImages < 0 ? 0 : imagesRange.numberOfImages;
    const migImages = this.images.slice(
      imagesRange.startImageIndex,
      imagesRange.startImageIndex + numberOfImages,
    );
    const simulatedResponseTime =
      Math.round((Math.random() * 2000 + 500) * 100) / 100;
    const resultPage = {
      content: migImages,
      startImageIndex: imagesRange.startImageIndex,
      returnedElements: migImages.length,
      totalElements: this.images.length,
      totalFilteredElements: this.images.length,
    } as Page<MigImageData>;

    return of(resultPage).pipe(delay(simulatedResponseTime));
  }
}
