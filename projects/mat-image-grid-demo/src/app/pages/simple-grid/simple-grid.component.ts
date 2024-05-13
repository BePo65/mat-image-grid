import { Component } from '@angular/core';

import { SimpleGridSettings } from './simple-grid-settings.class';

import { MatImageGridLibComponent } from 'projects/mat-image-grid-lib/src';

@Component({
  selector: 'app-simple-grid',
  standalone: true,
  imports: [MatImageGridLibComponent],
  templateUrl: './simple-grid.component.html',
  styleUrl: './simple-grid.component.scss',
})
export class SimpleGridComponent {
  public componentType = 'SimpleGridComponent';

  private imagesBaseUrl: string;

  constructor(private settings: SimpleGridSettings) {
    this.imagesBaseUrl = this.settings.imagesBaseUrl;
  }

  /**
   * Get the URL for an image with the given ID & size.
   * Used by mat-image-grid 'urlForSize' parameter.
   * This demo uses an url like 'https://picsum.photos/id/201/800/600'.
   * @param imageId - The ID of the image (e.g. the filename).
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
