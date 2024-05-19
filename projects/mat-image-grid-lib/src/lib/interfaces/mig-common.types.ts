import { Renderer2 } from '@angular/core';

import { ProgressiveImage } from '../classes/progressive-image.class';

import { MigImageConfiguration } from './mig-image-configuration.interface';
import { MigImageData } from './mig-image-data.interface';

export type UnloadHandler = () => void;

/**
 * Configuration parameter for mat-image-grid component.
 * Gets an image url from the image data from the server, width and height of an image.
 * @param singleImageData - The properties of one image (e.g. the imageId).
 * @param imageWidth - The width (in pixels) of the image.
 * @param imageHeight - The height (in pixels) of the image.
 * @returns The URL of the image with the given size.
 */
export type UrlForImageFromDimensions<M extends MigImageData> = (
  singleImageData: M,
  imageWidth: number,
  imageHeight: number,
) => string;

/**
 * Configuration parameter for mat-image-grid component.
 * Creates an image instance from the server data ('singleImageData')
 * and a configuration object of an image.
 * @param renderer - Renderer to be injected into the ProgressiveImage constructor.
 * @param singleImageData - Data from the server describing the image.
 * @param index - Index of the image in the list of all images (0..n-1).
 * @param configuration - Configuration data for this image.
 * @returns New instance of the ProgressiveImage class.
 */
export type CreateMigImage<
  M extends MigImageData,
  P extends ProgressiveImage,
> = (
  renderer: Renderer2,
  singleImageData: M,
  index: number,
  configuration: MigImageConfiguration,
) => P;

/**
 * Configuration parameter for mat-image-grid component.
 * Gets the minimum required aspect ratio for a valid row of images.
 * The perfect rows are maintained by building up a row of images by
 * adding together their aspect ratios (the aspect ratio when they are
 * placed next to each other) until that aspect ratio exceeds the value
 * returned by this function. Responsive reordering is achieved through
 * changes to what this function returns at different values of the
 * passed parameter `lastWindowWidth`.
 * @param lastWindowWidth - The last computed width of the browser window.
 * @returns The minimum aspect ratio at this window width.
 */
export type GetMinAspectRatio = (lastWindowWidth: number) => number;

/**
 * Configuration parameter for mat-image-grid component.
 * Gets the image size (height in pixels) to use for this window width.
 * Responsive resizing of images is achieved through changes to what this
 * function returns at different values of the passed parameter `lastWindowWidth`.
 * @param lastWindowWidth - The last computed width of the images container.
 * @returns The size (height in pixels) of the images to load.
 */
export type GetImageSize = (lastWindowWidth: number) => number;
