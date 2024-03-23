import { Observable, of } from 'rxjs';

import {
  RequestImagesRange,
  FieldSortDefinition,
  FieldFilterDefinition,
  Page,
} from '../public-api';

import { PigImageData } from './interfaces/pig-image-data.interface';
import { MatImageGridImageServiceBase } from './mat-image-grid.service';

describe('MatImageGridLibService', () => {
  let service: MatImageGridImageServiceBase;

  beforeEach(() => {
    service = new MyTestClass();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});

class MyTestClass extends MatImageGridImageServiceBase {
  private mockData: PigImageData[] = [
    {
      filename: '90000',
      aspectRatio: 0.75,
    } as PigImageData,
  ];
  public override getPagedData(
    /* eslint-disable @typescript-eslint/no-unused-vars */
    imagesRange: RequestImagesRange,
    sorts?: FieldSortDefinition<PigImageData>[],
    filters?: FieldFilterDefinition<PigImageData>[],
    /* eslint-enable @typescript-eslint/no-unused-vars */
  ): Observable<Page<PigImageData>> {
    const resultPage = {
      content: this.mockData,
      startImageIndex: 0,
      returnedElements: this.mockData.length,
      totalElements: this.mockData.length,
      totalFilteredElements: this.mockData.length,
    } as Page<PigImageData>;
    return of(resultPage);
  }
}
