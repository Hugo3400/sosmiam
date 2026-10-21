import { randomBytes } from "node:crypto";
import { PassThrough } from "node:stream";

import type { EntryContext } from "react-router";
import { createReadableStreamFromReadable } from "@react-router/node";
import { ServerRouter } from "react-router";
import { isbot } from "isbot";
import type { RenderToPipeableStreamOptions } from "react-dom/server";
import { renderToPipeableStream } from "react-dom/server";

import { creerEntetesSecurite } from "~/fonctions/securite/creer-entetes-securite";

export const streamTimeout = 5_000;

export default function handleRequest(requete: Request, statut: number, entetes: Headers, contexteRouteur: EntryContext) {
  const nonce = randomBytes(16).toString("base64");
  for (const [nom, valeur] of Object.entries(creerEntetesSecurite(nonce, import.meta.env.DEV))) entetes.set(nom, valeur);

  if (requete.method.toUpperCase() === "HEAD") {
    return new Response(null, { status: statut, headers: entetes });
  }

  return new Promise<Response>((resoudre, rejeter) => {
    let enveloppeRendue = false;
    const navigateur = requete.headers.get("user-agent");
    const attente: keyof RenderToPipeableStreamOptions =
      (navigateur && isbot(navigateur)) || contexteRouteur.isSpaMode ? "onAllReady" : "onShellReady";

    let minuteur: ReturnType<typeof setTimeout> | undefined = setTimeout(() => abort(), streamTimeout + 1000);

    const { pipe, abort } = renderToPipeableStream(<ServerRouter context={contexteRouteur} url={requete.url} nonce={nonce} />, {
      nonce,
      [attente]() {
        enveloppeRendue = true;
        const corps = new PassThrough({
          final(fini) {
            clearTimeout(minuteur);
            minuteur = undefined;
            fini();
          },
        });
        const flux = createReadableStreamFromReadable(corps);
        entetes.set("Content-Type", "text/html");
        pipe(corps);
        resoudre(new Response(flux, { headers: entetes, status: statut }));
      },
      onShellError(erreur: unknown) {
        rejeter(erreur);
      },
      onError(erreur: unknown) {
        statut = 500;
        if (enveloppeRendue) console.error(erreur);
      },
    });
  });
}
