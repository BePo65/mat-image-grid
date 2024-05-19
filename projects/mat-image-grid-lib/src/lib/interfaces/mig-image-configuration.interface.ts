import { ElementRef } from '@angular/core';

import { GetImageSize, UrlForImageFromDimensions } from './mig-common.types';
import { MigImageData } from './mig-image-data.interface';

export interface MigImageConfiguration {
  container: ElementRef<HTMLDivElement>;
  thumbnailSize: number;
  lastWindowWidth: number;
  withClickEvent?: boolean;
  getImageSize: GetImageSize;
  urlForImage: UrlForImageFromDimensions<MigImageData>;
  urlForThumbnail: UrlForImageFromDimensions<MigImageData>;
}
