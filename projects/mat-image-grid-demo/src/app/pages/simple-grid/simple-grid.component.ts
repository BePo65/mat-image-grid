import { AfterViewInit, Component, OnDestroy, ViewChild } from '@angular/core';

import { AppDataSource } from '../../app.data-source.class';
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
export class SimpleGridComponent implements AfterViewInit, OnDestroy {
  public componentType = 'SimpleGridComponent';

  @ViewChild(MatImageGridLibComponent)
  imageGrid!: MatImageGridLibComponent; // Do not use before ngAfterViewInit

  protected simpleDataSource: AppDataSource<MigImageData>;

  private imagesBaseUrl: string;

  constructor(
    private datastore: SimpleGridDatastoreService,
    private settings: SimpleGridSettings,
  ) {
    this.imagesBaseUrl = this.settings.imagesBaseUrl;
    this.simpleDataSource = new AppDataSource(this.datastore);
  }

  // eslint-disable-next-line @angular-eslint/no-empty-lifecycle-method
  ngAfterViewInit(): void {
    // HACK this.imageGrid.enable();
  }

  // eslint-disable-next-line @angular-eslint/no-empty-lifecycle-method
  ngOnDestroy(): void {
    // HACK this.imageGrid.disable();
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
