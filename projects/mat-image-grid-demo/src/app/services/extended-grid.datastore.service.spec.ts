import { RequestImagesRange } from '../interfaces/datastore-provider.interface';

import { ExtendedGridDatastoreService } from './extended-grid.datastore.service';

describe('ExtendedGridDatastoreService', () => {
  let service: ExtendedGridDatastoreService;

  beforeEach(() => {
    service = new ExtendedGridDatastoreService();
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
        imageDate: '2023-09-01T01:20:07.975Z',
        description: '1000} - Via asporto adopto aptus tamquam torqueo.',
        toursId: 1000,
        thumbnailDataUrl:
          'data:image/jpg;base64,/9j/2wBDAAgGBgcGBQgHBwcJCQgKDBQNDAsLDBkSEw8UHRofHh0aHBwgJC4nICIsIxwcKDcpLDAxNDQ0Hyc5PTgyPC4zNDL/2wBDAQkJCQwLDBgNDRgyIRwhMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjL/wgARCAAUABsDASIAAhEBAxEB/8QAGQAAAwADAAAAAAAAAAAAAAAAAAQFAQMG/8QAGAEAAgMAAAAAAAAAAAAAAAAAAAQBAgP/2gAMAwEAAhADEAAAAe5VSmoM29UJq5CyDmCaISf/xAAeEAACAgICAwAAAAAAAAAAAAABAgADBBEFExQhMf/aAAgBAQABBQInU7BsupnqXWsA3kkgXuBivocllmHJvaO7Q/f/xAAZEQACAwEAAAAAAAAAAAAAAAABAgAQIUH/2gAIAQMBAT8BRB2FguX/AP/EABoRAAICAwAAAAAAAAAAAAAAAAABAjEDEBL/2gAIAQIBAT8B5nKhYG70j//EACMQAAECBQMFAAAAAAAAAAAAAAABAwIQESGREiIyIzNhcXL/2gAIAQEABj8ClZTkV0xeLC9Fyno2wKt6VNzjaL9HdXBd6PJyXMv/xAAdEAEAAgICAwAAAAAAAAAAAAABABEhMVGBEEFx/9oACAEBAAE/IYkM3w7bi3s2BbLAglyjOxawUHNvqUHLBmpvqE307xe1+pmyf//aAAwDAQACAAMAAAAQ7lhd/8QAGREBAAIDAAAAAAAAAAAAAAAAAQAQESEx/9oACAEDAQE/EMEV2M7X/8QAFxEAAwEAAAAAAAAAAAAAAAAAAAEhEP/aAAgBAgEBPxBtRCoHj//EAB8QAQACAgICAwAAAAAAAAAAAAEAESExQWFRcaGxwf/aAAgBAQABPxAgq47iYxAuI+4WtOLi61i8RRV0I1j6g9WaBV1q7nNgKQF2tDBnbGYm7ZPdEpwjwH8gq9EAfEfL12/cMV2Zn//Z',
      });
      done();
    });
  });

  it('should retrieve last 2 entries in the datastore', (done) => {
    const requestedRange = {
      startImageIndex: 198,
      numberOfImages: 2,
    } as RequestImagesRange;
    service.getPagedData(requestedRange).subscribe((result) => {
      expect(result.content.length).toBe(2);
      expect(result.returnedElements).toBe(2);
      expect(result.startImageIndex).toBe(198);
      expect(result.totalElements).toBe(200);
      expect(result.totalFilteredElements).toBe(200);
      expect(result.content).toEqual([
        {
          imageId: '315',
          aspectRatio: 1.4,
          imageDate: '2023-10-26T06:16:28.164Z',
          description:
            '1198} - Turbo fuga saepe sufficio avaritia sordeo cornu capio tepesco sui.',
          toursId: 1198,
          thumbnailDataUrl:
            'data:image/jpg;base64,/9j/2wBDAAgGBgcGBQgHBwcJCQgKDBQNDAsLDBkSEw8UHRofHh0aHBwgJC4nICIsIxwcKDcpLDAxNDQ0Hyc5PTgyPC4zNDL/2wBDAQkJCQwLDBgNDRgyIRwhMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjL/wgARCAAUABwDASIAAhEBAxEB/8QAGQAAAgMBAAAAAAAAAAAAAAAAAAYBAwUH/8QAFgEBAQEAAAAAAAAAAAAAAAAAAAEC/9oADAMBAAIQAxAAAAFZ6GkNuLmq+nllkhVdYH//xAAeEAACAQQDAQAAAAAAAAAAAAABAgMABAUSESExMv/aAAgBAQABBQKNC7WuKiiTJokch9tm0Y5MgTzbkik+uSSx7r//xAAUEQEAAAAAAAAAAAAAAAAAAAAg/9oACAEDAQE/AR//xAAYEQACAwAAAAAAAAAAAAAAAAAAARARIf/aAAgBAgEBPwG9FP8A/8QAHRAAAQQCAwAAAAAAAAAAAAAAAQACEBEDEiJBgf/aAAgBAQAGPwINaLJTTkG2RUKMX2tPLXKAnT//xAAeEAEAAQQCAwAAAAAAAAAAAAABABEhQWFRcRCBkf/aAAgBAQABPyFOiqATOSG9jUU+0xqLgfINKmM5HO2VWipjUCto07YsFxGbu/H/2gAMAwEAAgADAAAAEFI3Yv/EABgRAQEAAwAAAAAAAAAAAAAAAAABETFB/9oACAEDAQE/EMK4u3//xAAWEQEBAQAAAAAAAAAAAAAAAAABAEH/2gAIAQIBAT8QySbtsX//xAAgEAEAAgEDBQEAAAAAAAAAAAABABEhMUFxUWGBkbHB/9oACAEBAAE/EC5GAy3tKuW36voN66ymxo3eq69EO1DwKmpoAE1vvtFGKQm6nH37GJmnu4P5ENQjK20rhjwbo+blyWUtzUMz/9k=',
        },
        {
          imageId: '316',
          aspectRatio: 1.49981252343457,
          imageDate: '2023-01-27T08:31:31.768Z',
          description: '1199} - Aetas studio ascit tabernus pariatur amicitia.',
          toursId: 1199,
          thumbnailDataUrl:
            'data:image/jpg;base64,/9j/2wBDAAgGBgcGBQgHBwcJCQgKDBQNDAsLDBkSEw8UHRofHh0aHBwgJC4nICIsIxwcKDcpLDAxNDQ0Hyc5PTgyPC4zNDL/2wBDAQkJCQwLDBgNDRgyIRwhMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjL/wgARCAAUAB4DASIAAhEBAxEB/8QAGQAAAwADAAAAAAAAAAAAAAAAAAUGAgME/8QAFQEBAQAAAAAAAAAAAAAAAAAAAQD/2gAMAwEAAhADEAAAAXGUE3Gg2TPYKBwBCYB//8QAHBAAAgIDAQEAAAAAAAAAAAAAAgMAAQQSEwUi/9oACAEBAAEFAq9JJS81UHOUd3lDU1DbHV2I65klIVNKKLYQxn2qmWmf/8QAGBEAAgMAAAAAAAAAAAAAAAAAAAECEBH/2gAIAQMBAT8BwUVf/8QAGBEBAQADAAAAAAAAAAAAAAAAAQACETH/2gAIAQIBAT8B3OaRyb//xAAiEAACAgAEBwAAAAAAAAAAAAABAgAREiExQRATMkJxgaH/2gAIAQEABj8C7h5Eu8pShj6mn2DAxqBn6Rsd5y3LYdipjUVbOXob4G4GTU2J/8QAHBAAAgIDAQEAAAAAAAAAAAAAAREAITFRYXGB/9oACAEBAAE/Id2agCGD6jXjkG0beIFFs6oy9KkyBpEtKR0R+PkrBwNQIXAoUABHGHDo5i4w7c//2gAMAwEAAgADAAAAEAIAYf/EABcRAAMBAAAAAAAAAAAAAAAAAAABMUH/2gAIAQMBAT8QSaMU0VP/xAAaEQACAgMAAAAAAAAAAAAAAAAAARARITFB/9oACAECAQE/EL8F2FcGp//EACIQAQACAgIABwEAAAAAAAAAAAEAESExQVFhcYGRobHB0f/aAAgBAQABPxBcATb/AGFkLhJS+3tLmU1kT6x6y5x5Bg+ZUoCC9HT1LKhwuLCrfD9hVbW9uaNJyl6l0u2XqBHDhuJZRo+BwZvUGBQ0BqV0GrRMJZA0gEt4US/K2f/Z',
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
      expect(result.content[5]).toEqual({
        imageId: '316',
        aspectRatio: 1.49981252343457,
        imageDate: '2023-01-27T08:31:31.768Z',
        description: '1199} - Aetas studio ascit tabernus pariatur amicitia.',
        toursId: 1199,
        thumbnailDataUrl:
          'data:image/jpg;base64,/9j/2wBDAAgGBgcGBQgHBwcJCQgKDBQNDAsLDBkSEw8UHRofHh0aHBwgJC4nICIsIxwcKDcpLDAxNDQ0Hyc5PTgyPC4zNDL/2wBDAQkJCQwLDBgNDRgyIRwhMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjL/wgARCAAUAB4DASIAAhEBAxEB/8QAGQAAAwADAAAAAAAAAAAAAAAAAAUGAgME/8QAFQEBAQAAAAAAAAAAAAAAAAAAAQD/2gAMAwEAAhADEAAAAXGUE3Gg2TPYKBwBCYB//8QAHBAAAgIDAQEAAAAAAAAAAAAAAgMAAQQSEwUi/9oACAEBAAEFAq9JJS81UHOUd3lDU1DbHV2I65klIVNKKLYQxn2qmWmf/8QAGBEAAgMAAAAAAAAAAAAAAAAAAAECEBH/2gAIAQMBAT8BwUVf/8QAGBEBAQADAAAAAAAAAAAAAAAAAQACETH/2gAIAQIBAT8B3OaRyb//xAAiEAACAgAEBwAAAAAAAAAAAAABAgAREiExQRATMkJxgaH/2gAIAQEABj8C7h5Eu8pShj6mn2DAxqBn6Rsd5y3LYdipjUVbOXob4G4GTU2J/8QAHBAAAgIDAQEAAAAAAAAAAAAAAREAITFRYXGB/9oACAEBAAE/Id2agCGD6jXjkG0beIFFs6oy9KkyBpEtKR0R+PkrBwNQIXAoUABHGHDo5i4w7c//2gAMAwEAAgADAAAAEAIAYf/EABcRAAMBAAAAAAAAAAAAAAAAAAABMUH/2gAIAQMBAT8QSaMU0VP/xAAaEQACAgMAAAAAAAAAAAAAAAAAARARITFB/9oACAECAQE/EL8F2FcGp//EACIQAQACAgIABwEAAAAAAAAAAAEAESExQVFhcYGRobHB0f/aAAgBAQABPxBcATb/AGFkLhJS+3tLmU1kT6x6y5x5Bg+ZUoCC9HT1LKhwuLCrfD9hVbW9uaNJyl6l0u2XqBHDhuJZRo+BwZvUGBQ0BqV0GrRMJZA0gEt4US/K2f/Z',
      });
      done();
    });
  });
});
