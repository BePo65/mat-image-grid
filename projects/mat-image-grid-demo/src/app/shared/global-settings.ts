import { Injectable } from '@angular/core';

/**
 * Global settings for the application
 */
@Injectable({
  providedIn: 'root',
})
export class GlobalSettings {
  // TODO Server for images is for simple-grid only!
  public imagesBaseUrl = 'https://picsum.photos/id';
}
