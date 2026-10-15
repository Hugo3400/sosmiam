import type { Request, Response } from "express";

import { validerNouvelleSortieMiamis } from "../../../../packages/commun/src/validation/valider-nouvelle-sortie-miamis.ts";
import type { NouvelleSortieMiamis } from "../../../../packages/commun/src/types/sorties-miamis.ts";
import type { ServicesCommunaute } from "../services/communaute-regles.ts";
import type { ContexteRoutesSociales, DependancesSocialApp } from "../routes/social-app.ts";
import { lireCorps } from "./comptes-champs.ts";
import { lireParametre, lirePersonneOuNull, moi, refuserCommunaute, repondreCommunaute } from "./communaute-champs.ts";
import { ChampInvalide } from "./gestion/lire-champs.ts";
import { lireIdClient, refuserSocial, RefusSocial } from "./social-champs.ts";

const SORTIE_REJOUEE: NouvelleSortieMiamis = {
  titre: "", description: "", quand: new Date(0).toISOString(), lieuId: 0, public: { type: "tous" }, etiquettes: [], places: 2, placeGardeePourNouveau: false, recurrente: false,
};

export function creerControleursSortiesMiamis(
  communaute: ServicesCommunaute, d: Pick<DependancesSocialApp, "relations">, contexte: Pick<ContexteRoutesSociales, "horloge" | "appliquer">,
) {
  const maintenant = () => new Date(contexte.horloge());
  const sorties = communaute.sorties;
  type Geste = (compteId: number, id: number, maintenant: Date) => ReturnType<typeof sorties.demander>;
  type GestePersonne = (compteId: number, id: number, personne: number | null, maintenant: Date) => ReturnType<typeof sorties.accepter>;

  const surLaSortie = (geste: Geste) => async (requete: Request, reponse: Response) => {
    const r = await geste(moi(reponse), lireParametre(requete, "id"), maintenant());
    await repondreCommunaute(reponse, contexte.appliquer, r, (ok) => ({ sortie: ok.sortie }));
  };
  const surUnePersonne = (geste: GestePersonne) => async (requete: Request, reponse: Response) => {
    const id = lireParametre(requete, "id");
    const personne = await lirePersonneOuNull(requete, d.relations);
    const r = await geste(moi(reponse), id, personne, maintenant());
    await repondreCommunaute(reponse, contexte.appliquer, r, (ok) => ({ sortie: ok.sortie }));
  };

  return {
    async lister(_requete: Request, reponse: Response) {
      reponse.json({ ok: true, sorties: await sorties.lister(moi(reponse), maintenant()) });
    },

    async lire(requete: Request, reponse: Response) {
      const sortie = await sorties.lire(moi(reponse), lireParametre(requete, "id"), maintenant());
      if (!sortie) throw refuserSocial("sortie-inconnue");
      reponse.json({ ok: true, sortie });
    },

    async creer(requete: Request, reponse: Response) {
      const compteId = moi(reponse);
      const cle = lireIdClient(requete);
      const quand = maintenant();
      let nouvelle = SORTIE_REJOUEE;
      if ((await d.relations.lireIdempotence(compteId, cle, "miamis")) === null) {
        const lue = validerNouvelleSortieMiamis(lireCorps(requete), quand);
        if (!lue.ok) throw lue.raison === "mot-interdit" ? new RefusSocial("message-refuse", 400, lue.champ) : new ChampInvalide(lue.champ);
        nouvelle = lue.sortie;
      }
      const r = await sorties.creer(compteId, nouvelle, cle, quand);
      if (!r.ok) return refuserCommunaute(reponse, r);
      reponse.status(r.cree ? 201 : 200).json({ ok: true, sortie: r.sortie });
    },

    demander: surLaSortie((c, id, m) => sorties.demander(c, id, m)),
    annulerDemande: surLaSortie((c, id, m) => sorties.annulerDemande(c, id, m)),
    quitter: surLaSortie((c, id, m) => sorties.quitter(c, id, m)),
    validerPresence: surLaSortie((c, id, m) => sorties.validerPresence(c, id, m)),
    accepter: surUnePersonne((c, id, p, m) => sorties.accepter(c, id, p, m)),
    refuser: surUnePersonne((c, id, p, m) => sorties.refuser(c, id, p, m)),
    retirer: surUnePersonne((c, id, p, m) => sorties.retirer(c, id, p, m)),

    async annuler(requete: Request, reponse: Response) {
      const r = await sorties.annuler(moi(reponse), lireParametre(requete, "id"), maintenant());
      await repondreCommunaute(reponse, contexte.appliquer, r, () => ({}));
    },
  };
}
