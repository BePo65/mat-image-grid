import { MigImageData } from 'projects/mat-image-grid-lib/src';

/**
 * Additional properties of one element of the customized pig datasource.
 */
export interface MigImageExtData extends MigImageData {
  /**
   * The date the image was taken.
   */
  imageDate: string;

  /**
   * The description of the image.
   */
  description: string;

  /**
   * ID of the tour this image is assigned to
   */
  toursId: number;
}
