import { createRequire } from "node:module";

const rien = () => {};
const ESPACE_HTML = "http://www.w3.org/1999/xhtml";
const documentFactice = { nodeType: 9, addEventListener: rien, removeEventListener: rien, documentElement: {}, namespaceURI: ESPACE_HTML, activeElement: null };
globalThis.window ??= { addEventListener: rien, removeEventListener: rien, document: documentFactice, event: undefined, HTMLIFrameElement: class {} };
documentFactice.defaultView = globalThis.window;
globalThis.document ??= documentFactice;
globalThis.IS_REACT_ACT_ENVIRONMENT = false;

const { createRoot } = createRequire(new URL("../../../package.json", import.meta.url))("react-dom/client");

export function creerRacine() {
  return createRoot({
    nodeType: 1,
    nodeName: "DIV",
    tagName: "DIV",
    namespaceURI: ESPACE_HTML,
    ownerDocument: documentFactice,
    childNodes: [],
    firstChild: null,
    addEventListener: rien,
    removeEventListener: rien,
    appendChild: rien,
    removeChild: rien,
  });
}
