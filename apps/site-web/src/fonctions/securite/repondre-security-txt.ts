import { HOTE_AMBASSADEUR, HOTE_PRO } from "../hotes/choisir-redirection-hote.ts";
import { creerFichierSecurityTxt } from "./creer-fichier-security-txt.ts";

const ADRESSE_CANONIQUE = "https://sosmiam.fr/.well-known/security.txt";

export function repondreSecurityTxt(requete: Request, maintenant = new Date()): Response {
  const hote = new URL(requete.url).hostname;
  if (hote === HOTE_AMBASSADEUR || hote === HOTE_PRO) {
    return new Response(null, { status: 301, headers: { Location: ADRESSE_CANONIQUE, "Cache-Control": "public, max-age=86400" } });
  }
  return new Response(creerFichierSecurityTxt(maintenant), {
    headers: { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "public, max-age=86400" },
  });
}
