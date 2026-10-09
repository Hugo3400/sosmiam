import { UserX } from "lucide-react";
import { useState } from "react";

import { Badge } from "~/composants/interface/Badge.tsx";
import { Bouton } from "~/composants/interface/Bouton.tsx";
import { Carte } from "~/composants/interface/Carte.tsx";
import { expliquerErreur } from "~/fonctions/texte/expliquer-erreur.ts";
import { formaterDate } from "~/fonctions/texte/formater-date.ts";
import { utiliserChargement } from "~/hooks/utiliser-chargement.ts";
import { ErreurApi } from "~/services/client-gestion.ts";
import { deciderRattachement, listerRattachements } from "~/services/rattachements.ts";

const STATUTS = { "en-attente": "à valider", valide: "validé", refuse: "refusé", retire: "retiré" } as const;

/** Dans la fiche d'un lieu : qui le gère sur SOS Miam (gérant, équipe), et retirer un accès. Lieu vérifié ✓ si l'un est validé. */
export function ComptesProDuLieu({ lieuId }: { lieuId: number }) {
  const { donnees, recharger } = utiliserChargement(() => listerRattachements({ lieu: lieuId }), [lieuId]);
  const [texte, setTexte] = useState<string | null>(null);
  if (!donnees?.length) return null;
  const verifie = donnees.some((r) => r.statut === "valide");

  async function retirer(id: number, prenom: string) {
    if (!window.confirm(`Retirer l'accès de ${prenom} à cette fiche ? (sans mail : écris-lui depuis sa fiche si besoin)`)) return;
    try {
      await deciderRattachement(id, "retirer", null, false);
      setTexte(`Accès de ${prenom} retiré.`);
      recharger();
    } catch (probleme) {
      setTexte(expliquerErreur(probleme instanceof ErreurApi ? probleme : null));
    }
  }

  return (
    <Carte titre={<span className="flex items-center gap-2">Comptes pro {verifie && <Badge ton="vert">Vérifié ✓</Badge>}</span>}>
      <ul className="grid gap-1 text-sm">
        {donnees.map((r) => (
          <li key={r.id} className="flex flex-wrap items-center gap-2">
            <strong>{r.compte.prenom}</strong>
            <span className="text-gris">{r.compte.email}</span>
            <Badge ton="contour">{r.role === "gerant" ? "Gérant" : "Équipe"}</Badge>
            <span className="text-gris">· {STATUTS[r.statut]}{r.decideLe ? ` le ${formaterDate(r.decideLe)}` : ""}</span>
            {r.statut === "valide" && <span className="ml-auto"><Bouton petit variante="discret" icone={UserX} onClick={() => retirer(r.id, r.compte.prenom)}>Retirer</Bouton></span>}
          </li>
        ))}
      </ul>
      {texte && <p role="status" className="mt-2 text-sm font-semibold">{texte}</p>}
    </Carte>
  );
}
