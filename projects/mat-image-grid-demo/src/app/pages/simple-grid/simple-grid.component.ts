import { Component, ViewChild } from '@angular/core';

import { AppDataSource } from '../../classes/app.data-source.class';
import { SimpleGridDatastoreService } from '../../services/simple-grid.datastore.service';

import { SimpleGridSettings } from './simple-grid-settings.class';

import {
  MatImageGridLibComponent,
  MigImageData,
} from 'projects/mat-image-grid-lib/src';

@Component({
  selector: 'app-simple-grid',
  standalone: true,
  imports: [MatImageGridLibComponent],
  templateUrl: './simple-grid.component.html',
  styleUrl: './simple-grid.component.scss',
})
export class SimpleGridComponent {
  public componentType = 'SimpleGridComponent';

  @ViewChild(MatImageGridLibComponent)
  imageGrid!: MatImageGridLibComponent; // Do not use before ngAfterViewInit

  protected simpleDataSource: AppDataSource<MigImageData>;

  private imagesBaseUrl: string;

  constructor(
    private datastore: SimpleGridDatastoreService,
    private settings: SimpleGridSettings,
  ) {
    // SimpleGridSettings is not listed in 'providers' or in route definition,
    // as it is defined with 'providedIn: root'
    this.imagesBaseUrl = this.settings.imagesBaseUrl;
    this.simpleDataSource = new AppDataSource(this.datastore);
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
    singleImageData: MigImageData,
    imageWidth: number,
    imageHeight: number,
  ) => {
    return `${this.imagesBaseUrl}/${singleImageData.imageId}/${imageWidth.toString(10)}/${imageHeight.toString(10)}`;
  };
}
