import { Renderer2 } from '@angular/core';

import { MigImageExtClassNames } from './mig-image-ext-class-names.interface';
import { MigImageExtData } from './mig-image-ext-data.interface';

import {
  MigImageConfiguration,
  ProgressiveImage,
  imageElementBase,
} from 'projects/mat-image-grid-lib/src';

export class ProgressiveImageExt extends ProgressiveImage {
  public imageDateTaken: string;
  public imageDescription: string;

  protected override classNames: MigImageExtClassNames;

  constructor(
    renderer2: Renderer2,
    singleImageData: MigImageExtData,
    index: number,
    configuration: MigImageConfiguration,
  ) {
    super(renderer2, singleImageData, index, configuration);

    // Additional data for ProgressiveImage instance
    this.imageDateTaken = singleImageData.imageDate;
    this.imageDescription = singleImageData.description;

    this.classNames = {
      figure: 'mat-image-grid-figure',
      fullImage: 'mat-image-grid-full-image',
      thumbnail: 'mat-image-grid-thumbnail',
      loaded: 'mat-image-grid-loaded',
      dateTaken: 'mat-image-grid-date',
      imageDescription: 'mat-image-grid-desc',
      imageOverlay: 'mat-image-grid-overlay',
      fullImageVisibility: 'mat-image-grid-full-image-visibility',
    } as MigImageExtClassNames;
  }

  /**
   * Add a div tag as a subelement to the <figure> tag.
   * @param mainElement - Main element of this image (<figure> tag)
   * @param subElementName - name of the subelement
   * @param content - static content of the div tag
   * @param className - name of the class to be added to the new subelement (default value='' - i.e. no class added)
   */
  protected addDivAsSubElementOverlay(
    mainElement: HTMLElement,
    subElementName: string,
    content: string,
    className = '',
  ): void {
    if (!this.elements.get(subElementName)) {
      const element = this.renderer.createElement('div') as HTMLDivElement;
      element.innerHTML = content;

      if (className.length > 0) {
        this.renderer.addClass(element, className);
        this.renderer.addClass(element, this.classNames.imageOverlay);
      }

      const subElement = {
        element: element,
        eventUnloadHandlers: [],
      } as imageElementBase;

      this.elements.set(subElementName, subElement);
      this.renderer.appendChild(mainElement, element);
    }
  }

  /**
   * Modify layout of image by adding 2 div tags to the structure created
   * by the base class.
   */
  override addAllSubElements(): void {
    super.addAllSubElements();
    const mainElement = this.getMainElement();

    // Add div for date
    this.addDivAsSubElementOverlay(
      mainElement,
      'dateOverlay',
      this.imageDateTaken,
      this.classNames.dateTaken,
    );

    // Add div for desc
    this.addDivAsSubElementOverlay(
      mainElement,
      'descriptionOverlay',
      this.imageDescription,
      this.classNames.imageDescription,
    );

    // Modify default element generated by base class
    const fullImage = this.elements.get('fullImage');
    if (fullImage) {
      fullImage.element.title = this.imageDescription;
      this.renderer.addClass(
        fullImage.element,
        this.classNames.fullImageVisibility,
      );

      // Add event handler to full size image, as we must show custom fields, when image is loaded.
      const onloadHandlerUnload = this.renderer.listen(
        fullImage.element,
        'load',
        () => {
          // We have to make sure the elements still exist, as they may already have been
          // deallocated if the user scrolls too fast.
          const dateOverlayElement = this.elements.get('dateOverlay')?.element;
          if (dateOverlayElement) {
            this.renderer.addClass(dateOverlayElement, 'mat-image-grid-loaded');
          }

          const dscOverlayElement =
            this.elements.get('descriptionOverlay')?.element;
          if (dscOverlayElement) {
            this.renderer.addClass(dscOverlayElement, 'mat-image-grid-loaded');
          }
        },
      );

      fullImage.eventUnloadHandlers.push(onloadHandlerUnload);
    }
  }

  /**
   * Remove all elements of image - required by pig system.
   */
  override removeAllSubElements(): void {
    super.removeAllSubElements();
    const mainElement = this.getMainElement();
    this.removeSubElement(mainElement, 'date');
    this.removeSubElement(mainElement, 'desc');
  }
}
