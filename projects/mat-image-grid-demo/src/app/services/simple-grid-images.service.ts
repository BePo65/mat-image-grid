import { Injectable } from '@angular/core';
import { Observable, delay, of } from 'rxjs';

import EXAMPLE_DATA from './simple-grid-images.mock.data';

import {
  MatImageGridImageServiceBase,
  RequestImagesRange,
  FieldSortDefinition,
  FieldFilterDefinition,
  Page,
} from 'projects/mat-image-grid-lib/src';
import { MigImageData } from 'projects/mat-image-grid-lib/src/lib/interfaces/mig-image-data.interface';

/**
 * Class to get a list of information about the images to display in the SimpleGridComponent.
 */
@Injectable()
export class SimpleGridImagesService extends MatImageGridImageServiceBase<MigImageData> {
  private images: MigImageData[];

  public constructor() {
    super();
    this.images = EXAMPLE_DATA.map((image) => image);
  }

  public override getPagedData(
    imagesRange: RequestImagesRange,
    /* eslint-disable @typescript-eslint/no-unused-vars */
    sorts?: FieldSortDefinition<MigImageData>[],
    filters?: FieldFilterDefinition<MigImageData>[],
    /* eslint-enable @typescript-eslint/no-unused-vars */
  ): Observable<Page<MigImageData>> {
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
    } as Page<MigImageData>;
    return of(resultPage).pipe(delay(simulatedResponseTime));
  }
}
