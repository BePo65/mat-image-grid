import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { ExtendedGridComponent } from './extended-grid.component';

describe('ExtendedGridComponent', () => {
  let component: ExtendedGridComponent;
  let fixture: ComponentFixture<ExtendedGridComponent>;

  beforeEach(waitForAsync(() => {
    // eslint-disable-next-line @typescript-eslint/no-floating-promises
    TestBed.configureTestingModule({
      imports: [ExtendedGridComponent],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ExtendedGridComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeDefined();
  });

  it('should render message', () => {
    const compiled = fixture.nativeElement as HTMLElement;

    expect(compiled.querySelector('p')?.textContent).toContain(
      'extended-grid works!',
    );
  });
});
