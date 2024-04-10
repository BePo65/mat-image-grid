/**
 * Properties of one image (= one element of the material-image-grid data source).
 */
export interface MigImageData {
  /**
   * The ID of the image (e.g. the filename).
   */
  imageId: string;

  /**
   * The aspect ratio of the image.
   */
  aspectRatio: number;
}
