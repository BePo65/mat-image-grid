import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';

import {
  FieldFilterDefinition,
  FieldSortDefinition,
  MatImageGridImageServiceBase,
  Page,
  RequestImagesRange,
} from 'projects/mat-image-grid-lib/src';
import { PigImageData } from 'projects/mat-image-grid-lib/src/lib/interfaces/pig-image-data.interface';

@Injectable()
export class AppImagesMockupService extends MatImageGridImageServiceBase {
  private images: PigImageData[] = [];

  public constructor() {
    super();
  }

  public fillImageDatabaseMockup(numberOfRows = 0): void {
    this.images = [];
    for (let i = 0; i < numberOfRows; i++) {
      this.images.push(this.createPigImageMockup());
    }
  }

  /**
   * Get list of all available images for use in progressive image grid
   * All parameters are ignored
   * @param imagesRange - definition of the requested rows
   * @param sorts - sorting definition of the requested rows
   * @param filters - filter for selecting the requested rows
   * @returns list of all images
   */
  public override getPagedData(
    imagesRange: RequestImagesRange,
    /* eslint-disable @typescript-eslint/no-unused-vars */
    sorts?: FieldSortDefinition<PigImageData>[],
    filters?: FieldFilterDefinition<PigImageData>[],
    /* eslint-enable @typescript-eslint/no-unused-vars */
  ): Observable<Page<PigImageData>> {
    const pigImages = this.images.slice(
      imagesRange.startImageIndex,
      imagesRange.startImageIndex + imagesRange.numberOfImages,
    );
    const resultPage = {
      content: pigImages,
      startImageIndex: imagesRange.startImageIndex,
      returnedElements: pigImages.length,
      totalElements: this.images.length,
      totalFilteredElements: this.images.length,
    } as Page<PigImageData>;
    return of(resultPage);
  }

  private createPigImageMockup(): PigImageData {
    return {
      filename: this.randomInt(5000, 100000).toString(),
      aspectRatio: this.randomAspectRatio(),
    } as PigImageData;
  }

  /**
   * Returns a random integer between min (inclusive) and max (inclusive).
   * The value is no lower than min (or the next integer greater than min
   * if min isn't an integer) and no greater than max (or the next integer
   * lower than max if max isn't an integer).
   * Using Math.round() will give you a non-uniform distribution!
   * @param min - first possible value for generated integer
   * @param max - last possible value for generated integer
   * @returns generated integer
   */
  private randomInt(min: number, max: number): number {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  /**
   * Generate a random aspect ratio as float number.
   * @returns generated aspect ratio from a list of aspect ratios
   */
  private randomAspectRatio(): number {
    const aspectRatios = [0.5, 0.75, 1.33, 1.5];
    const selectedAspectRatioIndex = this.randomInt(0, 3);
    return aspectRatios[selectedAspectRatioIndex];
  }
}
