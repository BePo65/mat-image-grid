import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Observable, of } from 'rxjs';

import {
  FieldFilterDefinition,
  FieldSortDefinition,
  Page,
  RequestImagesRange,
} from './interfaces/pig-datastore-provider.interface';
import { PigImageData } from './interfaces/pig-image-data.interface';
import { MatImageGridLibComponent } from './mat-image-grid.component';
import { MatImageGridImageServiceBase } from './mat-image-grid.service';

describe('MatImageGridLibComponent', () => {
  let component: MatImageGridLibComponent;
  let fixture: ComponentFixture<MatImageGridLibComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MatImageGridLibComponent],
      providers: [
        {
          provide: MatImageGridImageServiceBase,
          useClass: MatImageGridMockupService,
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(MatImageGridLibComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

class MatImageGridMockupService extends MatImageGridImageServiceBase {
  public override getPagedData(
    imagesRange: RequestImagesRange,
    /* eslint-disable @typescript-eslint/no-unused-vars */
    sorts?: FieldSortDefinition<PigImageData>[],
    filters?: FieldFilterDefinition<PigImageData>[],
    /* eslint-enable @typescript-eslint/no-unused-vars */
  ): Observable<Page<PigImageData>> {
    const resultPage = {
      content: [],
      startImageIndex: imagesRange.startImageIndex,
      returnedElements: 0,
      totalElements: 0,
      totalFilteredElements: 0,
    } as Page<PigImageData>;
    return of(resultPage);
  }
}
