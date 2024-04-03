import { ElementRef } from '@angular/core';

import { GetImageSize, UrlForSize } from './mig-common.types';

export interface MigImageConfiguration {
  container: ElementRef<HTMLDivElement>;
  thumbnailSize: number;
  lastWindowWidth: number;
  withClickEvent?: boolean;
  getImageSize: GetImageSize;
  urlForSize: UrlForSize;
}
