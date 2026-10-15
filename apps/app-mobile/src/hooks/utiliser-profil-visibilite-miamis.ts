import { useMemo } from "react";

import { calculerAge } from "@sos-miam/commun/regles/calculer-age";
import type { GenreProfil } from "@sos-miam/commun/types/genre";
import type { ProfilVisibiliteMiamis } from "@sos-miam/commun/types/sorties-miamis";
import { estNouveauDansLApp } from "~/fonctions/miamis/est-nouveau-dans-l-app";
import { utiliserLectureCommunaute } from "~/hooks/utiliser-lecture-communaute";
import { utiliserProfil } from "~/hooks/utiliser-profil";
import { utiliserSession } from "~/hooks/utiliser-session";

export function utiliserProfilVisibiliteMiamis(): { profil: ProfilVisibiliteMiamis; genre: GenreProfil | null; genreLu: boolean } {
  const { compte } = utiliserSession();
  const { profil } = utiliserProfil();
  const lecture = utiliserLectureCommunaute((service) => service.lireGenre());
  const genre = lecture.donnees?.genre ?? null;

  const visibilite = useMemo(
    (): ProfilVisibiliteMiamis => ({
      genre: genre?.choix ?? null,
      age: profil?.dateNaissance ? calculerAge(profil.dateNaissance) : null,
      nouveau: estNouveauDansLApp(compte?.creeLe),
      ambassadeur: compte?.ambassadeur?.statut === "actif",
    }),
    [genre?.choix, profil?.dateNaissance, compte],
  );

  return { profil: visibilite, genre, genreLu: lecture.donnees !== null };
}
