import {
  AfterViewInit,
  Component,
  OnDestroy,
  Renderer2,
  ViewChild,
} from '@angular/core';

import { AppDataSource } from '../../app.data-source.class';
import { LargeDatasetDatastoreService } from '../../services/large-dataset.datastore.service';

import {
  MatImageGridLibComponent,
  MigImageData,
} from 'projects/mat-image-grid-lib/src';

@Component({
  selector: 'app-large-dataset',
  standalone: true,
  imports: [MatImageGridLibComponent],
  templateUrl: './large-dataset.component.html',
  styleUrl: './large-dataset.component.scss',
})
export class LargeDatasetComponent implements AfterViewInit, OnDestroy {
  public componentType = 'LargeDatasetComponent';

  @ViewChild(MatImageGridLibComponent)
  imageGrid!: MatImageGridLibComponent; // Do not use before ngAfterViewInit

  protected largeDataSource: AppDataSource<MigImageData>;

  private imageColors = [
    {
      background: '#2F3C7E',
      text: '#FBEAEB',
    },
    {
      background: '#F96167',
      text: '#F9E795',
    },
    {
      background: '#990011',
      text: '#FCF6F5',
    },
    {
      background: '#8AAAE5',
      text: '#FFFFFF',
    },
    {
      background: '#00246B',
      text: '#CADCFC',
    },
    {
      background: '#89ABE3',
      text: '#0A0A0A',
    },
    {
      background: '#CC313D',
      text: '#F7C5CC',
    },
    {
      background: '#2C5F2D',
      text: '#97BC62',
    },
    {
      background: '#735DA5',
      text: '#D3C5E5',
    },
    {
      background: '#F98866',
      text: '#FFF2D7',
    },
  ];

  /**
   * Creates an instance of ProgressiveImage.
   * @param datastore - Datastore to request images data from
   * @param renderer - Angular class to modify DOM.
   */
  constructor(
    private datastore: LargeDatasetDatastoreService,
    private renderer: Renderer2,
  ) {
    this.largeDataSource = new AppDataSource(this.datastore);
  }

  ngAfterViewInit(): void {
    this.imageGrid.enable();
  }

  ngOnDestroy(): void {
    this.imageGrid.disable();
  }

  /**
   * Get the URL for an image with the given image data & dimensions.
   * Used by mat-image-grid 'urlForImage' parameter.
   * This demo generates images src as dataUrl.
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
    const colorIndex = this.hashString(singleImageData.imageId) % 10;
    return this.createImageAsDataUrl(
      singleImageData.imageId,
      imageWidth,
      imageHeight,
      this.imageColors[colorIndex].background,
      this.imageColors[colorIndex].text,
    );
  };

  /**
   * Create a hash value for a string.
   * See https://stackoverflow.com/a/34842797/3145923
   * @param sourceString - string to be hashed
   * @returns hash value for string
   */
  private hashString(sourceString: string): number {
    return sourceString
      .split('')
      .reduce((a, b) => ((a << 5) - a + b.charCodeAt(0)) | 0, 0);
  }

  /**
   * Create Data URL for a requested image.
   * @param imageName - text to display in image
   * @param width - width of image in pixels
   * @param height - height of image in pixels
   * @param backgroundColor - background color of image
   * @param testColor - text color of image
   * @returns data URL for generated image
   */
  private createImageAsDataUrl(
    imageName: string,
    width: number,
    height: number,
    backgroundColor: string,
    testColor: string,
  ) {
    let imgUrl = 'data:,Image%20could%20not%20be%20created';
    const textFont = 'normal 24px sans-serif';

    const canvas = this.renderer.createElement('canvas') as HTMLCanvasElement;
    canvas.width = width;
    canvas.height = height;

    const centerX = width / 2;
    const centerY = height / 2;

    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.rect(0, 0, width, height);
      ctx.fillStyle = backgroundColor;
      ctx.fill();
      ctx.font = textFont;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = testColor;
      ctx.fillText(imageName, centerX, centerY, width - 4);
      imgUrl = canvas.toDataURL('image/png');
    }

    return imgUrl;
  }
}
