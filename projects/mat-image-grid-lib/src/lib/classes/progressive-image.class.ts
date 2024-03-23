import { ProgressiveImageClassNames } from '../interfaces/pig-class-names.interface';
import { PigImageData } from '../interfaces/pig-image-data.interface';
import { PigImageStyle } from '../interfaces/pig-Image-style.interface';

import { Pig } from './pig.class';

/**
 * This class manages a single image. It keeps track of the image's height,
 * width, and position in the grid. An instance of this class is associated
 * with a single image figure, which looks like this:
 *
 *   <figure class="pig-figure" style="transform: ...">
 *     <img class="pig-thumbnail pig-loaded" src="/path/to/thumbnail/image.jpg" />
 *     <img class="pig-loaded" src="/path/to/500px/image.jpg" />
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
 * loaded, with opacity:0.  Once it has loaded, it is given the `pig-loaded`
 * class, and its opacity is set to 1.  This creates an effect where there is
 * first a blurred version of the image, and then it appears to come into
 * focus.
 */
export class ProgressiveImage {
  existsOnPage = false;
  aspectRatio: number;
  filename: string;
  index: number;
  pig: Pig;
  classNames: ProgressiveImageClassNames;
  element?: HTMLElement;
  style?: PigImageStyle;
  // Placeholder for 'subElement'
  [key: string]: unknown;

  /**
   * Creates an instance of ProgressiveImage.
   * @param singleImageData - An array of metadata about each image
   * @param index - Index of image in data source
   * @param pig - The Pig instance
   * @returns The ProgressiveImage instance, for easy chaining with the constructor.
   */
  constructor(singleImageData: PigImageData, index: number, pig: Pig) {
    // Instance information
    this.aspectRatio = singleImageData.aspectRatio;
    this.filename = singleImageData.filename;
    this.index = index;
    this.pig = pig;

    this.classNames = {
      figure: `${pig.settings.classPrefix}-figure`,
      thumbnail: `${pig.settings.classPrefix}-thumbnail`,
      loaded: `${pig.settings.classPrefix}-loaded`,
    } as ProgressiveImageClassNames;
  }

  /**
   * Load the image element associated with this ProgressiveImage into the DOM.
   * This function will append the figure into the DOM, create and insert the
   * thumbnail, and create and insert the full image.
   */
  load() {
    // Create a new image element, and insert it into the DOM. It doesn't
    // matter the order of the figure elements, because all positioning
    // is done using transforms.
    this.existsOnPage = true;
    this._updateStyles();
    this.pig.container?.appendChild(this.getElement());

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
    }, 100);
  }

  /**
   * Removes the figure from the DOM, removes the thumbnail and full image, and
   * deletes the this.thumbnail and this.fullImage properties off of the
   * ProgressiveImage object.
   */
  hide() {
    // Remove the images from the element, so that if a user is scrolling super
    // fast, we won't try to load every image we scroll past.
    if (this.getElement()) {
      this.removeAllSubElements();
    }

    // Remove the image from the DOM.
    if (this.existsOnPage) {
      this.pig.container?.removeChild(this.getElement());
    }

    this.existsOnPage = false;
  }

  /**
   * Get the DOM element associated with this ProgressiveImage. We default to
   * using this.element, and we create it, if it doesn't exist.
   * @returns The DOM element associated with this instance.
   */
  getElement(): HTMLElement {
    if (!this.element) {
      this.element = document.createElement(this.pig.settings.figureTagName);
      this.element.className = this.classNames.figure;
      if (this.pig.settings.onClickHandler !== null) {
        this.element.addEventListener('click', () => {
          this.pig.settings.onClickHandler(this.filename);
        });
      }
      this._updateStyles();
    }

    return this.element;
  }

  /**
   * Add an image as a subelement to the <figure> tag.
   * @param subElementName - Name of the subelement
   * @param filename - ID, used to access the image (e.g. the filename)
   * @param height - Size of the image the image (e.g. this.pig.settings.thumbnailSize)
   * @param aspectRatio - Aspect ratio of the image the image
   * @param className - Name of the class to be added to the new subelement (default value='' - i.e. no class added)
   */
  addImageAsSubElement(
    subElementName: string,
    filename: string,
    height: number,
    aspectRatio: number,
    className = '',
  ) {
    let subElement = this[subElementName] as HTMLImageElement;
    if (!subElement) {
      this[subElementName] = new Image();
      subElement = this[subElementName] as HTMLImageElement;
      const width = Math.round(aspectRatio * height);
      subElement.src = this.pig.settings.urlForSize(filename, width, height);
      if (className.length > 0) {
        subElement.className = className;
      }
      subElement.onload = () => {
        // We have to make sure thumbnail still exists, we may have already been
        // deallocated if the user scrolls too fast.
        if (subElement) {
          subElement.className += ` ${this.classNames.loaded}`;
        }
      };

      this.getElement().appendChild(subElement);
    }
  }

  /**
   * Add all subelements of the <figure> tag (default: 'thumbnail' and 'fullImage').
   */
  addAllSubElements() {
    // Add thumbnail
    this.addImageAsSubElement(
      'thumbnail',
      this.filename,
      this.pig.settings.thumbnailSize,
      this.aspectRatio,
      this.classNames.thumbnail,
    );

    // Add full image
    this.addImageAsSubElement(
      'fullImage',
      this.filename,
      this.pig.settings.getImageSize(this.pig.lastWindowWidth),
      this.aspectRatio,
    );
  }

  /**
   * Remove a subelement of the <figure> tag (e.g. an image element).
   * @param subElementName - SubElement of the <figure> tag - (e.g. 'this.fullImage')
   */
  removeSubElement(subElementName: string) {
    const subElement = this[subElementName] as HTMLImageElement;
    if (subElement) {
      subElement.src = '';
      this.getElement().removeChild(subElement);
      delete this[subElementName];
    }
  }

  /**
   * Remove all subelements of the <figure> tag (default: 'thumbnail' and 'fullImage').
   */
  removeAllSubElements() {
    this.removeSubElement('thumbnail');
    this.removeSubElement('fullImage');
  }

  /**
   * Updates the style attribute to reflect this style property on this object.
   */
  _updateStyles() {
    if (this.style) {
      this.getElement().style.transition = this.style.transition;
      this.getElement().style.width = `${this.style.width}px`;
      this.getElement().style.height = `${this.style.height}px`;
      this.getElement().style.transform = `translate3d(${this.style.translateX}px, ${this.style.translateY}px, 0)`;
    }
  }
}
