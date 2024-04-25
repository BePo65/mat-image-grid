import { Component } from '@angular/core';
import { MatTabsModule } from '@angular/material/tabs';
import { RouterModule } from '@angular/router';

import { MatImageGridLibComponent } from 'projects/mat-image-grid-lib/src';

type RouteTab = { title: string; route: string; index: number };

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [MatImageGridLibComponent, MatTabsModule, RouterModule],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
  providers: [],
})
export class AppComponent {
  public title = 'Mat-Image-Grid-Demo';

  protected tabs: RouteTab[] = [
    { title: 'Simple Grid', route: '/simple-grid', index: 0 },
    { title: 'Extended Grid', route: '/extended-grid', index: 1 },
    { title: 'Large Dataset', route: '/large-dataset', index: 2 },
  ];
  protected activeTab = this.tabs[0].index;
}
