- make pig get image data from a paged data store not as an array with data of all images

  - will it run on large dataset?
  - do we need to split very large requests to smaller ones?
  - > > > reserve space im this.images, when starting requests (create sparse array; set this.images.length)
  - remove images when no more needed (add option for size of buffer of images?)
  - scroll backwards will reload images?

- make primaryImageBufferHeight and secondaryImageBufferHeight relative to viewport height
