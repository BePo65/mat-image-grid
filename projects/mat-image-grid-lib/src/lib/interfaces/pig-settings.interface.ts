import { Pig } from '../classes/pig.class';
import { ProgressiveImage } from '../classes/progressive-image.class';

import { PigImageData } from './pig-image-data.interface';

export interface PigSettingsBase {
  /**
   * The class name of the element inside of which images should be loaded.
   */
  containerId: string;

  /**
   * The window or HTML element that the grid scrolls in.
   */
  scroller: Window | HTMLElement;

  /**
   * The prefix associated with this library that should be prepended
   * to class names within the grid.
   */
  classPrefix: string;

  /**
   * The tag name to use for each figure. The default setting is
   * to use a <figure></figure> tag.
   */
  figureTagName: string;

  /**
   * Size in pixels of the gap between images in the grid.
   */
  spaceBetweenImages: number;

  /**
   * Transition speed in milliseconds
   */
  transitionSpeed: number;

  /**
   * Height in pixels of images to preload in the direction
   * that the user is scrolling. For example, in the default case, if the
   * user is scrolling down, 1000px worth of images will be loaded below
   * the viewport.
   */
  primaryImageBufferHeight: number;

  /**
   * Height in pixels of images to preload in the direction
   * that the user is NOT scrolling. For example, in the default case, if
   * the user is scrolling down, 300px worth of images will be loaded
   * above the viewport.  Images further up will be removed.
   */
  secondaryImageBufferHeight: number;

  /**
   * The height in pixels of the thumbnail that should be
   * loaded and blurred to give the effect that images are loading out of
   * focus and then coming into focus.
   */
  thumbnailSize: number;

  /**
   * Get the URL for an image with the given filename & height.
   * @param filename - The filename of the image.
   * @param imageWidth - The width (in pixels) of the image.
   * @param imageHeight - The height (in pixels) of the image.
   * @returns The URL of the image with the given height.
   */
  urlForSize(filename: string, imageWidth: number, imageHeight: number): string;

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
  getMinAspectRatio(lastWindowWidth: number): number;

  /**
   * Get the image size (height in pixels) to use for this window width.
   * Responsive resizing of images is achieved through changes to what this
   * function returns at different values of the passed parameter
   * `lastWindowWidth`.
   * @param lastWindowWidth - The last computed width of the browser window.
   * @returns The size (height in pixels) of the images to load.
   */
  getImageSize(lastWindowWidth: number): number;

  /**
   * Factory function that creates a new instance of the ProgressiveImage class.
   * @param {object} singleImageData - Data of the image in the data source
   * @param {number} index - Index of the image in the data source
   * @param {object} pig - Pig instance, that should contain the image
   * @returns {object} The newly created instance of the ProgressiveImage class
   */
  createProgressiveImage(
    singleImageData: PigImageData,
    index: number,
    pig: Pig,
  ): ProgressiveImage;
}

export type PigSettings = Partial<PigSettingsBase>;
