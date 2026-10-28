import { useEffect, useState } from "react";

import type { ProfilCommunautaireApi } from "@sos-miam/commun/types/social";
import { utiliserCommunaute } from "~/hooks/utiliser-communaute";
import { utiliserSession } from "~/hooks/utiliser-session";
import { utiliserSuivisPersonnes } from "~/hooks/utiliser-suivis-personnes";

export type EtatProfilCommunautaire = {
  /** Ce que ton niveau permet de voir de cette personne (compte connecté), ou null */
  profil: ProfilCommunautaireApi | null;
  /** Vrai pendant la lecture sur le serveur : l'écran attend, au lieu d'afficher un faux « introuvable » */
  chargement: boolean;
};

/**
 * Le profil d'une personne, lu sur le serveur avec un compte connecté (GET /app/personnes/:id) : ce que ton niveau permet
 * (bande, public ou privé). Une fois lu, la communauté connaît la personne (trouverPote), avec ce que la bande voit en plus
 * (ville, points, lieux sauvés…), et les suivis connaissent sa relation avec toi (noterProfil). Visite ou toi-même :
 * rien à lire, la communauté du téléphone suffit. Une personne inconnue, sans profil social, ou qui t'a bloqué : profil null
 * (on ne dit jamais lequel des trois).
 */
export function utiliserProfilCommunautaire(id: string): EtatProfilCommunautaire {
  const { sociaux } = utiliserSession();
  const { source, moi, noterPersonne, noterListes } = utiliserCommunaute();
  const { noterProfil } = utiliserSuivisPersonnes();
  const aLire = source === "compte" && id !== "" && id !== moi.id;
  const [etat, setEtat] = useState<EtatProfilCommunautaire>({ profil: null, chargement: aLire });

  useEffect(() => {
    if (!aLire) return setEtat({ profil: null, chargement: false });
    let actif = true;
    setEtat((avant) => ({ ...avant, chargement: true }));
    void sociaux.social.lireProfil(id).then((r) => {
      if (!actif) return;
      if (!r.ok) return setEtat({ profil: null, chargement: false });
      const { profil } = r;
      noterPersonne(
        { id: profil.id, pseudo: profil.pseudo, prenom: profil.prenom, avatar: profil.avatar },
        {
          ...(profil.badges ? { badges: profil.badges } : {}),
          ...(profil.bande
            ? {
                ville: profil.bande.ville ?? "",
                points: profil.bande.points,
                pointsDuMois: profil.bande.pointsDuMois,
                rescoussesDuMois: profil.bande.rescoussesDuMois,
                lieuxSauves: profil.bande.lieuxSauves,
                gardes: profil.bande.gardes,
              }
            : {}),
        },
      );
      noterProfil(profil);
      // Ses listes que tu peux voir : l'écran de chacune les retrouve ensuite (lues en entier à l'ouverture)
      if (profil.listes) noterListes(profil.listes);
      setEtat({ profil, chargement: false });
    });
    return () => {
      actif = false;
    };
    // noterPersonne change à chaque relecture de la bande (noterProfil, lui, est stable) : la lecture ne repart pas pour autant
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [aLire, id, sociaux]);

  return etat;
}
