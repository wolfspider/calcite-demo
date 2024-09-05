# Preact and TypeScript

[![Open in StackBlitz](https://developer.stackblitz.com/img/open_in_stackblitz.svg)](https://stackblitz.com/github/esri/calcite-design-system/tree/dev/examples/components/preact?file=README.md)

To install dependencies and start the development server, run:

```sh
npm install
npm run dev
```

## Developer info

To install `@esri/calcite-components`, run:

```sh
npm install @esri/calcite-components
```

### Setup components

First, define the components:

```js
// src/index.ts
import { defineCustomElements } from "@esri/calcite-components/dist/loader";

defineCustomElements(window);
```

Next, import the global Calcite components stylesheet (only do this once):

```ts
// src/index.ts
import "@esri/calcite-components/dist/calcite/calcite.css";
```

Now you can use Calcite components in your application:

```tsx
// src/routes/profile/index.tsx
<calcite-button onClick={() => setCount((count) => count + 1)}>Click Me</calcite-button>{' '}
```

# Important!

Currently there may be an issue building with Babel and Zip-Fs to fix this
replace the content in zip-fs.js under node modules with the following hack:

```js
import { configure } from "./core/configuration.js";
import { configureWebWorker } from "./z-worker-inline.js";
import { getMimeType } from "./core/util/default-mime-type.js";
import { initShimAsyncCodec } from "./core/util/stream-codec-shim.js";
import { terminateWorkers } from "./core/codec-pool.js";

let baseURL = new URL("./", document.baseURI).href;

configure({ baseURL });
configureWebWorker(configure);

export * from "./core/io.js";
export * from "./core/zip-reader.js";
export * from "./core/zip-writer.js";
export * from "./core/zip-fs-core.js";
export { configure, getMimeType, initShimAsyncCodec, terminateWorkers };
```

You will be able to see the error better after running npm run dev

For any CSS errors which may appear initially install css-modules for type support:

```sh
npm install --save-dev @types/css-modules
```
