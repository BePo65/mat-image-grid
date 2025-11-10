import { Renderer2 } from '@angular/core';
import { Subject } from 'rxjs';

import { UnloadHandler } from '../interfaces/mig-common.types';
import { MigImageClassNames } from '../interfaces/mig-image-class-names.interface';
import { MigImageConfiguration } from '../interfaces/mig-image-configuration.interface';
import { MigImageData } from '../interfaces/mig-image-data.interface';
import { MigImageStyle } from '../interfaces/mig-Image-style.interface';
import { imageElementBase } from '../interfaces/progressive-image.interface';

/**
 * This class manages a single image. It keeps track of the image's height,
 * width, and position in the grid. An instance of this class is associated
 * with a single image figure, which looks like this:
 *
 *   <figure class="mat-image-grid-figure" style="transform: ...">
 *     <img class="mat-image-grid-thumbnail mat-image-grid-loaded" src="/path/to/thumbnail/image.jpg" />
 *     <img class="mat-image-grid-full-image mat-image-grid-loaded" src="/path/to/500px/image.jpg" />
 *   </figure>
 *
 * However, this element may or may not actually exist in the DOM. The actual
 * DOM element may loaded and unloaded depending on where it is with respect
 * to the viewport. This class is responsible for managing the DOM elements,
 * but does not include logic to determine _when_ the DOM elements should
 * be removed.
 *
 * This class also manages the blur-into-focus load effect.  First, the
 * <figure> element is inserted into the page. Then, a very small thumbnail
 * is loaded, stretched out to the full size of the image.  This pixelated
 * image is then blurred using CSS filter: blur(). Then, the full image is
 * loaded, with opacity:0.  Once it has loaded, it is given the
 * `mat-image-grid-loaded` class, and its opacity is set to 1.  This creates
 * an effect where there is first a blurred version of the image, and then it
 * appears to come into focus.
 */
export class ProgressiveImage<ServerData extends MigImageData> {
  public aspectRatio: number;
  public existsOnPage = false;
  public style?: MigImageStyle;

  private readonly onClickSubject = new Subject<ServerData>();
  public onClick$ = this.onClickSubject.asObservable();

  protected elements = new Map<string, imageElementBase>();

  protected singleImageData: ServerData;
  protected imageIndex: number;
  protected classNames: MigImageClassNames;
  protected createSubelementDelayInMs = 100;
  protected renderer: Renderer2;

  private configuration: MigImageConfiguration;
  private readonly mainElementsKey = 'main';

  /**
   * Creates an instance of ProgressiveImage.
   * @param renderer2 - Angular class to modify DOM.
   * @param singleImageData - An array of metadata about each image.
   * @param index - Index of image in data source.
   * @param configuration - Object with the configuration data from the parent object.
   */
  constructor(
    renderer2: Renderer2,
    singleImageData: ServerData,
    index: number,
    configuration: MigImageConfiguration,
  ) {
    this.renderer = renderer2;
    this.configuration = configuration;
    this.singleImageData = singleImageData;
    this.aspectRatio = singleImageData.aspectRatio;
    this.imageIndex = index;

    this.classNames = {
      figure: 'mat-image-grid-figure',
      fullImage: 'mat-image-grid-full-image',
      thumbnail: 'mat-image-grid-thumbnail',
      loaded: 'mat-image-grid-loaded',
    } as MigImageClassNames;
  }

  /**
   * Load the image element associated with this ProgressiveImage into the DOM.
   * This function will append the figure tag into the DOM, create and insert the
   * thumbnail, and create and insert the full image.
   */
  load() {
    // Create a new image element, and insert it into the DOM.
    // The order of the figure elements don't matter, because
    // all positioning is done using css transforms.
    const mainElement = this.getMainElement();
    this.renderer.appendChild(
      this.configuration.container.nativeElement,
      mainElement,
    );
    this.existsOnPage = true;

    // We run the rest of the function in a 100ms setTimeout so that if the
    // user is scrolling down the page very fast and hide() is called within
    // 100ms of load(), the hide() function will set this.existsOnPage to false
    // and we can exit.
    setTimeout(() => {
      // The image was hidden very quickly after being loaded, so don't bother
      // loading it at all.
      if (!this.existsOnPage) {
        return;
      }

      this.addAllSubElements();
    }, this.createSubelementDelayInMs);
  }

  /**
   * Removes the main element (<figure> tag) and all subelements (thumbnail and
   * full image) from the DOM and this ProgressiveImage object.
   */
  hide() {
    // Remove the sub elements from the main element, so that if a user is scrolling
    // super fast, we won't try to load every image we scroll past.
    const mainElement = this.elements.get(this.mainElementsKey);
    if (mainElement) {
      this.removeAllSubElements();

      mainElement.eventUnloadHandlers.forEach((unloadHandler: UnloadHandler) =>
        unloadHandler(),
      );

      this.renderer.removeChild(
        this.configuration.container.nativeElement,
        mainElement.element,
      );

      this.elements.delete(this.mainElementsKey);
    }

    this.existsOnPage = false;
  }

  /**
   * Prepare class for disposing (e.g. complete all observables).
   */
  dispose() {
    this.onClickSubject.complete();
    if (this.existsOnPage) {
      this.hide();
    }
  }

  /**
   * Event handler for the image clicked event (attached to the figure tag).
   * The event handler emits a value to the onClickSubject.
   */
  imageClicked = () => {
    this.onClickSubject.next(this.singleImageData);
  };

  /**
   * Gets the Y position of the top of the image in the web page
   * @returns Y position of the top of the image
   */
  get yTop(): number {
    return this.style?.translateY ?? 0;
  }

  /**
   * Gets the Y position of the bottom of the image in the web page
   * @returns Y position of the bottom of the image
   */
  get yBottom(): number {
    let bottom = 0;
    const style = this.style;
    if (style !== undefined) {
      bottom = style.translateY + style.height;
    }
    return bottom;
  }

  /**
   * Get the wrapper DOM element (<figure> tag) associated with this ProgressiveImage.
   * We create it, if it doesn't exist. The DOM element is not added to the page.
   * @returns The wrapper DOM element associated with this instance.
   */
  protected getMainElement(): HTMLElement {
    let figureElement = this.elements.get(this.mainElementsKey)?.element;
    if (figureElement) {
      this.updateStyles(figureElement);
    } else {
      const element = this.renderer.createElement('figure') as HTMLElement;
      this.renderer.addClass(element, this.classNames.figure);
      this.updateStyles(element);
      this.renderer.setAttribute(
        element,
        'data-image-index',
        this.imageIndex.toString(),
      );

      const mainElement = {
        element: element,
        eventUnloadHandlers: [],
      } as imageElementBase;

      let figureClickUnloadHandler: UnloadHandler;
      if (this.configuration.withClickEvent) {
        figureClickUnloadHandler = this.renderer.listen(
          element,
          'click',
          this.imageClicked,
        );
        mainElement.eventUnloadHandlers.push(figureClickUnloadHandler);
      }

      this.elements.set(this.mainElementsKey, mainElement);
      figureElement = mainElement.element;
    }

    return figureElement;
  }

  /**
   * Add an image as a subelement to the <figure> tag.
   * @param mainElement - Main element of this image (<figure> tag)
   * @param subElementName - Name of the subelement
   * @param className - Name of the class to be added to the new subelement (default value='' - i.e. no class added)
   * @param src - source string of image element (default value = '')
   */
  protected addImageAsSubElement(
    mainElement: HTMLElement,
    subElementName: string,
    className = '',
    src = '',
  ) {
    if (!this.elements.get(subElementName)) {
      const element = this.renderer.createElement('img') as HTMLImageElement;
      this.renderer.setAttribute(element, 'src', src);

      if (className.length > 0) {
        this.renderer.addClass(element, className);
      }

      const onloadHandlerUnload = this.renderer.listen(element, 'load', () => {
        // We have to make sure thumbnail still exists, it may already have been
        // deallocated if the user scrolls too fast.
        if (this.elements.get(subElementName)) {
          this.renderer.addClass(element, 'mat-image-grid-loaded');
        }
      });

      const subElement = {
        element: element,
        eventUnloadHandlers: [onloadHandlerUnload],
      } as imageElementBase;

      this.elements.set(subElementName, subElement);

      this.renderer.appendChild(mainElement, element);
    }
  }

  /**
   * Add all subelements of the <figure> tag (default: 'thumbnail' and 'fullImage').
   */
  protected addAllSubElements() {
    const mainElement = this.getMainElement();

    // Add thumbnail
    let height = this.configuration.thumbnailSize;
    let width = Math.round(this.aspectRatio * height);
    this.addImageAsSubElement(
      mainElement,
      'thumbnail',
      this.classNames.thumbnail,
      this.configuration.urlForThumbnail(this.singleImageData, width, height),
    );

    // Add full image
    height = this.configuration.getImageSize(
      this.configuration.lastWindowWidth,
    );
    width = Math.round(this.aspectRatio * height);
    this.addImageAsSubElement(
      mainElement,
      'fullImage',
      this.classNames.fullImage,
      this.configuration.urlForImage(this.singleImageData, width, height),
    );
  }

  /**
   * Remove a subelement (e.g. an image) of the main element.
   * @param mainElement - Main element of this image (<figure> tag)
   * @param subElementName - Name of the subElement (e.g. 'fullImage')
   */
  protected removeSubElement(mainElement: HTMLElement, subElementName: string) {
    const subElement = this.elements.get(subElementName);
    if (subElement) {
      const element = subElement.element;
      subElement.eventUnloadHandlers.forEach((unloadHandler: UnloadHandler) =>
        unloadHandler(),
      );
      this.renderer.setAttribute(element, 'src', '');

      this.renderer.removeChild(mainElement, element);
      this.elements.delete(subElementName);
    }
  }

  /**
   * Remove all subelements of the <figure> tag (default: 'thumbnail' and 'fullImage')
   * and the event handler for the figure click event (if one exists).
   */
  protected removeAllSubElements() {
    const mainElement = this.getMainElement();
    this.removeSubElement(mainElement, 'thumbnail');
    this.removeSubElement(mainElement, 'fullImage');
  }

  /**
   * Updates the style attribute to reflect the style property of this object.
   * The style property is used to position the main element in the grid.
   * @param element - HTML element where to set the styles.
   */
  protected updateStyles(element: HTMLElement) {
    if (this.style) {
      this.renderer.setStyle(element, 'width', `${this.style.width}px`);
      this.renderer.setStyle(element, 'height', `${this.style.height}px`);
      this.renderer.setStyle(
        element,
        'transform',
        `translate3d(${this.style.translateX}px, ${this.style.translateY}px, 0)`,
      );
    }
  }
}
