import { Routes } from '@angular/router';

import { ExtendedGridComponent } from './pages/extended-grid/extended-grid.component';
import { LargeDatasetComponent } from './pages/large-dataset/large-dataset.component';
import { PageNotFoundComponent } from './pages/not-found/not-found.component';
import { SimpleGridComponent } from './pages/simple-grid/simple-grid.component';
import { ExtendedGridDatastoreService } from './services/extended-grid.datastore.service';
import { LargeDatasetDatastoreService } from './services/large-dataset.datastore.service';
import { SimpleGridDatastoreService } from './services/simple-grid.datastore.service';

import { DatastoreAdapterServiceBase } from 'projects/mat-image-grid-lib/src';

export const routes: Routes = [
  {
    path: 'simple-grid',
    component: SimpleGridComponent,
    title: 'MatImageGrid Full Demo - Simple Grid',
    providers: [
      {
        provide: DatastoreAdapterServiceBase,
        useClass: SimpleGridDatastoreService,
      },
    ],
  },
  {
    path: 'extended-grid',
    component: ExtendedGridComponent,
    title: 'MatImageGrid Full Demo - Extended Grid',
    providers: [
      {
        provide: DatastoreAdapterServiceBase,
        useClass: ExtendedGridDatastoreService,
      },
    ],
  },
  {
    path: 'large-dataset',
    component: LargeDatasetComponent,
    title: 'MatImageGrid Full Demo - Large Dataset',
    providers: [
      {
        provide: DatastoreAdapterServiceBase,
        useClass: LargeDatasetDatastoreService,
      },
    ],
  },
  { path: '', redirectTo: '/simple-grid', pathMatch: 'full' },
  {
    path: '**',
    component: PageNotFoundComponent,
    title: 'MatImageGrid Full Demo - Page not found',
  },
];
