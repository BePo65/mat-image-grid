# Changelog

All notable changes to this project will be documented in this file. See [commit-and-tag-version](https://github.com/absolute-version/commit-and-tag-version) for commit guidelines.

## [0.4.4](https://github.com/BePo65/mat-image-grid/compare/v0.4.3...v0.4.4) (2024-08-22)

### Features

- add image index to figure tag ([8f37b3d](https://github.com/BePo65/mat-image-grid/commit/8f37b3d016acf4d41d18a5dfa219e785a9dc02c3))
- change OptimizedResize to MigResizable directive ([6674175](https://github.com/BePo65/mat-image-grid/commit/6674175593f61ab5a85672d6f5d6cb2bdf25038e))
- **demo:** make aspect ratio more random ([4af22c1](https://github.com/BePo65/mat-image-grid/commit/4af22c188b2fd70de15c6299b9ec3e68da597177))
- load data as required (not all at once) ([16750e0](https://github.com/BePo65/mat-image-grid/commit/16750e0da8391ad112a6f07561a60d83cc732fe6))
- use cdkScrollable instead of native event ([8a627fd](https://github.com/BePo65/mat-image-grid/commit/8a627fd37e6da54420fce35a1fa26302b7406b72))

### Bug Fixes

- bufferBottom mixed primary and secondary height ([ea37aa2](https://github.com/BePo65/mat-image-grid/commit/ea37aa2aef2265bf246060056fba703f40909aae))
- **demo:** set height of extended grid to show all content ([01f6841](https://github.com/BePo65/mat-image-grid/commit/01f684118fbe9325cf1b0aaff845b3dd2055151f))
- **lib:** fix error in setting height of viewport ([5ee65c9](https://github.com/BePo65/mat-image-grid/commit/5ee65c94ac4f4899f17d89934507f31ba8bbd935))
- **lib:** remove unused injection ([89a1c5e](https://github.com/BePo65/mat-image-grid/commit/89a1c5ebea08a36ed12220b4d007b5a893b21e8c))
- **lib:** update calculation of area to show images within ([bc430f7](https://github.com/BePo65/mat-image-grid/commit/bc430f79c21351990cbb844d7f9fac2557b47d37))
- make large-dataset handle requests for subsets ([aeb2912](https://github.com/BePo65/mat-image-grid/commit/aeb2912a0bf642bea8dd7abba194bdf1a6a66887))
- remove mess with usage of migContainer and migGrid ([edadfb3](https://github.com/BePo65/mat-image-grid/commit/edadfb338dda05e416bd026565e7eebac2b46e9b))
- update packages to fix github dependabot security warning ([c3cb407](https://github.com/BePo65/mat-image-grid/commit/c3cb407fbb7c1e939d64e647f20c48093d01d370))

## [0.4.3](https://github.com/BePo65/mat-image-grid/compare/v0.4.2...v0.4.3) (2024-05-23)

### Features

- **demo:** add demo for large dataset - step 1 (generate images) ([915b8d9](https://github.com/BePo65/mat-image-grid/commit/915b8d9ad797b76741e7bc1244ade48998fc8f5d))
- **demo:** simulate images (without using a web server) ([6ef75cb](https://github.com/BePo65/mat-image-grid/commit/6ef75cbb5d6d7e1f7670e07a5a2d4bce07b14ab1))
- make image click event emit image data from server ([fd3b2c7](https://github.com/BePo65/mat-image-grid/commit/fd3b2c7f55f255603ff269a4aaaf4808b8a511ab))
- optionally show thumbnails from DataURL in serverdata ([5e544a4](https://github.com/BePo65/mat-image-grid/commit/5e544a47978170ad1c32ba7b0c89e06f082ac94c))

### Bug Fixes

- 'imageClicked' event now emitted in mat-image-grid component ([1826216](https://github.com/BePo65/mat-image-grid/commit/1826216e6c400d9949a7a9c002f6f6854a2f6237))
- adapt tests to current sructure of program ([328910f](https://github.com/BePo65/mat-image-grid/commit/328910fc2bba9b032a35935f868800cf556b053e))
- **lib:** make urlForThumbnail call urlForImage as default ([02f5473](https://github.com/BePo65/mat-image-grid/commit/02f547315717e4692b5327ea491d863e0e4ca2e1))

## [0.4.2](https://github.com/BePo65/mat-image-grid/compare/v0.4.1...v0.4.2) (2024-05-11)

### Features

- set page title in route ([460a09d](https://github.com/BePo65/mat-image-grid/commit/460a09d66be26f31cb2483430c644e77f3ad32f2))

## [0.4.1](https://github.com/BePo65/mat-image-grid/compare/v0.4.0...v0.4.1) (2024-05-09)

### Features

- **demo:** add route for non existing routes ([7c57c02](https://github.com/BePo65/mat-image-grid/commit/7c57c024a012fad33469f446ba20e2aba067e359))

### Bug Fixes

- apply unsubscribe pattern ([c5faa69](https://github.com/BePo65/mat-image-grid/commit/c5faa698fbc031ce41bc362cbb3257edb1f8658b))
- base-href added for publishing to ghpages ([fcd3656](https://github.com/BePo65/mat-image-grid/commit/fcd3656cc7b16d5f6a0a42be68d9c137eacfb324))

## [0.4.0](https://github.com/BePo65/mat-image-grid/compare/v0.3.0...v0.4.0) (2024-05-08)

### Features

- **demo:** add demo page to show how to extend mat-image-grid ([48275ed](https://github.com/BePo65/mat-image-grid/commit/48275edbe55da780be1974dc02a4201992a708b2))

### Bug Fixes

- **demo:** make dimension of images-grid consider navigation tab ([f6d5d3b](https://github.com/BePo65/mat-image-grid/commit/f6d5d3b7b26ddef7848ba326bebe5c586db7a59c))
- **demo:** make empty route set marker for "simple-grid" tab ([1a98931](https://github.com/BePo65/mat-image-grid/commit/1a98931a2742f96186db4fceaa2198a67769799f))
- **demo:** remove unnecessary imports in demo app component ([611196f](https://github.com/BePo65/mat-image-grid/commit/611196fa44da058c0e03a3490210e360b6e0b942))
- **demo:** update active tab ehrn opening a tab via url ([5dac089](https://github.com/BePo65/mat-image-grid/commit/5dac0898333e4b31c3b7963a7391a659479e0a56))
- **lib:** emit length of data asynchronously ([2b86bcb](https://github.com/BePo65/mat-image-grid/commit/2b86bcb37931a58881095cc205cdf95b8434422f))
- **lib:** make images-grid spacing adjust to angular material settings ([24e65ee](https://github.com/BePo65/mat-image-grid/commit/24e65eee73fe79763b80584d4bb38c21ca7cb992))

## [0.3.0](https://github.com/BePo65/mat-image-grid/compare/v0.2.0...v0.3.0) (2024-04-10)

### Features

- migrate pig to angular ([bb7fb94](https://github.com/BePo65/mat-image-grid/commit/bb7fb949770c58a32b819ce21d93145cf2493de3))
- migrate pig to angular ([e1d6fd3](https://github.com/BePo65/mat-image-grid/commit/e1d6fd36ef3a5fa61faa51df4b41e49d2c951a63))
- remove config element 'figureTagName' and stale variables ([4e18a68](https://github.com/BePo65/mat-image-grid/commit/4e18a682e2525233df76f786fb0035008adc18bf))

## [0.2.0](https://github.com/BePo65/mat-image-grid/compare/v0.1.0...v0.2.0) (2024-03-26)

### Features

- merge pig.class into mat-image-grid and add @Input parameters ([0d5d1dc](https://github.com/BePo65/mat-image-grid/commit/0d5d1dc87215f412ad464dbc4a39389a802cb667))

### Bug Fixes

- show progress bar as loading spinner ([81c0fd1](https://github.com/BePo65/mat-image-grid/commit/81c0fd1d9e4c1bf73d0155012dfb8af7b5cc23d4))

## 0.1.0 (2024-03-24)

### Features

- base version of mat-image-grid ([4834c14](https://github.com/BePo65/mat-image-grid/commit/4834c14afc806a7de9de3a7cc79c77ef869c44b2))
