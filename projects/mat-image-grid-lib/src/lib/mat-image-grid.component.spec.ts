import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MatImageGridLibComponent } from './mat-image-grid.component';

describe('MatImageGridLibComponent', () => {
  let component: MatImageGridLibComponent;
  let fixture: ComponentFixture<MatImageGridLibComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MatImageGridLibComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(MatImageGridLibComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
