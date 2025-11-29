import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';

import 'zone.js/testing';

import { DemoDataSource } from './fixtures/demo-data-source';
import { MigImageData } from './interfaces/mig-image-data.interface';
import { MatImageGridLibComponent } from './mat-image-grid.component';

type DemoComponentConfig = { numberOfImages: number };

const testImageServiceConfig = {
  numberOfImages: 50,
} as DemoComponentConfig;

const demoDataSource = new DemoDataSource<MigImageData>(testImageServiceConfig);

describe('MatImageGridLibComponent', () => {
  let fixture: ComponentFixture<MatImageGridLibComponent>;
  let component: MatImageGridLibComponent;
  let containerNative: HTMLDivElement;
  let originalTimeout: number;

  const containerHeight = 300;
  const imagesOnFirstLoad = 4;
  const WaitForSubelementsTimeMs = 3000;
  const jasmineTimeout = 5000;

  beforeAll(() => {
    originalTimeout = jasmine.DEFAULT_TIMEOUT_INTERVAL;
    jasmine.DEFAULT_TIMEOUT_INTERVAL = jasmineTimeout;
  });

  afterAll(() => {
    jasmine.DEFAULT_TIMEOUT_INTERVAL = originalTimeout;
  });

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MatImageGridLibComponent],
    }).compileComponents();
  });

  beforeEach(async () => {
    fixture = TestBed.createComponent(MatImageGridLibComponent);
    const compRef = fixture.componentRef;
    compRef.setInput('dataSource', demoDataSource);
    compRef.setInput('urlForImage', urlForImage);
    component = fixture.componentInstance;
    fixture.autoDetectChanges();

    // give grid container a height to trigger loading of images
    const container = fixture.debugElement.query(By.css('.images-container'));
    containerNative = container.nativeElement as HTMLDivElement;
    if (containerNative) {
      containerNative.style.height = `${containerHeight}px`;
    }

    // wait for ProgressiveImage to create all subelements
    await fixture.whenStable();
  });

  it('should create instance', () => {
    expect(component).toBeDefined();
  });

  it('should have a container with a defined height and width', () => {
    expect((fixture.nativeElement as HTMLElement).clientHeight).toBe(
      containerHeight,
    );

    expect(containerNative.style.height).toBe(`${containerHeight}px`);
    expect(containerNative.clientHeight).toBe(containerHeight);
    expect(containerNative.clientWidth).toBeGreaterThan(0);
  });

  it('should have figure entries', async () => {
    // wait for ProgressiveImage to create all subelements
    await new Promise((resolve) =>
      setTimeout(resolve, WaitForSubelementsTimeMs),
    );

    const images = fixture.debugElement.queryAll(By.css('figure'));

    expect(images.length).toBeGreaterThanOrEqual(imagesOnFirstLoad);
  });
});

/**
 * Get the URL for an image with the given image data & dimensions.
 * Used by mat-image-grid 'urlForImage' parameter.
 * This demo uses an url like 'https://00201?w=800&h=600'.
 * @param singleImageData - The properties of one image (e.g. containing the imageId).
 * @param imageWidth - The width (in pixels) of the image.
 * @param imageHeight - The height (in pixels) of the image.
 * @returns The URL of the image with the given size.
 */
const urlForImage = (
  singleImageData: MigImageData,
  imageWidth: number,
  imageHeight: number,
) => {
  const imagesBaseUrl = 'http://demosite.com/images';
  return `${imagesBaseUrl}/test-image.jpg?image=${singleImageData.imageId}&w=${imageWidth.toString(10)}&h=${imageHeight.toString(10)}`;
};
