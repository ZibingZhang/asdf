# Online Racket IDE

This repository contains the source code for a browser-based, Racket code editor.
It supports most of the language features of the [*How to Do Programming* (HtDP) Teaching Languages](https://docs.racket-lang.org/drracket/htdp-langs.html)
There are important but subtle [distinctions](https://docs.racket-lang.org/htdp-langs/index.html) between the different teaching languages.
Only features up to [Intermediate Student with Lambda](https://docs.racket-lang.org/htdp-langs/intermediate-lam.html) are supported.

### Built With

- [CodeMirror](https://github.com/codemirror/CodeMirror)
- [Material Components](https://github.com/material-components/material-components-web)

## Table of Contents

- [Try It Out](#try-it-out)
- [Getting Started](#getting-started)
  - [Installation](#installation)
  - [Production Build](#production-build)
- [License](#license)

## Try It Out

The IDE is [hosted by GitHub Pages](https://zibingzhang.com/racket-online-ide/).

## Getting Started

### Installation

Below are the steps needed to get the website running locally.

1. Clone the repo
   ```sh
   git clone git@github.com:ZibingZhang/racket-online-ide.git
   ```
2. Install NPM packages
   ```sh
   npm install
   ```
3. Compile with hot reloading at https://localhost:8080
   ```sh
   npm start
   ```

### Production Build

The hot reload configuration options are slightly different than the ones for the prod build.
Below are the steps needed to run the prod build locally.

1. Build the website
   ```sh
   npm run build
   ```
2. Serve it on a local testing server at http://localhost:9000
   ```sh
   npm run serve
   ```

## License

Distributed under the AGPLv3 License. See `LICENSE` for more information.
