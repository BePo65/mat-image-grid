import { Component } from '@angular/core';
import { MatTabsModule } from '@angular/material/tabs';
import { RouterModule, RouterOutlet } from '@angular/router';

import { AppImagesService } from './services/app-images.service';
import { GlobalSettings } from './shared/global-settings';

import {
  MatImageGridImageServiceBase,
  MatImageGridLibComponent,
} from 'projects/mat-image-grid-lib/src';

type RouteTab = { title: string; route: string; index: number };

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    MatImageGridLibComponent,
    MatTabsModule,
    RouterModule,
    RouterOutlet,
  ],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
  providers: [
    {
      provide: MatImageGridImageServiceBase,
      useClass: AppImagesService,
    },
  ],
})
export class AppComponent {
  public title = 'Mat-Image-Grid-Demo';

  protected tabs: RouteTab[] = [
    { title: 'Simple Grid', route: '/simple-grid', index: 0 },
    { title: 'Extended Grid', route: '/extended-grid', index: 1 },
    { title: 'Large Dataset', route: '/large-dataset', index: 2 },
  ];
  protected activeTab = this.tabs[0].index;

  private imagesBaseUrl: string;

  constructor(private settings: GlobalSettings) {
    this.imagesBaseUrl = this.settings.imagesBaseUrl;
  }

  /**
   * Get the URL for an image with the given ID & size.
   * Used by mat-image-grid 'urlForSize' parameter.
   * This demo uses an url like 'https://picsum.photos/id/201/800/600'.
   * @param imageId - The ID of the image (e.g. teh filename).
   * @param imageWidth - The width (in pixels) of the image.
   * @param imageHeight - The height (in pixels) of the image.
   * @returns The URL of the image with the given size.
   */
  protected urlForSize = (
    imageId: string,
    imageWidth: number,
    imageHeight: number,
  ) => {
    return `${this.imagesBaseUrl}/${imageId}/${imageWidth.toString(10)}/${imageHeight.toString(10)}`;
  };
}
