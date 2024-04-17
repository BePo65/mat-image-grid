import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { LargeDatasetComponent } from './large-dataset.component';

describe('LargeDatasetComponent', () => {
  let component: LargeDatasetComponent;
  let fixture: ComponentFixture<LargeDatasetComponent>;

  beforeEach(waitForAsync(() => {
    // eslint-disable-next-line @typescript-eslint/no-floating-promises
    TestBed.configureTestingModule({
      imports: [LargeDatasetComponent],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(LargeDatasetComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeDefined();
  });

  it('should render message', () => {
    const compiled = fixture.nativeElement as HTMLElement;

    expect(compiled.querySelector('p')?.textContent).toContain(
      'large-dataset works!',
    );
  });
});
