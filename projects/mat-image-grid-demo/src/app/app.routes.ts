import { Routes } from '@angular/router';

import { ExtendedGridComponent } from './pages/extended-grid/extended-grid.component';
import { LargeDatasetComponent } from './pages/large-dataset/large-dataset.component';
import { PageNotFoundComponent } from './pages/not-found/not-found.component';
import { SimpleGridComponent } from './pages/simple-grid/simple-grid.component';
import { ExtendedGridImagesService } from './services/extended-grid-images.service';
import { SimpleGridImagesService } from './services/simple-grid-images.service';

import { MatImageGridImageServiceBase } from 'projects/mat-image-grid-lib/src';

export const routes: Routes = [
  {
    path: 'simple-grid',
    component: SimpleGridComponent,
    title: 'MatImageGrid Demo - Simple Grid',
    providers: [
      {
        provide: MatImageGridImageServiceBase,
        useClass: SimpleGridImagesService,
      },
    ],
  },
  {
    path: 'extended-grid',
    component: ExtendedGridComponent,
    title: 'MatImageGrid Demo - Extended Grid',
    providers: [
      {
        provide: MatImageGridImageServiceBase,
        useClass: ExtendedGridImagesService,
      },
    ],
  },
  {
    path: 'large-dataset',
    component: LargeDatasetComponent,
    title: 'MatImageGrid Demo - Large Dataset',
    providers: [
      {
        provide: MatImageGridImageServiceBase,
        useClass: SimpleGridImagesService,
      },
    ],
  },
  { path: '', redirectTo: '/simple-grid', pathMatch: 'full' },
  {
    path: '**',
    component: PageNotFoundComponent,
    title: 'MatImageGrid Demo - Page not found',
  },
];
