import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';

import { LargeDatasetComponent } from './large-dataset.component';

describe('LargeDatasetComponent', () => {
  let harness: RouterTestingHarness;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LargeDatasetComponent],
      providers: [
        provideRouter([
          { path: 'large-dataset', component: LargeDatasetComponent },
        ]),
      ],
    }).compileComponents();
  });

  beforeEach(async () => {
    harness = await RouterTestingHarness.create('/large-dataset');
  });

  it('should create component instance', () => {
    const component = harness.routeDebugElement
      ?.componentInstance as LargeDatasetComponent;

    expect(component).toBeDefined();
  });

  it('should render component message when created', () => {
    const paragraphs = harness.routeNativeElement?.querySelectorAll('p');

    expect(paragraphs).toHaveSize(1);

    if (paragraphs !== undefined) {
      const content = paragraphs[0].textContent;

      expect(content).toBe('large-dataset works!');
    }
  });
});
