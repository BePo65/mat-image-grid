import { Observable, of } from 'rxjs';

import { DatastoreAdapterServiceBase } from '../classes/datastore-adapter.service.base';
import {
  RequestImagesRange,
  FieldSortDefinition,
  FieldFilterDefinition,
} from '../interfaces/datastore-adapter.interface';
import { MigImageData } from '../interfaces/mig-image-data.interface';
import { Page } from '../interfaces/page.interface';

type DemoComponentConfig = { numberOfImages: number };

/**
 * Class to get a list of information about the images to use in the tests.
 */
export class TestDatastore extends DatastoreAdapterServiceBase {
  private entriesInDatastore = 0;

  public constructor(config: DemoComponentConfig) {
    super();
    if (
      typeof config.numberOfImages === 'number' &&
      config.numberOfImages > 0
    ) {
      this.entriesInDatastore = config.numberOfImages;
    }
  }

  // TODO add 'sorts?: FieldSortDefinition<MigImageData>[]' and 'filters?: FieldFilterDefinition<MigImageData>[]'
  public override getPagedData(
    imagesRange: RequestImagesRange,
    /* eslint-disable @typescript-eslint/no-unused-vars */
    sorts?: FieldSortDefinition<MigImageData>[],
    filters?: FieldFilterDefinition<MigImageData>[],
    /* eslint-enable @typescript-eslint/no-unused-vars */
  ): Observable<Page<MigImageData>> {
    // Prevent to return images that are not in the (simulated) data set (index < 0)
    let numberOfImagesToLoad = Math.max(imagesRange.numberOfImages, 0);

    const indexOfFirstImageToLoad = Math.min(
      imagesRange.startImageIndex,
      this.entriesInDatastore - 1,
    );
    if (indexOfFirstImageToLoad >= this.entriesInDatastore) {
      numberOfImagesToLoad = 0;
    }

    let indexOfLastImageToLoad =
      imagesRange.startImageIndex + numberOfImagesToLoad - 1;
    if (indexOfLastImageToLoad >= this.entriesInDatastore) {
      indexOfLastImageToLoad -=
        indexOfLastImageToLoad - this.entriesInDatastore + 1;
      indexOfLastImageToLoad = Math.max(indexOfLastImageToLoad, 0);
    }

    const resultPage = {
      content: [],
      startImageIndex: imagesRange.startImageIndex,
      returnedElements: 0,
      totalElements: this.entriesInDatastore,
      totalFilteredElements: this.entriesInDatastore,
    } as Page<MigImageData>;

    for (let i = indexOfFirstImageToLoad; i <= indexOfLastImageToLoad; ++i) {
      const entry = {
        imageId: `${i.toString().padStart(5, '0').slice(-5)}`,
        aspectRatio: 1.3,
      } as MigImageData;
      resultPage.returnedElements = resultPage.content.push(entry);
    }

    return of(resultPage);
  }
}
