import { Copy, Download, RefreshCw, Save } from "lucide-react";
import { useEffect, useState } from "react";

import { Badge } from "~/composants/interface/Badge.tsx";
import { Bouton } from "~/composants/interface/Bouton.tsx";
import { Carte } from "~/composants/interface/Carte.tsx";
import { CaseACocher } from "~/composants/interface/CaseACocher.tsx";
import { Champ } from "~/composants/interface/Champ.tsx";
import { dessinerQrSvg } from "~/fonctions/qr/dessiner-qr-svg.ts";
import { simplifierNom } from "~/fonctions/texte/simplifier-nom.ts";
import { expliquerErreur } from "~/fonctions/texte/expliquer-erreur.ts";
import { utiliserChargement } from "~/hooks/utiliser-chargement.ts";
import { ErreurApi } from "~/services/client-gestion.ts";
import { copier, enregistrerFichier } from "~/services/systeme.ts";
import { changerCodeVitrine, construireLienVitrine, RAYON_VALIDATION, reglerValidationLieu, lireValidationLieu } from "~/services/validation-lieu.ts";

/**
 * Dans la fiche d'un lieu : est-ce qu'il valide les visites (QR du comptoir, position vérifiée dans le rayon), et son QR de
 * vitrine à imprimer (il ouvre la fiche dans l'app, il ne valide jamais). C'est l'équipe SOS Miam qui décide (Hugo, 9 octobre
 * 2026). Enregistré à part du reste de la fiche, tout de suite.
 */
export function ValidationVisitesLieu({ lieuId, nom }: { lieuId: number; nom: string }) {
  const { donnees, erreur, recharger } = utiliserChargement(() => lireValidationLieu(lieuId), [lieuId]);
  const [active, setActive] = useState(false);
  const [rayon, setRayon] = useState("");
  const [enCours, setEnCours] = useState<"regler" | "code" | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  useEffect(() => {
    setActive(donnees?.validation?.validationActive ?? false);
    setRayon(donnees?.validation?.rayonM ? String(donnees.validation.rayonM) : "");
  }, [donnees]);
  if (!donnees) return erreur ? <Carte titre="Validation des visites"><p className="text-sm text-tomate">{expliquerErreur(erreur)}</p></Carte> : null;

  const { validation, publie, positionConnue, comptesPro } = donnees;
  const rayonM = rayon.trim() === "" ? null : Number(rayon);
  const rayonInvalide = rayonM !== null && (!Number.isInteger(rayonM) || rayonM < RAYON_VALIDATION.min || rayonM > RAYON_VALIDATION.max);
  const change = active !== (validation?.validationActive ?? false) || rayonM !== (validation?.rayonM ?? null);
  const lien = validation ? construireLienVitrine(validation.codePublic) : null;
  const obstacles = [
    !publie && "La fiche n'est pas publiée : rien ne se valide tant qu'elle ne l'est pas.",
    !positionConnue && "Pas de position sur la fiche : impossible de vérifier que le client est bien dans le lieu.",
    comptesPro === 0 && "Aucun compte pro validé : personne ne peut montrer le QR du comptoir.",
  ].filter((texte): texte is string => Boolean(texte));

  async function agir(quoi: "regler" | "code", action: () => Promise<unknown>, reussite: string) {
    setEnCours(quoi);
    setMessage(null);
    try {
      await action();
      setMessage(reussite);
      recharger();
    } catch (probleme) {
      setMessage(expliquerErreur(probleme instanceof ErreurApi ? probleme : null));
    } finally {
      setEnCours(null);
    }
  }

  return (
    <Carte titre={<span className="flex items-center gap-2">Validation des visites {validation?.validationActive ? <Badge ton="vert">Active</Badge> : <Badge>Coupée</Badge>}</span>}>
      <div className="grid gap-4">
        {obstacles.length > 0 && (
          <ul className="grid gap-1 rounded-xl border border-ligne px-4 py-3 text-[13px]">
            {obstacles.map((texte) => <li key={texte}>⚠️ {texte}</li>)}
          </ul>
        )}
        <div className="grid items-end gap-4 md:grid-cols-[1fr_220px]">
          <CaseACocher
            libelle="Ce lieu valide les visites"
            coche={active}
            onChange={setActive}
            aide="L'équipe du lieu montre son QR au comptoir, le client le scanne et sa position est vérifiée."
          />
          <Champ
            libelle="Rayon de vérification (m)"
            type="number"
            min={RAYON_VALIDATION.min}
            max={RAYON_VALIDATION.max}
            valeur={rayon}
            placeholder={`${RAYON_VALIDATION.defaut} (par défaut)`}
            onChange={setRayon}
            erreur={rayonInvalide ? `Entre ${RAYON_VALIDATION.min} et ${RAYON_VALIDATION.max} m, ou vide.` : null}
          />
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Bouton petit icone={Save} chargement={enCours === "regler"} desactive={!change || rayonInvalide} onClick={() =>
            agir("regler", () => reglerValidationLieu(lieuId, { validationActive: active, rayonM }), active ? "Validation enregistrée ✅" : "Validation coupée.")
          }>
            Enregistrer la validation
          </Bouton>
          {message && <span role="status" className="text-[13px] font-semibold">{message}</span>}
        </div>
        {validation && lien && (
          <div className="flex flex-wrap items-center gap-4 border-t border-ligne pt-4">
            <img src={`data:image/svg+xml;utf8,${encodeURIComponent(dessinerQrSvg(lien))}`} alt={`QR de vitrine vers ${lien}`} className="size-32 rounded-lg border border-ligne" />
            <div className="grid min-w-0 flex-1 gap-2">
              <p className="text-sm font-semibold">QR de vitrine</p>
              <p className="text-[13px] text-gris">À coller en vitrine ou sur les tables : il ouvre la fiche du lieu dans l'app. Il ne valide jamais une visite.</p>
              <code className="truncate text-[13px]">{lien}</code>
              <div className="flex flex-wrap gap-2">
                <Bouton petit icone={Download} onClick={() => void enregistrerFichier(`qr-vitrine-${simplifierNom(nom).replace(/[^a-z0-9]+/g, "-")}.svg`, dessinerQrSvg(lien), "image/svg+xml")}>
                  Enregistrer le QR
                </Bouton>
                <Bouton petit icone={Copy} onClick={() => void copier(lien).then(() => setMessage("Lien copié."))}>Copier le lien</Bouton>
                <Bouton petit variante="discret" icone={RefreshCw} chargement={enCours === "code"} onClick={() => {
                  if (!window.confirm("Changer le code ? Le QR déjà imprimé ne mènera plus nulle part : il faudra réimprimer le nouveau.")) return;
                  void agir("code", () => changerCodeVitrine(lieuId), "Nouveau code : pense à réimprimer le QR.");
                }}>
                  Changer le code
                </Bouton>
              </div>
            </div>
          </div>
        )}
      </div>
    </Carte>
  );
}
