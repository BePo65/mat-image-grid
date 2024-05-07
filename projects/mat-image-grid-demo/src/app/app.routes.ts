import { Routes } from '@angular/router';

import { ExtendedGridComponent } from './pages/extended-grid/extended-grid.component';
import { LargeDatasetComponent } from './pages/large-dataset/large-dataset.component';
import { SimpleGridComponent } from './pages/simple-grid/simple-grid.component';
import { ExtendedGridImagesService } from './services/extended-grid-images.service';
import { SimpleGridImagesService } from './services/simple-grid-images.service';

import { MatImageGridImageServiceBase } from 'projects/mat-image-grid-lib/src';

export const routes: Routes = [
  { path: '', redirectTo: '/simple-grid', pathMatch: 'full' },
  {
    path: 'simple-grid',
    component: SimpleGridComponent,
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
    providers: [
      {
        provide: MatImageGridImageServiceBase,
        useClass: ExtendedGridImagesService,
      },
    ],
  },
  { path: 'large-dataset', component: LargeDatasetComponent, providers: [] },
];
