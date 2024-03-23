import { PigImageData } from '../interfaces/pig-image-data.interface';
import { PigSettingsBase } from '../interfaces/pig-settings.interface';

import { Pig } from './pig.class';
import { ProgressiveImage } from './progressive-image.class';

/**
 * Class for defining all Pig options.
 */
export class DefaultPigSettings implements PigSettingsBase {
  /**
   * The class name of the element inside of which images should be loaded.
   */
  containerId = 'pig';

  /**
   * The window or HTML element that the grid scrolls in.
   */
  scroller: Window | HTMLElement = window;

  /**
   * The prefix associated with this library that should be prepended
   * to class names within the grid.
   */
  classPrefix = 'pig';

  /**
   * The tag name to use for each figure. The default setting is
   * to use a <figure></figure> tag.
   */
  figureTagName = 'figure';

  /**
   * Size in pixels of the gap between images in the grid.
   */
  spaceBetweenImages = 8;

  /**
   * Transition speed in milliseconds
   */
  transitionSpeed = 500;

  /**
   * Height in pixels of images to preload in the direction that the user
   * is scrolling. For example, in the default case, if the user is
   * scrolling down, 1000px worth of images will be loaded below
   * the viewport.
   */
  primaryImageBufferHeight = 1000;

  /**
   * Height in pixels of images to preload in the direction
   * that the user is NOT scrolling. For example, in the default case, if
   * the user is scrolling down, 300px worth of images will be loaded
   * above the viewport.  Images further up will be removed.
   */
  secondaryImageBufferHeight = 300;

  /**
   * The height in pixels of the thumbnail that should be
   * loaded and blurred to give the effect that images are loading out of
   * focus and then coming into focus.
   */
  thumbnailSize = 20;

  /**
   * Get the URL for an image with the given filename & size.
   * @param filename - The filename of the image.
   * @param imageWidth - The width (in pixels) of the image.
   * @param imageHeight - The height (in pixels) of the image.
   * @returns The URL of the image at the given size.
   */
  urlForSize(
    filename: string,
    /* eslint-disable @typescript-eslint/no-unused-vars */
    imageWidth: number,
    imageHeight: number,
    /* eslint-enable @typescript-eslint/no-unused-vars */
  ): string {
    return `/${filename}`;
  }

  /**
   * Get the minimum required aspect ratio for a valid row of images. The
   * perfect rows are maintained by building up a row of images by adding
   * together their aspect ratios (the aspect ratio when they are placed
   * next to each other) until that aspect ratio exceeds the value returned
   * by this function. Responsive reordering is achieved through changes
   * to what this function returns at different values of the passed
   * parameter `lastWindowWidth`.
   * @param lastWindowWidth - The last computed width of the browser window.
   * @returns The minimum aspect ratio at this window width.
   */
  getMinAspectRatio(lastWindowWidth: number) {
    if (lastWindowWidth <= 640) {
      return 2;
    } else if (lastWindowWidth <= 1280) {
      return 4;
    } else if (lastWindowWidth <= 1920) {
      return 5;
    }
    return 6;
  }

  /**
   * Get the image size (height in pixels) to use for this window width.
   * Responsive resizing of images is achieved through changes to what this
   * function returns at different values of the passed parameter
   * `lastWindowWidth`.
   * @param lastWindowWidth - The last computed width of the browser window.
   * @returns The size (height in pixels) of the images to load.
   */
  getImageSize(lastWindowWidth: number): number {
    if (lastWindowWidth <= 640) {
      return 100;
    } else if (lastWindowWidth <= 1920) {
      return 250;
    }
    return 500;
  }

  /**
   * Factory function that creates a new instance of the ProgressiveImage class.
   * @param singleImageData - Data of the image in the data source
   * @param index - Index of the image in the data source
   * @param pig - Pig instance, that should contain the image
   * @returns The newly created instance of the ProgressiveImage class
   */
  createProgressiveImage(
    singleImageData: PigImageData,
    index: number,
    pig: Pig,
  ): ProgressiveImage {
    return new ProgressiveImage(singleImageData, index, pig);
  }

  /**
   * Get a callback with the filename property of the image
   * which was clicked.
   * callback signature: function(filename) { ... }
   * @param filename - The filename property of the image.
   */
  onClickHandler(filename: string) {} // eslint-disable-line @typescript-eslint/no-unused-vars
}
