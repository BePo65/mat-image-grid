import { Component, ViewChild } from '@angular/core';

import { AppDataSource } from './classes/app.data-source.class';
import { MinimalGridSettings } from './classes/minimal-grid-settings.class';
import { MinimalGridDatastoreService } from './services/minimal-grid.datastore.service';

import {
  MatImageGridLibComponent,
  MigImageData,
} from 'projects/mat-image-grid-lib/src';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [MatImageGridLibComponent],
  providers: [MinimalGridDatastoreService],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
})
export class AppComponent {
  public title = 'MatImageGrid Minimal Demo';

  @ViewChild(MatImageGridLibComponent)
  imageGrid!: MatImageGridLibComponent; // Do not use before ngAfterViewInit

  protected demoDataSource: AppDataSource<MigImageData>;

  private imagesBaseUrl: string;

  constructor(
    private datastore: MinimalGridDatastoreService,
    private settings: MinimalGridSettings,
  ) {
    // MinimalGridSettings is not listed in 'providers', as it is defined with 'providedIn: root'
    this.imagesBaseUrl = this.settings.imagesBaseUrl;
    this.demoDataSource = new AppDataSource(this.datastore);
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
