import { ElementRef } from '@angular/core';

export interface ProgressiveImageConfiguration {
  classPrefix: string;
  thumbnailSize: number;
  figureTagName: string;
  lastWindowWidth: number;
  container: ElementRef<HTMLDivElement>;
  withClickEvent?: boolean;
  getImageSize: (lastWindowWidth: number) => number;
  urlForSize: (
    filename: string,
    imageWidth: number,
    imageHeight: number,
  ) => string;
}
