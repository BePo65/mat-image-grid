import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Observable, of } from 'rxjs';

import {
  FieldFilterDefinition,
  FieldSortDefinition,
  Page,
  RequestImagesRange,
} from './interfaces/datastore-provider.interface';
import { MigImageData } from './interfaces/mig-image-data.interface';
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
    sorts?: FieldSortDefinition<MigImageData>[],
    filters?: FieldFilterDefinition<MigImageData>[],
    /* eslint-enable @typescript-eslint/no-unused-vars */
  ): Observable<Page<MigImageData>> {
    const resultPage = {
      content: [],
      startImageIndex: imagesRange.startImageIndex,
      returnedElements: 0,
      totalElements: 0,
      totalFilteredElements: 0,
    } as Page<MigImageData>;
    return of(resultPage);
  }
}
