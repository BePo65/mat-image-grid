/**
 * Properties of one image (= one element of the pig data source).
 */
export interface PigImageData {
  /**
   * The filename of the image.
   */
  filename: string;

  /**
   * The aspect ratio of the image.
   */
  aspectRatio: number;
}
