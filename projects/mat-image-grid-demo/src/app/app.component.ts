import { Component } from '@angular/core';

import { AppImagesService } from './app-images.service';
import { AppConfig } from './config/app.config';

import {
  MatImageGridImageServiceBase,
  MatImageGridLibComponent,
  PigSettings,
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
    this.imagesBaseUrl = config.imagesBaseUrl;
  }

  protected settings: PigSettings = {
    urlForSize: (filename: string, imageWidth: number, imageHeight: number) => {
      // We need an url like 'https://picsum.photos/id/201/800/600'
      return `${this.imagesBaseUrl}/${filename}/${imageWidth.toString(10)}/${imageHeight.toString(10)}`;
    },
  };
}
