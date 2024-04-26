import { Component, OnInit } from '@angular/core';
import { MatTabsModule } from '@angular/material/tabs';
import {
  NavigationEnd,
  Router,
  RouterOutlet,
  RouterLink,
} from '@angular/router';

import { MatImageGridLibComponent } from 'projects/mat-image-grid-lib/src';

type RouteTab = { title: string; route: string; index: number };

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [MatImageGridLibComponent, MatTabsModule, RouterOutlet, RouterLink],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
  providers: [],
})
export class AppComponent implements OnInit {
  public title = 'Mat-Image-Grid-Demo';

  protected tabs: RouteTab[] = [
    { title: 'Simple Grid', route: '/simple-grid', index: 0 },
    { title: 'Extended Grid', route: '/extended-grid', index: 1 },
    { title: 'Large Dataset', route: '/large-dataset', index: 2 },
  ];
  protected activeTab = this.tabs[0].index;

  constructor(private router: Router) {}

  ngOnInit(): void {
    this.router.events.subscribe((event) => {
      if (event instanceof NavigationEnd) {
        const activeRoute = this.tabs.find(
          (routeDefinition) => routeDefinition.route === event.url,
        );
        this.activeTab = activeRoute?.index ?? -1;
      }
    });
  }
}
