import { useLayoutEffect, useMemo, useRef, useState, type ReactNode } from "react";

import { creerServicesApi } from "@sos-miam/commun/client-api/api/creer-services-api";

import { AGE_ALCOOL } from "@sos-miam/commun/regles/ages";
import { calculerAge } from "@sos-miam/commun/regles/calculer-age";
import type { Profil } from "@sos-miam/commun/types/profil";
import type { RolesCompte } from "@sos-miam/commun/types/roles";
import { utiliserModes } from "~/hooks/utiliser-modes";
import { utiliserProfil } from "~/hooks/utiliser-profil";
import { utiliserSession } from "~/hooks/utiliser-session";
import { ContexteServices, type ValeurServices } from "~/hooks/utiliser-services";
import { choisirServices } from "~/services/choisir-services";
import type { ClientDemo } from "~/services/demo/types-demo";
import type { Avatar } from "~/stockage/avatar-local";
import { ROLES_VIDES } from "~/stockage/roles-demo";

/** « Moi » vu par les services : prénom, initiale du nom, emoji (une photo n'est jamais montrée au lieu) et majorité. */
function construireClient(profil: Profil | null, avatar: Avatar): ClientDemo | null {
  if (!profil) return null;
  const nom = profil.nom?.trim();
  return {
    cle: "moi",
    prenom: profil.prenom,
    initialeNom: nom ? nom.charAt(0).toLocaleUpperCase("fr-FR") : null,
    avatar: avatar.type === "emoji" ? avatar.emoji : "🙂",
    majeur: calculerAge(profil.dateNaissance) >= AGE_ALCOOL,
  };
}

/**
 * Crée les services une seule fois pour toute l'app et les fournit : ceux de l'API dès qu'un vrai compte est connecté, sinon la
 * démo en développement, et des services « indisponibles » dans une version publiée sans compte. Ils sont fournis
 * (voir utiliserServices). Les services relisent, à chaque appel, qui tu es (prénom, initiale, emoji, majorité) et tes rôles :
 * ce que voit l'équipe d'un lieu, c'est seulement le prénom, l'initiale et l'emoji, jamais l'âge.
 */
export function FournisseurServices({ children }: { children: ReactNode }) {
  const { profil, avatar } = utiliserProfil();
  const { roles, majeur } = utiliserModes();
  // Un 15-17 ans n'a aucun rôle, même si des rôles de démo traînent sur le téléphone : les services refusent alors tout geste pro
  const rolesPermis = majeur ? roles : ROLES_VIDES;

  const client = useRef<ClientDemo | null>(construireClient(profil, avatar));
  const rolesActuels = useRef<RolesCompte>(rolesPermis);
  // Avant les effets des écrans : un appel lancé juste après un changement de profil ou de rôle voit déjà le nouveau
  useLayoutEffect(() => {
    client.current = construireClient(profil, avatar);
    rolesActuels.current = rolesPermis;
  }, [profil, avatar, rolesPermis]);

  // Une seule fois : le magasin de la démo et ses écouteurs doivent rester les mêmes tant que l'app tourne
  const [sansCompte] = useState<ValeurServices>(() =>
    choisirServices({ lireClient: () => client.current, lireRoles: () => rolesActuels.current }),
  );

  // Un vrai compte connecté : l'API (le serveur revérifie tout, rôles et âge compris) ; jamais d'outils de démo
  const { connecte, client: clientHttp, compte } = utiliserSession();
  const statutAmbassadeur = useRef(compte?.ambassadeur?.statut ?? null);
  useLayoutEffect(() => {
    statutAmbassadeur.current = compte?.ambassadeur?.statut ?? null;
  }, [compte]);
  const avecCompte = useMemo<ValeurServices>(
    () => ({ services: creerServicesApi(clientHttp, { lireStatutAmbassadeur: () => statutAmbassadeur.current }), outilsDemo: null }),
    [clientHttp],
  );

  return <ContexteServices.Provider value={connecte ? avecCompte : sansCompte}>{children}</ContexteServices.Provider>;
}
