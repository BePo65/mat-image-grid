import { Routes } from '@angular/router';

import { ExtendedGridComponent } from './pages/extended-grid/extended-grid.component';
import { LargeDatasetComponent } from './pages/large-dataset/large-dataset.component';
import { SimpleGridComponent } from './pages/simple-grid/simple-grid.component';

export const routes: Routes = [
  { path: '', redirectTo: '/simple-grid', pathMatch: 'full' },
  { path: 'simple-grid', component: SimpleGridComponent },
  { path: 'extended-grid', component: ExtendedGridComponent },
  { path: 'large-dataset', component: LargeDatasetComponent },
];
