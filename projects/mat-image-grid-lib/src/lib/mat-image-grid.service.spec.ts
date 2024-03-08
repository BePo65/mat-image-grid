import { TestBed } from '@angular/core/testing';

import { MatImageGridLibService } from './mat-image-grid.service';

describe('MatImageGridLibService', () => {
  let service: MatImageGridLibService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(MatImageGridLibService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
