import { Injectable } from '@angular/core';
import { Observable, delay, of } from 'rxjs';

import {
  RequestImagesRange,
  FieldSortDefinition,
  FieldFilterDefinition,
} from '../interfaces/datastore-provider.interface';

import { AppDatastoreServiceBase } from './app.datastore.base.service';

import { MigImageData, Page } from 'projects/mat-image-grid-lib/src';

/**
 * Class to get a list of information about the images to display in the LargeDatasetComponent.
 */
@Injectable()
export class LargeDatasetDatastoreService extends AppDatastoreServiceBase<MigImageData> {
  private numberOfImages = 1000;

  public constructor() {
    super();
  }

  // TODO add 'sorts?: FieldSortDefinition<MigImageData>[]' and 'filters?: FieldFilterDefinition<MigImageData>[]'
  public override getPagedData(
    imagesRange: RequestImagesRange,
    /* eslint-disable @typescript-eslint/no-unused-vars */
    sorts?: FieldSortDefinition<MigImageData>[],
    filters?: FieldFilterDefinition<MigImageData>[],
    /* eslint-enable @typescript-eslint/no-unused-vars */
  ): Observable<Page<MigImageData>> {
    let numberOfImagesToLoad =
      imagesRange.numberOfImages < 0 ? 0 : imagesRange.numberOfImages;

    // Prevent to return images that are not in the (simulated) data set
    const indexOfLastImageToLoad =
      imagesRange.startImageIndex + numberOfImagesToLoad - 1;
    if (indexOfLastImageToLoad >= this.numberOfImages) {
      numberOfImagesToLoad -= indexOfLastImageToLoad - this.numberOfImages + 1;
    }

    const migImages = new Array(numberOfImagesToLoad) as MigImageData[];
    const randomizeFactorA = 1664525;
    const randomizeFactorC = 1013904223;
    for (let i = 0; i < migImages.length; ++i) {
      const aspectRatioBase = (i * randomizeFactorA + randomizeFactorC) % 38;
      migImages[i] = {
        imageId: (imagesRange.startImageIndex + i + 1).toString(),
        aspectRatio: (Math.log10(aspectRatioBase + 1) % 1) + 0.5,
      } as MigImageData;
    }

    const simulatedResponseTime =
      Math.round((Math.random() * 2000 + 500) * 100) / 100;

    const resultPage = {
      content: migImages,
      startImageIndex: imagesRange.startImageIndex,
      returnedElements: migImages.length,
      totalElements: this.numberOfImages,
      totalFilteredElements: this.numberOfImages,
    } as Page<MigImageData>;

    return of(resultPage).pipe(delay(simulatedResponseTime));
  }
}
