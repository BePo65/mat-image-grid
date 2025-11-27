import { Component, OnDestroy, OnInit } from '@angular/core';
import { MatTabsModule } from '@angular/material/tabs';
import {
  NavigationEnd,
  Router,
  RouterOutlet,
  RouterLink,
} from '@angular/router';
import { Subject, takeUntil } from 'rxjs';

type RouteTab = { title: string; route: string; index: number };

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [MatTabsModule, RouterOutlet, RouterLink],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
  providers: [],
})
export class AppComponent implements OnInit, OnDestroy {
  public title = 'MatImageGrid Demo';

  private readonly unsubscribe$ = new Subject<void>();

  protected tabs: RouteTab[] = [
    { title: 'Simple Grid', route: '/simple-grid', index: 0 },
    { title: 'Extended Grid', route: '/extended-grid', index: 1 },
    { title: 'Large Dataset', route: '/large-dataset', index: 2 },
  ];
  protected activeTab = this.tabs[0].index;

  constructor(private router: Router) {}

  ngOnInit(): void {
    this.router.events.pipe(takeUntil(this.unsubscribe$)).subscribe((event) => {
      if (event instanceof NavigationEnd) {
        // remember currently active tab
        const activeRoute = this.tabs.find(
          (routeDefinition) =>
            routeDefinition.route === event.urlAfterRedirects,
        );
        this.activeTab = activeRoute?.index ?? -1;
      }
    });
  }

  ngOnDestroy(): void {
    this.unsubscribe$.next();
    this.unsubscribe$.complete();
  }
}
