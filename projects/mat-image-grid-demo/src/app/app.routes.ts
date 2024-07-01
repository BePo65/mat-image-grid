import { Routes } from '@angular/router';

import { ExtendedGridComponent } from './pages/extended-grid/extended-grid.component';
import { LargeDatasetComponent } from './pages/large-dataset/large-dataset.component';
import { PageNotFoundComponent } from './pages/not-found/not-found.component';
import { SimpleGridComponent } from './pages/simple-grid/simple-grid.component';
import { ExtendedGridDatastoreService } from './services/extended-grid.datastore.service';
import { LargeDatasetDatastoreService } from './services/large-dataset.datastore.service';
import { SimpleGridDatastoreService } from './services/simple-grid.datastore.service';

export const routes: Routes = [
  {
    path: 'simple-grid',
    component: SimpleGridComponent,
    title: 'MatImageGrid Demo - Simple Grid',
    providers: [SimpleGridDatastoreService],
  },
  {
    path: 'extended-grid',
    component: ExtendedGridComponent,
    title: 'MatImageGrid Demo - Extended Grid',
    providers: [ExtendedGridDatastoreService],
  },
  {
    path: 'large-dataset',
    component: LargeDatasetComponent,
    title: 'MatImageGrid Demo - Large Dataset',
    providers: [LargeDatasetDatastoreService],
  },
  { path: '', redirectTo: '/simple-grid', pathMatch: 'full' },
  {
    path: '**',
    component: PageNotFoundComponent,
    title: 'MatImageGrid Demo - Page not found',
  },
];
