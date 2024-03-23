import { Injectable } from '@angular/core';

/**
 * Global settings for the application
 */
@Injectable({
  providedIn: 'root',
})
export class AppConfig {
  // Server for images
  public imagesBaseUrl = 'https://picsum.photos/id';
}
