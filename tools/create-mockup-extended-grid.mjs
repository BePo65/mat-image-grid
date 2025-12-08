/*
  Create mock data for extended grid from mock data for simple grid.
 */

import { writeFileSync, readFileSync } from 'node:fs';
import { inspect } from 'node:util';
import { resolve } from 'node:path';

import { faker } from '@faker-js/faker';

const filesDirectory = './projects/full-demo/src/app/services/';
const sourcePath = resolve(
  process.cwd(),
  filesDirectory,
  'simple-grid-images.mock.data.ts',
);

const simpleGridDataAsTs = readFileSync(sourcePath, { encoding: 'utf-8' });

if (!simpleGridDataAsTs.startsWith('export default ')) {
  console.error(
    '*** "simple-grid-images.mock.data.ts" does not start with "export default "',
  );
}

let dataSource = [];
const simpleGridDataAsJs = simpleGridDataAsTs.replace(
  'export default ',
  'dataSource = ',
);

eval(simpleGridDataAsJs);

let entryId = 1000;
const images = dataSource.map((entry) => {
  entry.imageDate = faker.date
    .between({
      from: '2023-01-01T00:00:00.000Z',
      to: '2023-12-31T00:00:00.000Z',
    })
    .toISOString();
  entry.description = `${entryId.toString().padStart(4, '0').slice(-4)}} - ${faker.lorem.lines(1)}`;
  entry.toursId = entryId++;
  return entry;
});

const targetPath = resolve(
  process.cwd(),
  filesDirectory,
  'extended-grid-images.mock.data.ts',
);

const mockDataExt = `export default ${inspect(images, { maxArrayLength: 250 })};\n`;
writeFileSync(targetPath, mockDataExt);
