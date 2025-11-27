import { SortDirection } from '@angular/material/sort';
import { Observable } from 'rxjs';

import { Page } from 'projects/mat-image-grid-lib/src';

type UnionKeys<T> = T extends T ? keyof T : never;
type StrictUnionHelper<T, TAll> = T extends T
  ? T & Partial<Record<Exclude<UnionKeys<TAll>, keyof T>, undefined>>
  : never;
type StrictUnion<T> = StrictUnionHelper<T, T>;

/** Sort direction with 'asc ' or 'desc' only */
export type SortDirectionAscDesc = Omit<SortDirection, ''>;

/**
 * Type defining the sorting a column.
 * @template T - type defining the data of an image
 */
export type FieldSortDefinition<T> = {
  fieldName: keyof T;
  sortDirection: SortDirectionAscDesc;
};

/**
 * Definition of a simple string filter for an image.
 * @template T - type defining the data of an image
 */
export type FieldFilterDefinitionSimple<T> = {
  fieldName: keyof T;
  value: string | number | Date;
};

/**
 * Definition of a range filter for an image.
 * @template T - type defining the data of an image
 */
export type FieldFilterDefinitionRange<T> = {
  fieldName: keyof T;
  valueFrom: string | number | Date;
  valueTo: string | number | Date;
};

/**
 * Definition of a field to filter a list of images.
 * @template T - type defining the data of an image
 */
export type FieldFilterDefinition<T> = StrictUnion<
  FieldFilterDefinitionSimple<T> | FieldFilterDefinitionRange<T>
>;

/**
 * Interface defining the properties of a requests for a range of images.
 */
export interface RequestImagesRange {
  startImageIndex: number;
  numberOfImages: number;
}

/**
 * Interface defining the methods of a class fetching image data from a server.
 * @template T - type defining the data of an image
 */
export interface DataStoreProvider<T> {
  /**
   * Fetching data from the datastore respecting sorting and filtering.
   * @param imagesRange - range of images to get data for
   * @param sorts - optional array of objects with the sorting definition
   * @param filters - optional array of objects with the filter definition
   * @returns observable emitting a Page<T> object
   */
  getPagedData: (
    imagesRange: RequestImagesRange,
    sorts?: FieldSortDefinition<T>[],
    filters?: FieldFilterDefinition<T>[],
  ) => Observable<Page<T>>;
}
