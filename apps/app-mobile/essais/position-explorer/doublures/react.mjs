import { createRequire } from "node:module";

const React = createRequire(new URL("../../../package.json", import.meta.url))("react");

export default React;
export const { createContext, createElement, useCallback, useContext, useEffect, useLayoutEffect, useMemo, useRef, useState, useSyncExternalStore } = React;
