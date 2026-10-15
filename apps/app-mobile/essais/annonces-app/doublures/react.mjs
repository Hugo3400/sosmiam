import { createRequire } from "node:module";

const React = createRequire(new URL("../../../package.json", import.meta.url))("react");

export default React;
export const { useState, useEffect, useRef, useCallback, useMemo, useSyncExternalStore, useLayoutEffect, createElement } = React;
