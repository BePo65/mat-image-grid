import { ElementRef } from '@angular/core';

export interface ProgressiveImageConfiguration {
  container: ElementRef<HTMLDivElement>;
  cssClassPrefix: string;
  thumbnailSize: number;
  lastWindowWidth: number;
  withClickEvent?: boolean;
  getImageSize: (lastWindowWidth: number) => number;
  urlForSize: (
    filename: string,
    imageWidth: number,
    imageHeight: number,
  ) => string;
}
