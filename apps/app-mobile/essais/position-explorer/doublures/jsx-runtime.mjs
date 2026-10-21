import { createRequire } from "node:module";

const runtime = createRequire(new URL("../../../package.json", import.meta.url))("react/jsx-runtime");

export const { Fragment, jsx, jsxs } = runtime;
