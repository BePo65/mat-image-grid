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
  protected showImageDetails = true;
  protected showImageDetailsStyle = 'visible';

  private imagesBaseUrl: string;

  constructor(private settings: ExtendedGridSettings) {
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

  protected pigImageOnClick = (filename: string): void => {
    window.open(`http://localhost:4200/tours/photos/${filename}`, '_blank');
  };
}
