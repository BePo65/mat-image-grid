import { Component } from '@angular/core';

import { AppImagesService } from './app-images.service';
import { AppConfig } from './config/app.config';

import {
  MatImageGridImageServiceBase,
  MatImageGridLibComponent,
} from 'projects/mat-image-grid-lib/src';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [MatImageGridLibComponent],
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

  private imagesBaseUrl: string;

  constructor(private config: AppConfig) {
    this.imagesBaseUrl = this.config.imagesBaseUrl;
  }

  /**
   * Get the URL for an image with the given filename & size.
   * Used by mat-image-grid 'urlForSize' parameter.
   * This demo uses an url like 'https://picsum.photos/id/201/800/600'.
   * @param filename - The filename of the image.
   * @param imageWidth - The width (in pixels) of the image.
   * @param imageHeight - The height (in pixels) of the image.
   * @returns The URL of the image with the given size.
   */
  protected urlForSize = (
    filename: string,
    imageWidth: number,
    imageHeight: number,
  ) => {
    return `${this.imagesBaseUrl}/${filename}/${imageWidth.toString(10)}/${imageHeight.toString(10)}`;
  };
}
