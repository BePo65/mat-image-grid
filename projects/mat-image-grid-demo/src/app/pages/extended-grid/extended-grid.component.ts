import { AsyncPipe } from '@angular/common';
import { Component, Renderer2 } from '@angular/core';
import {
  MatSlideToggleChange,
  MatSlideToggle,
} from '@angular/material/slide-toggle';

import { ExtendedGridSettings } from './extended-grid-settings.class';
import { MigImageExtData } from './mig-customization/mig-image-ext-data.interface';
import { ProgressiveImageExt } from './mig-customization/progressive-image-ext.class';

import {
  MatImageGridLibComponent,
  MigImageConfiguration,
} from 'projects/mat-image-grid-lib/src';

@Component({
  selector: 'app-extended-grid',
  standalone: true,
  imports: [AsyncPipe, MatImageGridLibComponent, MatSlideToggle],
  templateUrl: './extended-grid.component.html',
  styleUrls: [
    './extended-grid.component.scss',
    './mig-customization/mat-image-grid-ext.component.scss',
  ],
})
export class ExtendedGridComponent {
  public componentType = 'ExtendedGridComponent';

  protected showImageDetails = true;
  protected showImageFullScreen = true;
  protected showImageDetailsStyle = 'visible';
  protected showImageFullScreenStyle = 'visible';

  private imagesBaseUrl: string;

  constructor(private settings: ExtendedGridSettings) {
    this.imagesBaseUrl = this.settings.imagesBaseUrl;
  }

  /**
   * Get the URL for an image with the given image data & dimensions.
   * Used by mat-image-grid 'urlForImage' parameter.
   * This demo uses an url like 'https://picsum.photos/id/201/800/600'.
   * @param singleImageData - The properties of one image (e.g. containing the imageId).
   * @param imageWidth - The width (in pixels) of the image.
   * @param imageHeight - The height (in pixels) of the image.
   * @returns The URL of the image with the given size.
   */
  protected urlForImage = (
    singleImageData: MigImageExtData,
    imageWidth: number,
    imageHeight: number,
  ) => {
    return `${this.imagesBaseUrl}/${singleImageData.imageId}/${imageWidth.toString(10)}/${imageHeight.toString(10)}`;
  };

  /**
   * Get the URL for a thumbnail image with the given image data & dimensions.
   * Used by mat-image-grid 'urlForThumbnail' parameter.
   * This demo uses an url like 'https://picsum.photos/id/201/800/600'.
   * @param singleImageData - The properties of one thumbnail (e.g. containing the imageId).
   * @param imageWidth - The width (in pixels) of the thumbnail.
   * @param imageHeight - The height (in pixels) of the thumbnail.
   * @returns The URL of the thumbnail with the given size.
   */
  protected urlForThumbnail = (
    singleImageData: MigImageExtData,
    imageWidth: number, // eslint-disable-line @typescript-eslint/no-unused-vars
    imageHeight: number, // eslint-disable-line @typescript-eslint/no-unused-vars
  ) => {
    const url = singleImageData.thumbnailDataUrl;
    return url;
  };

  /**
   * Create a new instance of the MigImage class.
   * The MigImage class represents 1 image in the image grid.
   * @param renderer - Renderer to be injected into ProgressiveImage constructor.
   * @param singleImageData - Data from the server describing the image.
   * @param index - Index of the image in the list of all images (0..n-1).
   * @param configuration - Configuration data for this image.
   * @returns New instance of the MigImage class.
   */
  protected createMigImage = (
    renderer: Renderer2,
    singleImageData: MigImageExtData,
    index: number,
    configuration: MigImageConfiguration,
  ): ProgressiveImageExt => {
    return new ProgressiveImageExt(
      renderer,
      singleImageData,
      index,
      configuration,
    );
  };

  /**
   * Event handler for the slide toggle setting the 'showImageDetails' property.
   * @param event - source and new value of the slide toggle
   */
  protected onShowImageDetails(event: MatSlideToggleChange): void {
    if (event.checked) {
      this.showImageDetailsStyle = 'visible';
    } else {
      this.showImageDetailsStyle = 'hidden';
    }
  }

  /**
   * Event handler for the slide toggle setting the 'showImageFullScreenStyle' property.
   * @param event - source and new value of the slide toggle
   */
  protected onShowFullScreenImage(event: MatSlideToggleChange): void {
    if (event.checked) {
      this.showImageFullScreenStyle = 'visible';
    } else {
      this.showImageFullScreenStyle = 'hidden';
    }
  }

  protected pigImageOnClick = ($event: MigImageExtData): void => {
    const viewportWidth =
      window.innerWidth ||
      document.documentElement.clientWidth ||
      document.getElementsByTagName('body')[0].clientWidth;
    const width = viewportWidth;
    const height = Math.round(width / $event.aspectRatio);
    const url = `${this.imagesBaseUrl}/${$event.imageId}/${width.toString(10)}/${height.toString(10)}`;
    window.open(url, '_blank');
  };
}
