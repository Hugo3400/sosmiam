const DOUBLES = {
  react: new URL("../../annonces-app/doublures/react.mjs", import.meta.url).href,
  "react-dom/client": new URL("../../annonces-app/doublures/react-dom-client.mjs", import.meta.url).href,
  "~/hooks/utiliser-services": new URL("../doublures/utiliser-services.mjs", import.meta.url).href,
  "~/hooks/utiliser-session": new URL("../doublures/utiliser-session.mjs", import.meta.url).href,
};

export async function resolve(specifier, context, next) {
  if (DOUBLES[specifier]) return { url: DOUBLES[specifier], shortCircuit: true };
  return next(specifier, context);
}
