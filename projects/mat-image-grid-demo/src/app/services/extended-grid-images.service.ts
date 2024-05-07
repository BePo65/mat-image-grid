import { Injectable } from '@angular/core';
import { Observable, delay, of } from 'rxjs';

import { MigImageExtData } from '../pages/extended-grid/mig-customization/mig-image-ext-data.interface';

import EXTENDED_GRID_DATA from './extended-grid-images.mock.data';

import {
  MatImageGridImageServiceBase,
  RequestImagesRange,
  FieldSortDefinition,
  FieldFilterDefinition,
  Page,
} from 'projects/mat-image-grid-lib/src';

/**
 * Class to get a list of information about the images to display in the ExtendedGridComponent.
 */
@Injectable()
export class ExtendedGridImagesService extends MatImageGridImageServiceBase<MigImageExtData> {
  private images: MigImageExtData[];

  public constructor() {
    super();
    this.images = EXTENDED_GRID_DATA.map((image) => image as MigImageExtData);
  }

  public override getPagedData(
    imagesRange: RequestImagesRange,
    /* eslint-disable @typescript-eslint/no-unused-vars */
    sorts?: FieldSortDefinition<MigImageExtData>[],
    filters?: FieldFilterDefinition<MigImageExtData>[],
    /* eslint-enable @typescript-eslint/no-unused-vars */
  ): Observable<Page<MigImageExtData>> {
    const numberOfImages =
      imagesRange.numberOfImages === -1
        ? this.images.length
        : imagesRange.numberOfImages;
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
    } as Page<MigImageExtData>;
    return of(resultPage).pipe(delay(simulatedResponseTime));
  }
}
