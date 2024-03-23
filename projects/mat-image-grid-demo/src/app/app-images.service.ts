import { Injectable } from '@angular/core';
import { Observable, delay, of } from 'rxjs';

import EXAMPLE_DATA from './app-images.mock.data';

import {
  MatImageGridImageServiceBase,
  RequestImagesRange,
  FieldSortDefinition,
  FieldFilterDefinition,
  Page,
} from 'projects/mat-image-grid-lib/src';
import { PigImageData } from 'projects/mat-image-grid-lib/src/lib/interfaces/pig-image-data.interface';

/**
 * Class to get a list of information about the images to display.
 */
@Injectable()
export class AppImagesService extends MatImageGridImageServiceBase {
  private images: PigImageData[];

  public constructor() {
    super();
    this.images = EXAMPLE_DATA.map((image) => image);
  }

  public override getPagedData(
    imagesRange: RequestImagesRange,
    /* eslint-disable @typescript-eslint/no-unused-vars */
    sorts?: FieldSortDefinition<PigImageData>[],
    filters?: FieldFilterDefinition<PigImageData>[],
    /* eslint-enable @typescript-eslint/no-unused-vars */
  ): Observable<Page<PigImageData>> {
    const numberOfImages =
      imagesRange.numberOfImages === -1
        ? this.images.length
        : imagesRange.numberOfImages;
    const pigImages = this.images.slice(
      imagesRange.startImageIndex,
      imagesRange.startImageIndex + numberOfImages,
    );
    const simulatedResponseTime =
      Math.round((Math.random() * 2000 + 500) * 100) / 100;
    const resultPage = {
      content: pigImages,
      startImageIndex: imagesRange.startImageIndex,
      returnedElements: pigImages.length,
      totalElements: this.images.length,
      totalFilteredElements: this.images.length,
    } as Page<PigImageData>;
    return of(resultPage).pipe(delay(simulatedResponseTime));
  }
}
