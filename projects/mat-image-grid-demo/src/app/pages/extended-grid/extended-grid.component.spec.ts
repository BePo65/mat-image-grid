import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';

import { ExtendedGridComponent } from './extended-grid.component';

describe('ExtendedGridComponent', () => {
  let harness: RouterTestingHarness;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ExtendedGridComponent],
      providers: [
        provideRouter([
          { path: 'extended-grid', component: ExtendedGridComponent },
        ]),
      ],
    }).compileComponents();
  });

  beforeEach(async () => {
    harness = await RouterTestingHarness.create('/extended-grid');
  });

  it('should create component instance', () => {
    const component = harness.routeDebugElement
      ?.componentInstance as ExtendedGridComponent;

    expect(component).toBeDefined();
  });

  it('should render component message when created', () => {
    const paragraphs = harness.routeNativeElement?.querySelectorAll('p');

    expect(paragraphs).toHaveSize(1);

    if (paragraphs !== undefined) {
      const content = paragraphs[0].textContent;

      expect(content).toBe('extended-grid works!');
    }
  });
});
