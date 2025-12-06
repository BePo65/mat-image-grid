/**
 * Interface defining the properties of a page of images returned from the datastore.
 * @template T - Type defining the data of an image from the data source.
 */
export interface Page<T> {
  content: T[];
  startImageIndex: number;
  returnedElements: number;
  totalElements: number;
  totalFilteredElements: number;
}
