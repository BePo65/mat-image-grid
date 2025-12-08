import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';

import { PageNotFoundComponent } from './not-found.component';

describe('PageNotFoundComponent', () => {
  let harness: RouterTestingHarness;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PageNotFoundComponent],
      providers: [
        provideRouter([
          { path: 'non-existing-path', component: PageNotFoundComponent },
        ]),
      ],
    }).compileComponents();

    harness = await RouterTestingHarness.create('/non-existing-path');
  });

  it('should create component instance', () => {
    const component = harness.routeDebugElement
      ?.componentInstance as PageNotFoundComponent;

    expect(component).toBeDefined();
  });

  it('should render component message when created', () => {
    const headers = harness.routeNativeElement?.querySelectorAll('h2');

    expect(headers).toHaveSize(1);

    if (headers !== undefined) {
      const content = headers[0].textContent;

      expect(content).toContain('Page not found');
    }
  });
});
