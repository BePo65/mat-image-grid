import { SimpleGridDatastoreService } from './simple-grid.datastore.service';

import { RequestImagesRange } from 'projects/mat-image-grid-lib/src';

describe('SimpleGridDatastoreService', () => {
  let service: SimpleGridDatastoreService;

  beforeEach(() => {
    service = new SimpleGridDatastoreService();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should retrieve number of entries the datastore', (done) => {
    const requestedRange = {
      startImageIndex: 0,
      numberOfImages: 0,
    } as RequestImagesRange;
    service.getPagedData(requestedRange).subscribe((result) => {
      expect(result.content.length).toBe(0);
      expect(result.returnedElements).toBe(0);
      expect(result.startImageIndex).toBe(0);
      expect(result.totalElements).toBe(200);
      expect(result.totalFilteredElements).toBe(200);
      done();
    });
  });

  it('should retrieve first entry in the datastore', (done) => {
    const requestedRange = {
      startImageIndex: 0,
      numberOfImages: 1,
    } as RequestImagesRange;
    service.getPagedData(requestedRange).subscribe((result) => {
      expect(result.content.length).toBe(1);
      expect(result.returnedElements).toBe(1);
      expect(result.startImageIndex).toBe(0);
      expect(result.totalElements).toBe(200);
      expect(result.totalFilteredElements).toBe(200);
      expect(result.content[0]).toEqual({
        imageId: '102',
        aspectRatio: 1.3333333333333333,
      });
      done();
    });
  });

  it('should retrieve last 2 entries in the datastore', (done) => {
    const requestedRange = {
      startImageIndex: 3,
      numberOfImages: 2,
    } as RequestImagesRange;
    service.getPagedData(requestedRange).subscribe((result) => {
      expect(result.content.length).toBe(2);
      expect(result.returnedElements).toBe(2);
      expect(result.startImageIndex).toBe(3);
      expect(result.totalElements).toBe(200);
      expect(result.totalFilteredElements).toBe(200);
      expect(result.content).toEqual([
        {
          imageId: '106',
          aspectRatio: 1.5,
        },
        {
          imageId: '107',
          aspectRatio: 1.5001500150015001,
        },
      ]);
      done();
    });
  });

  it('should not throw retrieving non existing entries in the datastore', (done) => {
    const requestedRange = {
      startImageIndex: 194,
      numberOfImages: 10,
    } as RequestImagesRange;
    service.getPagedData(requestedRange).subscribe((result) => {
      expect(result.content.length).toBe(6);
      expect(result.returnedElements).toBe(6);
      expect(result.startImageIndex).toBe(194);
      expect(result.totalElements).toBe(200);
      expect(result.totalFilteredElements).toBe(200);
      expect(result.content[0]).toEqual({
        imageId: '311',
        aspectRatio: 1.7761989342806395,
      });
      done();
    });
  });
});
