<a name="top"></a>

# Mat-Image-Grid

A fork of the [Progressive Image Grid](https://github.com/schlosser/pig.js/) adapted to Angular Material.

![Version](https://img.shields.io/badge/version-1.0.0-blue.svg?cacheSeconds=2592000)
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
      </ul>
    </li>
    <li><a href="#mat-image-grid-demo">Mat-Image-Grid Demo</a></li>
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
  </ol>
</details>
<!-- END TABLE OF CONTENTS -->

## About The Project

This project modifies the 'Progressive Image Grid' so that it can be used in an Angular Material project.

![Screenshot](assets/screenshot.jpg 'Screenshot of the demo page')

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

Describe here the steps required to insert Mat-Image-Grid in a project.

<p align="right">(<a href="#top">back to top</a>)</p>

## Mat-Image-Grid Demo

Demo project to show all features of Mat-Image-Grid.

```
git clone git@github.com:BePo65/mat-image-grid.git
cd mat-image-grid
npm start
```

Navigate to http://localhost:4200

<p align="right">(<a href="#top">back to top</a>)</p>

## API Reference

`import { MatImageGrid } from '@bepo65/mat-image-grid';`

<a id="classes-api"></a>

### Classes

#### **MatImageGrid**

Component to create an angular material .....

##### **Properties**

| Name                     | Description     |
| ------------------------ | --------------- |
| `@Input() <name>: <type` | \<description>. |
|                          |                 |

##### **Methods**

|                 |                 |
| --------------- | --------------- |
| `<name>`        | \<description>. |
| **Parameters**  |
| \<name>: <type> | \<description>. |
|                 |                 |

<a id="interfaces-api"></a>

### Interfaces

#### interface 1

Description of interface.

##### **Methods**

|                  |                 |
| ---------------- | --------------- |
| `<name>`         | \<description>. |
| **Parameters**   |
| \<name>: \<type> | \<description>. |
| **Returns**      |
| \<type>          | \<description>. |
|                  |                 |

<a id="type-aliases-api"></a>

### Type Aliases

#### Type 1

Description of type.

|                         |
| ----------------------- | --------- | ---------- |
| type <name> = "value 1" | "value 2" | "value 3"; |
|                         |

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
