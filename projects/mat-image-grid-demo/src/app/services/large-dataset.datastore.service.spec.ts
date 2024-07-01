import { RequestImagesRange } from '../interfaces/datastore-provider.interface';

import { LargeDatasetDatastoreService } from './large-dataset.datastore.service';

describe('LargeDatasetDatastoreService', () => {
  let service: LargeDatasetDatastoreService;

  beforeEach(() => {
    service = new LargeDatasetDatastoreService();
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
      expect(result.totalElements).toBe(1000);
      expect(result.totalFilteredElements).toBe(1000);
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
      expect(result.totalElements).toBe(1000);
      expect(result.totalFilteredElements).toBe(1000);
      expect(result.content[0]).toEqual({
        imageId: '1',
        aspectRatio: 1.1020599913279625,
      });
      done();
    });
  });

  it('should retrieve last 2 entries in the datastore', (done) => {
    const requestedRange = {
      startImageIndex: 998,
      numberOfImages: 2,
    } as RequestImagesRange;
    service.getPagedData(requestedRange).subscribe((result) => {
      expect(result.content.length).toBe(2);
      expect(result.returnedElements).toBe(2);
      expect(result.startImageIndex).toBe(998);
      expect(result.totalElements).toBe(1000);
      expect(result.totalFilteredElements).toBe(1000);
      expect(result.content).toEqual([
        {
          imageId: '999',
          aspectRatio: 1.1020599913279625,
        },
        {
          imageId: '1000',
          aspectRatio: 0.6760912590556813,
        },
      ]);
      done();
    });
  });

  it('should not throw retrieving non existing entries in the datastore', (done) => {
    const requestedRange = {
      startImageIndex: 994,
      numberOfImages: 10,
    } as RequestImagesRange;
    service.getPagedData(requestedRange).subscribe((result) => {
      expect(result.content.length).toBe(6);
      expect(result.returnedElements).toBe(6);
      expect(result.startImageIndex).toBe(994);
      expect(result.totalElements).toBe(1000);
      expect(result.totalFilteredElements).toBe(1000);
      expect(result.content[0]).toEqual({
        imageId: '995',
        aspectRatio: 1.1020599913279625,
      });
      done();
    });
  });
});
