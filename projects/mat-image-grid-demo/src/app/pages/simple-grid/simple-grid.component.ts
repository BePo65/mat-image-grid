import { Component } from '@angular/core';

import { AppImagesService } from '../../services/app-images.service';
import { GlobalSettings } from '../../shared/global-settings';

import {
  MatImageGridImageServiceBase,
  MatImageGridLibComponent,
} from 'projects/mat-image-grid-lib/src';

@Component({
  selector: 'app-simple-grid',
  standalone: true,
  imports: [MatImageGridLibComponent],
  templateUrl: './simple-grid.component.html',
  styleUrl: './simple-grid.component.scss',
  providers: [
    {
      provide: MatImageGridImageServiceBase,
      useClass: AppImagesService,
    },
  ],
})
export class SimpleGridComponent {
  private imagesBaseUrl: string;

  // TODO can we inject this config element through the route or a token?
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
