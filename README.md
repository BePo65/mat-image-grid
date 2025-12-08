<a name="top"></a>

# Mat-Image-Grid

An Angular material component showing images in a grid display. Based on the [Progressive Image Grid](https://github.com/schlosser/pig.js/) of Dan Schlosser adapted to Angular Material.

![Version](https://img.shields.io/badge/version-17.0.0-blue.svg?cacheSeconds=2592000)
[![License](https://img.shields.io/badge/License-MIT-yellow.svg)]
![Angular version](https://img.shields.io/github/package-json/dependency-version/bepo65/mat-image-grid/@angular/core?color=red&label=Angular&logo=angular&logoColor=red)
![GitHub package.json dependency version (prod)](https://img.shields.io/github/package-json/dependency-version/bepo65/mat-image-grid/@angular/material?color=red&label=Angular-Material&logo=angular&logoColor=red)

<!-- TABLE OF CONTENTS -->
<details>
  <summary>Table of Contents</summary>
  <ol>
    <li>
      <a href="#about-the-project">About The Project</a>
    </li>
    <li>
      <a href="#getting-started">Getting Started</a>
      <ul>
        <li><a href="#prerequisites">Prerequisites</a></li>
        <li><a href="#installation">Installation</a></li>
        <li><a href="#embed-mat-image-grid-in-your-project">Embed Mat-Image-Grid In Your Project</a></li>
        <li><a href="#extending">Extending</a></li>
      </ul>
    </li>
    <li><a href="#theming">Theming</a></li>
    <li>
      <a href="#basic-buffer-layout">Basic buffer layout</a>
    </li>
    <li>
      <a href="#api-reference">API Reference</a>
      <ul>
        <li><a href="#classes-api">Classes</a></li>
        <li><a href="#interfaces-api">Interfaces</a></li>
        <li><a href="#type-aliases-api">Type Aliases</a></li>
      </ul>
    </li>
    <li>
      <a href="#contributing">Contributing</a>
      <ul>
        <li><a href="#changelog">Changelog</a></li>
      </ul>
    </li>
    <li><a href="#license">License</a></li>
    <li><a href="#hints">Hints</a></li>
  </ol>
</details>
<!-- END TABLE OF CONTENTS -->

## About The Project

This project modifies the 'Progressive Image Grid' so that it can be used in an Angular Material project.

![Screenshot](assets/screenshot_full-demo.jpg 'Screenshot of the demo page')

Try out the [live demo](https://bepo65.github.io/mat-image-grid/).

<p align="right">(<a href="#top">back to top</a>)</p>

## Getting Started

To use this package in your project just follow these simple steps.

### Prerequisites

The package can be used in Angular apps with Angular Material installed.

### Installation

Install the package from npmjs

```sh
npm install @bepo65/mat-image-grid
```

### Embed Mat-Image-Grid In Your Project

Configure the `mat-image-grid` in your application template and provide the necessary settings.

**Important**: the container for `mat-image-grid` must have a defined height, as this component uses `height. 100%` in one of its subcomponents.

So for example mat-image-grid can be surrounded with a div that has a height set in css or it can be embedded in a css flex or grid element (for examples see the demo projects in mat-image-grid on github).

```html
<mat-image-grid [datastore]="myDatastore" [urlForImage]="myUrlForImage"> loading... </mat-image-grid>
```

```typescript
@Component({
  selector: 'app-root',
  standalone: true,
  imports: [MatImageGridLibComponent],
  providers: [
    {
      provide: AppDatastoreServiceBase,
      useClass: MyGridDatastoreService, // datastore adapter extending DatastoreAdapterServiceBase abstract class
    },
  ],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
})
export class AppComponent {
  constructor(protected myDatastore: AppDatastoreServiceBase<MigImageData>) {}

  protected myUrlForImage = (singleImageData: MigImageData, imageWidth: number, imageHeight: number) => {
    // In this demo we use an url like 'https://picsum.photos/id/201/800/600'
    return `https://picsum.photos/id/${singleImageData.imageId}/${imageWidth.toString(10)}/${imageHeight.toString(10)}`;
  };
}
```

Besides this, we need a service that extends `DatastoreAdapterServiceBase` and provides a list with information about each image to display.

### Extending

`mat-image-grid` can be extended to use more fields from the data store in the displayed images. Details can be found in the full-demo project in the `extended-grid` page.

<p align="right">(<a href="#top">back to top</a>)</p>

## Theming

### Css variables

The definition of a parameter to filter a list of images. 'T' defines the type describing an image.

| Name                                   | Usage                                                             |
| -------------------------------------- | ----------------------------------------------------------------- |
| --mat-image-grid-ease-duration: 500ms; | The time used as `transition-duration` for moving the full image. |
|                                        |                                                                   |

### Angular Material

The Mat-Image-Grid component uses Angular Material (the 'mat-progress-bar' component) and makes it necessary to activate a theme in the application using mat-image-grid (e.g. by inserting `@import '@angular/material/prebuilt-themes/deeppurple-amber.css';` into the 'styles.scss' file of the application).

<p align="right">(<a href="#top">back to top</a>)</p>

## Basic buffer layout

**Buffer layout when scrolling down**

```
+-------------+
| images-grid |
|             |
|             |
|—————————————| <——— remove loaded images before this point from buffer
|             |   ^
|             |   |
|             |   | image data already loaded from server but not added to DOM
|             |   | (height = containerHeight * PostViewportLoadBufferMultiplier)
|             |   |
|             |   v
|— . — . — . —| <——— add images from this point on to DOM (top of first positioned row)
|             |   ^
|             |   |
|             |   | images added to DOM that are no more visible
|             |   | (height = containerHeight * PostViewportDomBufferMultiplier)
|             |   |
|             |   v
|…………………………………|…………………
|             |   ^
|             |   |
|             |   | visible area (images container)
|             |   | (height = containerHeight)
|             |   |
|             |   v
|…………………………………|…………………
|             |   ^
|             |   |
|             |   | images added to DOM that are not yet visible
|             |   | (height = containerHeight * PreViewportDomBufferMultiplier)
|             |   |
|             |   v
|— . — . — . —| <——— images in DOM up to this point
|             |   ^     ^
|             |   |     |
|             |   |     | (height = containerHeight * PreViewportTriggerLoadBufferMultiplier)
|             |   |     |
|             |   |     v
|             |   |++++++++++  <——— trigger loading of more image data,
|             |   |                 when PreViewportDomBuffer scrolls beyond this point
|             |   |
|             |   |
|             |   |
|             |   | images already loaded from server but not added to DOM
|             |   | (height = containerHeight * PreViewportLoadBufferMultiplier)
|             |   |
|             |   v
|—————————————| <——— image already loaded and positioned (but not in DOM)
|             |   ^
|             |   |**********  <——— image data loaded from server, but not yet positioned
|             |   v                 (incomplete rows)
+-------------+ <——— image data from server loaded up to this point
```

When scrolling upward, Pre- and Post- multipliers change place.

A more detailed graphic can be found in the [pdf](assets\mat-image-grid-buffers.pdf).

<p align="right">(<a href="#top">back to top</a>)</p>

## API Reference

`import { MatImageGrid } from '@bepo65/mat-image-grid';`

<a id="classes-api"></a>

### Classes

#### MatImageGrid

Component to create a `mat-image-grid` UI element.

##### **Properties**

| Name                                                                                         | Description                                                                                                                                                              |
| -------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `@Input() PostViewportLoadBufferMultiplier: number`                                          | Multiplier to calculate the height of the buffer for image data still loaded, but no longer in the DOM; base is the height of the current viewport (default = 1).        |
| `@Input() PostViewportDomBufferMultiplier: number`                                           | Multiplier to calculate the height of the buffer for images still in the DOM, but no longer visible; base is the height of the current viewport (default = 0.5).         |
| `@Input() PreViewportDomBufferMultiplier: number`                                            | Multiplier to calculate the height of the buffer for images already in the DOM, but not yet visible; base is the height of the current viewport (default = 1).           |
| `@Input() PreViewportTriggerLoadBufferMultiplier: number`                                    | Multiplier to calculate the position of the trigger point, where more image data is requested from the server; base is the height of the current viewport (default = 1). |
| `@Input() PreViewportLoadBufferMultiplier: number`                                           | Multiplier to calculate the height of the buffer for image data already loaded, but not yet in the DOM; base is the height of the current viewport (default = 3).        |
| `@Input() ScrollDirectionChangeThreshold: number`                                            | Minimum number of pixels to scroll, before a change in scroll direction is recognized (default = 2).                                                                     |
| `@Input() spaceBetweenImages: number`                                                        | Space (in 'px') between the rows of images (default = 8).                                                                                                                |
| `@Input() thumbnailSize: number`                                                             | Size (in 'px') of the shown thumbnails (scaled to the image size; default = 20).                                                                                         |
| `@Input() withImageClickEvents: boolean`                                                     | Should this component emit events, when clicking the image (default = false).                                                                                            |
| `@Input() datastore: DatastoreAdapterServiceBase<ServerData>`                                | Required: adapter for getting a list of images data from the datastore.                                                                                                  |
| `@Input() urlForImage: UrlForImageFromDimensions = this.urlForSizeDefault`                   | Required: callback for getting the url for an image based on the given server data and size (default: url = '/ID/width/height').                                         |
| `@Input() urlForThumbnail: UrlForImageFromDimensions = this.urlForImage`                     | Callback for getting the url for a thumbnail image based on the given server data and size (default: url = '/ID/width/height').                                          |
| `@Input() createMigImage: CreateMigImage<ServerData, MigImage> = this.createMigImageDefault` | Callback for creating a new instance of the ProgressiveImage class (default: new instance of the ProgressiveImage class).                                                |
| `@Input() getMinAspectRatio: GetMinAspectRatio = this.getMinAspectRatioDefault`              | Callback for getting the minimal aspect ratio for a given viewport size (default: getMinAspectRatioDefault).                                                             |
| `@Input() getImageSize: GetImageSize = this.getImageSizeDefault`                             | Callback for getting the image size (height in pixels) to use for a given viewport size (default: getImageSizeDefault).                                                  |
| `@Output() numberOfImagesOnServer: EventEmitter<number>`                                     | Observable emitting the total number of images on the server.                                                                                                            |
| `@Output() numberOfImagesOnServerFiltered: EventEmitter<number>`                             | Observable emitting the number of images on the server after applying the current filter.                                                                                |
| `imageClicked: EventEmitter<Observable<ServerData>>`                                         | Observable emitting the image data from the server, when clicking the image.                                                                                             |
| `loading$: EventEmitter<Observable<boolean>>`                                                | Observable emitting the state of loading the images list from the server.                                                                                                |
|                                                                                              |                                                                                                                                                                          |

The buffer multipliers are accumulative, i.e.

- above the viewport (visible area of the image grid) we have an area with images that already have been added to the DOM and that have just been scrolled out of view. These images can be scrolled into view very fast. The height of this area is viewportHeight \* PostViewportDOMBufferMultiplier.

- above this DOM buffer we have an area with images that have been loaded from the server, but that are no more part of the DOM. Before they can be displayed, they must be added to the DOM, which will take a few milliseconds, but what will be much faster than fetching the images from the server. The height of this area is (viewportHeight \* PostViewportLoadBufferMultiplier).

- below the viewport (when scrolling down) we have the same buffers only the name of the multipliers change from PostViewportXxx to PreViewportXxx.

- an additional element is the point where we request more images from the server. This happens before all images already loaded are added to the DOM, as it will take some time, before a new image list requested from the server arrives. The distance of this trigger point from the bottom of the PreViewportDomBuffer is (viewportHeight \* PreViewportTriggerLoadBufferMultiplier).

**Recommendation**

Make (PostViewportDOMBufferMultiplier + PostViewportLoadBufferMultiplier) the same as (PreViewportDOMBufferMultiplier + PreViewportLoadBufferMultiplier) to avoid too many delete and load operations when scrolling only a little bit up and down.

PreViewportTriggerLoadBufferMultiplier should be greater or equal to (PreViewportTriggerLoadBufferMultiplier \* 0.5) otherwise some of the images that would be requested from the server would already be in the load buffer and we requested more data than necessary.

**Note**: the dataStore is connected to mat-image-grid (and not injected to the component) to enable more than 1 mat-image-grid on a web page.

<a id="interfaces-api"></a>

#### ProgressiveImage

Representation of a single image in a `mat-image-grid`. This class is responsible for defining the html elements of an image and for adding / removing an image from the DOM.

##### **Properties**

This is only an extract of the properties; for more details see the source code.

| Name                             | Description                                                     |
| -------------------------------- | --------------------------------------------------------------- |
| `classNames: MigImageClassNames` | Object containing all css classes used in the html of an image. |

<a id="interfaces-api"></a>

### Interfaces

#### DataStoreAdapter

Interface for a component that fetches data from the datastore respecting sorting and filtering.
The interface is generic; the given type is used to define the object with image data.

##### **Methods**

|                                     |                                                                   |
| ----------------------------------- | ----------------------------------------------------------------- |
| `getPagedData`                      | Fetches data from the datastore respecting sorting and filtering. |
| **Parameters**                      |
| imagesRange: RequestImagesRange     | The range of images to fetch.                                     |
| sorts: FieldSortDefinition<T>[]     | The sort definitions to use.                                      |
| filters: FieldFilterDefinition<T>[] | The filter definitions to use.                                    |
| **Returns**                         |
| Observable<Page<T>>                 | Emitting fetched data from the datastore.                         |
|                                     |                                                                   |

#### Page

Interface defining the properties of a page of images data returned from the datastore.

##### **Properties**

| Name                    | Description                                        |
| ----------------------- | -------------------------------------------------- |
| `content:T[]`           | The array of the requested images data.            |
| `startImageIndex`       | The index of the first image returned.             |
| `returnedElements`      | The number of images in 'content'.                 |
| `totalElements`         | The number of images in the unfiltered data store. |
| `totalFilteredElements` | The number of images after filtering.              |
|                         |                                                    |

#### MigImageData

This interface defines the minimal set required of parameters from the data store defining an image.

##### **Properties**

| Name                  | Description                                                             |
| --------------------- | ----------------------------------------------------------------------- |
| `imageId: string`     | ID of the image file (without query parameters etc; e.g. the filename). |
| `aspectRatio: number` | Aspect ratio of the image (width / height).                             |

#### MigImageConfiguration

This interface defines the parameters of a configuration object for creating a new instance of the ProgressiveImage class.

##### **Properties**

| Name                                         | Description                                                                                                  |
| -------------------------------------------- | ------------------------------------------------------------------------------------------------------------ |
| `container: ElementRef<HTMLDivElement>`      | The array of the requested images data.                                                                      |
| `thumbnailSize: number`                      | The number of images in 'content'.                                                                           |
| `lastWindowWidth: number`                    | The number of images after filtering.                                                                        |
| `withClickEvent?: boolean`                   | The number of images after filtering.                                                                        |
| `getImageSize: GetImageSize`                 | Get the size (height) of an image based on the last computed width of the images container.                  |
| `urlForImage: UrlForImageFromDimensions`     | Get the URL of an image based on the given server data (e.g. the imageId) and the image dimensions.          |
| `urlForThumbnail: UrlForImageFromDimensions` | Get the URL of a thumbnail image based on the given server data (e.g. the imageId) and the image dimensions. |
|                                              |                                                                                                              |

#### RequestImagesRange

Interface defining the properties of a requests for a range of images data.

##### **Properties**

| Name                      | Description                             |
| ------------------------- | --------------------------------------- |
| `startImageIndex: number` | The index of the first image to return. |
| `numberOfImages: number`  | The number of images to return.         |
|                           |                                         |

<a id="type-aliases-api"></a>

### Type Aliases

#### CreateMigImage

The definition of a generic function that creates an image instance from the server data ('singleImageData') and a configuration object of an image.

|                                      |                                                                    |
| ------------------------------------ | ------------------------------------------------------------------ |
| **Generic types**                    |
| M extends MigImageData               | The type of the data from the server describing the image.         |
| P extends ProgressiveImage           | The type of the data describing an image.                          |
| **Parameters**                       |
| renderer: Renderer2                  | The Renderer to be injected into the ProgressiveImage constructor. |
| singleImageData: M                   | The data from the server describing the image..                    |
| index: number                        | The index of the image in the list of all images (0..n-1).         |
| configuration: MigImageConfiguration | The configuration data for this image.                             |
| **Returns**                          |
| P                                    | A new instance of the class describing an image.                   |
|                                      |                                                                    |

#### FieldFilterDefinition

The definition of a parameter to filter a list of images. 'T' defines the type describing an image.

|                                                                                                                    |
| ------------------------------------------------------------------------------------------------------------------ |
| type FieldFilterDefinition<T> = StrictUnion\<(FieldFilterDefinitionSimple\<T> \| FieldFilterDefinitionRange\<T>)>; |
|                                                                                                                    |

#### FieldFilterDefinitionRange

The definition of a parameter filtering for a range of values.

|                                                                                                                                                                                     |
| ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| type FieldFilterDefinitionSimple<T> = {<br>&nbsp;&nbsp;fieldName: keyof T<br>&nbsp;&nbsp;valueFrom: string \| number \| Date<br>&nbsp;&nbsp;valueTo: string \| number \| Date<br>}; |
|                                                                                                                                                                                     |

#### FieldFilterDefinitionSimple

The definition of a parameter filtering for a single value.

|                                                                                                                                |
| ------------------------------------------------------------------------------------------------------------------------------ |
| type FieldFilterDefinitionSimple<T> = {<br>&nbsp;&nbsp;fieldName: keyof T<br>&nbsp;&nbsp;value: string \| number \| Date<br>}; |
|                                                                                                                                |

#### FieldSortDefinition

The definition of a single sort parameter.

|                                                                                                                            |
| -------------------------------------------------------------------------------------------------------------------------- |
| type FieldSortDefinition<T> = {<br>&nbsp;&nbsp;fieldName: keyof T<br>&nbsp;&nbsp;sortDirection: SortDirectionAscDesc<br>}; |
|                                                                                                                            |

#### GetImageSize

The definition of a function to get the image size (height in pixels) to use for this window width.

|                         |                                                    |
| ----------------------- | -------------------------------------------------- |
| **Parameters**          |
| lastWindowWidth: number | The last computed width of the images container.   |
| **Returns**             |
| number                  | The size (height in pixels) of the images to load. |
|                         |                                                    |

#### GetMinAspectRatio

The definition of a function to get the minimum required aspect ratio for a valid row of images.

|                         |                                                |
| ----------------------- | ---------------------------------------------- |
| **Parameters**          |
| lastWindowWidth: number | The last computed width of the browser window. |
| **Returns**             |
| number                  | The minimum aspect ratio at this window width. |
|                         |                                                |

#### SortDirection

The definition of a parameter defining the direction of a sort.

|                                       |
| ------------------------------------- |
| type SortDirection = 'asc' \| 'desc'; |
|                                       |

#### UrlForImageFromDimensions

The definition of a function that gets the url of an image from the server data, the width and the height of an image.

|                               |                                                            |
| ----------------------------- | ---------------------------------------------------------- |
| **Parameters**                |
| singleImageData: MigImageData | The properties of one image (e.g. containing the imageId). |
| imageWidth: number            | The width (in pixels) of the image.                        |
| imageHeight: number           | The height (in pixels) of the image.                       |
| **Returns**                   |
| string                        | The URL of the image.                                      |
|                               |                                                            |

#### UnloadHandler

The definition of the unload handler returned by `renderer2.listen`.

|                                  |
| -------------------------------- |
| type UnloadHandler = () => void; |
|                                  |

<p align="right">(<a href="#top">back to top</a>)</p>

## Contributing

Contributions are what make the open source community such an amazing place to learn, inspire, and create. Any contributions you make are **greatly appreciated**.

If you have a suggestion that would make this better, please fork the repo and create a pull request. You can also simply open an issue with the tag "enhancement".
Don't forget to give the project a star! Thanks again!

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

### Changelog

The project uses 'standard-version' to create the changelog. To enable this system, commit messages are linted before commits are executed by git.

To enable this system you have to run the following scripts in your local repository home directory:

```
npx husky install
npx husky add .husky/commit-msg "npx --no -- commitlint --edit $1"
```

**The structure of commit messages is**:

```
  <header>
  <BLANK LINE>
  <body>
  <BLANK LINE>
  <footer>
```

**header**

```
  <type>(<scope>): <short summary>
```

type and scope

- build: Changes that affect the build system or external dependencies (example scope: npm)
- docs: Documentation only changes
- feat: A new feature
- fix: A bug fix
- perf: A code change that improves performance
- refactor: A code change that neither fixes a bug nor adds a feature
- test: Adding missing tests or correcting existing tests (example scopes: demo, lib, e2e)

**footer**

```
  BREAKING CHANGE: ... (requires MAJOR in Semantic Versioning)
```

For details of the commit messages format see [Contributing to Angular](https://github.com/angular/angular/blob/master/CONTRIBUTING.md#commit).

<p align="right">(<a href="#top">back to top</a>)</p>

## License

Copyright © 2024 [Bernhard Pottler](https://github.com/BePo65).

Distributed under the MIT License. See `LICENSE` for more information.

This project uses the fonts '[Roboto](https://fonts.google.com/specimen/Roboto/about)' and '[Material Icons](https://github.com/google/material-design-icons)' from the [Google Fonts Library](https://fonts.google.com/) that are licensed under the [Apache License Version 2.0](https://www.apache.org/licenses/LICENSE-2.0.txt).

This project uses icons from the [Google Material Icons Library](https://fonts.google.com/icons) that are licensed under the [Apache License Version 2.0](https://www.apache.org/licenses/LICENSE-2.0.txt).

<p align="right">(<a href="#top">back to top</a>)</p>

<!-- HINTS -->

## Hints

As `eslint` V9 requires a fundamental change to the configuration files, the update will be done in a later version.

As a consequence the package `eslint-plugin-cypress` cannot be updated to a version 4.x or 5.x (as this version has a peerDependency of eslint >= 9).

`@cypress/webpack-preprocessor` cannot be updated to v7.x as it does not support webpack v4.x (used by angular v17.x).

`cypress` cannot be updated to v15.x as it no longer supports webpack v4.x (angular v18 will switch away from webpack).

`@cypress/schematic` cannot be updated to v4.x, as this requires angular v18.x.

<p align="right">(<a href="#top">back to top</a>)</p>
