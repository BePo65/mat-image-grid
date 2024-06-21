import { Injectable } from '@angular/core';
import { inject } from '@angular/core/testing';
import { Observable, of } from 'rxjs';

import {
  RequestImagesRange,
  FieldSortDefinition,
  FieldFilterDefinition,
} from '../interfaces/datastore-provider.interface';

import { AppDatastoreServiceBase } from './app.datastore.base.service';

import { MigImageData, Page } from 'projects/mat-image-grid-lib/src';

@Injectable({ providedIn: 'root' })
class MatImageGridTestService extends AppDatastoreServiceBase {
  private mockData: MigImageData[] = [
    {
      imageId: '90000',
      aspectRatio: 0.75,
    } as MigImageData,
    {
      imageId: '90001',
      aspectRatio: 1.55,
    } as MigImageData,
    {
      imageId: '90002',
      aspectRatio: 0.9,
    } as MigImageData,
    {
      imageId: '90003',
      aspectRatio: 1.35,
    } as MigImageData,
    {
      imageId: '90004',
      aspectRatio: 1.15,
    } as MigImageData,
  ];
  public override getPagedData(
    /* eslint-disable @typescript-eslint/no-unused-vars */
    imagesRange: RequestImagesRange,
    sorts?: FieldSortDefinition<MigImageData>[],
    filters?: FieldFilterDefinition<MigImageData>[],
    /* eslint-enable @typescript-eslint/no-unused-vars */
  ): Observable<Page<MigImageData>> {
    const resultPage = {
      content: [],
      startImageIndex: imagesRange.startImageIndex,
      returnedElements: 0,
      totalElements: 5372,
      totalFilteredElements: this.mockData.length,
    } as Page<MigImageData>;
    const endIndex = Math.max(
      0,
      Math.min(
        imagesRange.startImageIndex + imagesRange.numberOfImages - 1,
        this.mockData.length - 1,
      ),
    );
    if (imagesRange.numberOfImages > 0) {
      for (let i = imagesRange.startImageIndex; i <= endIndex; i++) {
        const entry = { ...this.mockData[i] } as MigImageData;
        resultPage.returnedElements = resultPage.content.push(entry);
      }
    }

    return of(resultPage);
  }
}

@Injectable({ providedIn: 'root' })
class MatImageGridErrorTestService extends AppDatastoreServiceBase {}

describe('MatImageGridLibService', () => {
  it('should be created', () => {
    const service = new MatImageGridTestService();

    expect(service).toBeTruthy();
  });

  it('should retrieve number of entries the datastore', inject(
    [MatImageGridTestService],
    (imageService: AppDatastoreServiceBase) => {
      const requestedRange = {
        startImageIndex: 0,
        numberOfImages: 0,
      } as RequestImagesRange;
      imageService.getPagedData(requestedRange).subscribe((result) => {
        expect(result.content.length).toBe(0);
        expect(result.returnedElements).toBe(0);
        expect(result.startImageIndex).toBe(0);
        expect(result.totalElements).toBe(5372);
        expect(result.totalFilteredElements).toBe(5);
      });
    },
  ));

  it('should retrieve first entry in the datastore', inject(
    [MatImageGridTestService],
    (imageService: AppDatastoreServiceBase) => {
      const requestedRange = {
        startImageIndex: 0,
        numberOfImages: 1,
      } as RequestImagesRange;
      imageService.getPagedData(requestedRange).subscribe((result) => {
        expect(result.content.length).toBe(1);
        expect(result.returnedElements).toBe(1);
        expect(result.startImageIndex).toBe(0);
        expect(result.totalElements).toBe(5372);
        expect(result.totalFilteredElements).toBe(5);
        expect(result.content[0]).toEqual({
          imageId: '90000',
          aspectRatio: 0.75,
        });
      });
    },
  ));

  it('should retrieve last 2 entries in the datastore', inject(
    [MatImageGridTestService],
    (imageService: AppDatastoreServiceBase) => {
      const requestedRange = {
        startImageIndex: 3,
        numberOfImages: 2,
      } as RequestImagesRange;
      imageService.getPagedData(requestedRange).subscribe((result) => {
        expect(result.content.length).toBe(2);
        expect(result.returnedElements).toBe(2);
        expect(result.startImageIndex).toBe(3);
        expect(result.totalElements).toBe(5372);
        expect(result.totalFilteredElements).toBe(5);
        expect(result.content).toEqual([
          {
            imageId: '90003',
            aspectRatio: 1.35,
          },
          {
            imageId: '90004',
            aspectRatio: 1.15,
          },
        ]);
      });
    },
  ));

  it('should not throw retrieving non existing entries in the datastore', inject(
    [MatImageGridTestService],
    (imageService: AppDatastoreServiceBase) => {
      const requestedRange = {
        startImageIndex: 4,
        numberOfImages: 10,
      } as RequestImagesRange;
      imageService.getPagedData(requestedRange).subscribe((result) => {
        expect(result.content.length).toBe(1);
        expect(result.returnedElements).toBe(1);
        expect(result.startImageIndex).toBe(4);
        expect(result.totalElements).toBe(5372);
        expect(result.totalFilteredElements).toBe(5);
        expect(result.content[0]).toEqual({
          imageId: '90004',
          aspectRatio: 1.15,
        });
      });
    },
  ));
});

describe('MatImageGridLibService without getPagedData', () => {
  it('should throw retrieving number of entries the datastore', inject(
    [MatImageGridErrorTestService],
    (imageService: AppDatastoreServiceBase) => {
      expect(() => {
        const requestedRange = {
          startImageIndex: 0,
          numberOfImages: 0,
        } as RequestImagesRange;
        imageService.getPagedData(requestedRange);
      }).toThrowError(Error, 'Method "getPagedData" not implemented.');
    },
  ));
});
